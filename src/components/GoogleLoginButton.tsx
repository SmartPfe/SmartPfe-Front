/// <reference types="vite/client" />
import { apiMessage, type ApiMessage } from "@/lib/apiMessage";

import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchApi } from "../lib/api";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onError: (message: ApiMessage) => void;
  onLoading: (isLoading: boolean) => void;
  mode?: "login" | "connect";
  currentPassword?: string;
  onConnected?: (profile: any) => void;
}

export default function GoogleLoginButton({ onError, onLoading, mode = "login", currentPassword, onConnected }: GoogleLoginButtonProps) {
  const { t, i18n } = useTranslation("auth");
  const navigate = useNavigate();
  const buttonId = useId();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const callbackRef = useRef<(response: any) => void>(async () => undefined);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    let interval: any;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        setIsGoogleLoaded(true);

        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response: any) => callbackRef.current(response),
        });
      }
    };

    initializeGoogle();
    interval = setInterval(initializeGoogle, 150);

    return () => clearInterval(interval);
  }, [googleClientId]);

  useEffect(() => {
    if (!isGoogleLoaded || !window.google?.accounts?.id) return;
    const btnElement = document.getElementById(buttonId);
    if (!btnElement) return;

    const uiLanguage = (i18n.resolvedLanguage || i18n.language || "fr").toLowerCase().startsWith("en") ? "en" : "fr";
    btnElement.innerHTML = "";
    window.google.accounts.id.renderButton(btnElement, {
      theme: "outline",
      size: "large",
      shape: "rectangular",
      width: "360",
      logo_alignment: "left",
      text: "continue_with",
      locale: uiLanguage,
    });
  }, [isGoogleLoaded, i18n.resolvedLanguage, i18n.language, buttonId]);

  const handleGoogleCallback = async (response: any) => {
    onLoading(true);
    onError("");
    try {
      if (!response.credential) {
        throw new Error(t("google.noCredential"));
      }

      const data = await fetchApi(mode === "connect" ? "/auth/google/connect" : "/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response.credential, ...(mode === "connect" ? { currentPassword } : {}) }),
      });

      // Save token and user details to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          _id: data._id,
          fullName: data.fullName,
          email: data.email,
          avatar: data.avatar,
          authProvider: data.authProvider || "google",
          googleConnected: data.googleConnected, hasPassword: data.hasPassword,
          googleAccount: data.googleAccount,
          emailVerified: data.emailVerified !== false,
          hasCompletedOnboarding: data.hasCompletedOnboarding,
          role: data.role || "etudiant",
          uiLanguage: data.uiLanguage || "fr",
        })
      );

      if (mode === "connect") {
        window.dispatchEvent(new Event("user-updated"));
        onConnected?.(data);
        return;
      }

      if (data.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      if (data.hasCompletedOnboarding) {
        navigate("/workspace/overview");
      } else {
        navigate("/onboarding/1");
      }
    } catch (err: any) {
      if (mode === "login" && err.requiresEmailVerification) {
        sessionStorage.setItem("pendingVerificationEmail", err.email);
        navigate("/verify-email", { state: { email: err.email, devVerificationCode: err.devVerificationCode } });
        return;
      }
      console.error("Google authentication error:", err);
      onError(err.message ? apiMessage(err) : t("google.failed"));
    } finally {
      onLoading(false);
    }
  };

  callbackRef.current = handleGoogleCallback;

  return (
    <div className="w-full flex items-center justify-center min-h-[44px]">
      <div
        id={buttonId}
        className="w-full flex justify-center overflow-hidden rounded-xl transition-opacity duration-200"
        style={{ opacity: isGoogleLoaded ? 1 : 0.5 }}
      />
    </div>
  );
}
