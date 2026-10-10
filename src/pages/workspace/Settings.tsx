import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import LanguageSelector from "@/components/LanguageSelector";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function Settings() {
  const { t } = useTranslation<'settings'>("settings");
  const { data } = useOnboarding();
  const { isDarkMode, toggleTheme } = useTheme();
  const [downloaded, setDownloaded] = useState(false);

  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `smartpfe_project_config_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const projectTitle = data?.basics?.title?.trim() || t("workspace.untitledProject");
  const university = data?.basics?.university?.trim() || t("workspace.notSpecified");
  const methodology = data?.technicalContext?.methodology || t("workspace.defaultMethodology");
  const language = data?.basics?.language || "English";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col h-full pt-1 pb-20 font-sans">
      {/* Page Header */}
      <div className="mb-7">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          {t("general.title")}
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant leading-relaxed">
          {t("general.subtitle")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Preferences */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-2.5">
            {t("general.preferencesGroup")}
          </h2>
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest divide-y divide-outline-variant/40 overflow-hidden shadow-2xs">
            {/* Interface Language Row */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-on-surface">
                  {t("general.language")}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-md">
                  {t("general.languageDescription")}
                </p>
              </div>
              <div className="shrink-0">
                <LanguageSelector variant="minimal" />
              </div>
            </div>

            {/* Appearance / Theme Row */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-on-surface">
                  {t("general.appearance")}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {t("general.appearanceDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "w-11 h-6 rounded-full p-0.5 transition-colors relative flex items-center shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  isDarkMode ? "bg-primary" : "bg-outline-variant"
                )}
                aria-label={t("workspace.toggleTheme")}
                aria-pressed={isDarkMode}
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-white flex items-center justify-center transition-transform transform shadow-xs text-slate-800",
                    isDarkMode ? "translate-x-5" : "translate-x-0"
                  )}
                >
                  <HugeiconsIcon icon={isDarkMode ? "moon" : "sun"} size={11} strokeWidth={2.5} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Project Context */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-2.5">
            {t("general.projectGroup")}
          </h2>
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-semibold text-on-surface truncate" title={projectTitle}>
                    {projectTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {t("workspace.synced")}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                  <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/50 text-[11px] font-medium">
                    {university}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/50 text-[11px] font-medium">
                    {methodology}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container border border-outline-variant/50 text-[11px] font-medium">
                    {language}
                  </span>
                </div>
              </div>
              <Link
                to="/workspace/settings/onboarding"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-outline-variant/80 bg-surface hover:bg-surface-container-high/60 text-xs font-semibold text-on-surface transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
              >
                <span>{t("workspace.edit")}</span>
                <HugeiconsIcon icon="arrow-right" size={13} strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>

        {/* Section 3: Data & Backup */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant px-1 mb-2.5">
            {t("general.dataGroup")}
          </h2>
          <div className="rounded-2xl border border-outline-variant/70 bg-surface-container-lowest overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-on-surface">
                  {t("general.exportSnapshot")}
                </h3>
                <p className="text-xs text-on-surface-variant max-w-md">
                  {t("general.exportSnapshotDescription")}
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className={cn(
                  "inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all shadow-2xs shrink-0 self-start sm:self-auto",
                  downloaded
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                    : "border-outline-variant/80 bg-surface hover:bg-surface-container-high/60 text-on-surface"
                )}
              >
                <HugeiconsIcon icon={downloaded ? "checkmark-circle-02" : "download"} size={14} strokeWidth={2} />
                <span>{downloaded ? t("general.exportedSuccess") : t("general.exportButton")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
