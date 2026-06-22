/// <reference types="vite/client" />
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../lib/api";

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onError: (message: string) => void;
  onLoading: (isLoading: boolean) => void;
}

export default function GoogleLoginButton({ onError, onLoading }: GoogleLoginButtonProps) {
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    let interval: any;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });

        const btnElement = document.getElementById("google-signin-btn");
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: "outline",
            size: "large",
            width: "370", // matches login container width roughly
            logo_alignment: "left",
            text: "continue_with",
          });
        }
      }
    };

    initializeGoogle();
    interval = setInterval(initializeGoogle, 150);

    return () => clearInterval(interval);
  }, [googleClientId]);

  const handleGoogleCallback = async (response: any) => {
    onLoading(true);
    onError("");
    try {
      if (!response.credential) {
        throw new Error("No credential returned from Google");
      }

      const data = await fetchApi("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential: response.credential }),
      });

      // Save token and user details to localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ fullName: data.fullName, email: data.email })
      );

      // Redirect to onboarding
      navigate("/onboarding/1");
    } catch (err: any) {
      console.error("Google authentication error:", err);
      onError(err.message || "Failed to authenticate with Google. Please try again.");
    } finally {
      onLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div id="google-signin-btn" className="w-full max-w-[370px]"></div>
    </div>
  );
}
