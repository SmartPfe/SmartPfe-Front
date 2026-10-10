import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/LanguageSelector";
import AccountSettings from "@/pages/workspace/AccountSettings";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import { useTheme } from "@/lib/theme";

export default function AdminSettings() {
  const { t } = useTranslation("auth");
  const { t: settings } = useTranslation("settings");
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <AccountSettings backTo="/admin/dashboard" backLabel={t("account.backToAdmin")} memberLabel={t("account.administrator")}>
      <section aria-labelledby="admin-interface-preferences" className="mt-10 space-y-4 border-t border-outline-variant/60 pt-8">
        <h2 id="admin-interface-preferences" className="text-lg font-semibold text-on-surface">{settings("admin.interfacePreferences")}</h2>
        <LanguageSelector description={settings("admin.languageHelp")} />
        <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><HugeiconsIcon icon={isDarkMode ? "moon" : "sun"} size={18} /></span>
            <div><h3 className="text-sm font-semibold">{settings("workspace.themeMode")}</h3><p className="mt-1 text-xs text-on-surface-variant">{settings(isDarkMode ? "workspace.darkThemeActive" : "workspace.lightThemeActive")}</p></div>
          </div>
          <button type="button" onClick={toggleTheme} aria-label={settings("workspace.toggleTheme")} aria-pressed={isDarkMode} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${isDarkMode ? "bg-primary" : "bg-outline-variant"}`}>
            <span aria-hidden="true" className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isDarkMode ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
      </section>
    </AccountSettings>
  );
}
