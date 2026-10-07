import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  NonFunctionalRequirement,
  RequirementPriority,
  RequirementStatus,
  getLanguageLabel,
  renumberRequirements,
  useNonFunctionalRequirements,
} from "./hooks/useNonFunctionalRequirements";
import AiBackgroundBanner from "@/components/ai/AiBackgroundBanner";
import HugeiconsIcon from "@/components/ui/HugeiconsIcon";
import SaveStatusHeader from "@/components/ui/SaveStatusHeader";
import AiActionToolbar from "@/components/ai/AiActionToolbar";

const categoryStyles: Record<string, { icon: string; color: string; bg: string }> = {
  Performance: { icon: "speed", color: "text-secondary", bg: "bg-secondary/10" },
  Scalability: { icon: "trending-up", color: "text-secondary", bg: "bg-secondary/10" },
  Security: { icon: "shield-lock", color: "text-primary", bg: "bg-primary/10" },
  Privacy: { icon: "lock", color: "text-primary", bg: "bg-primary/10" },
  Usability: { icon: "touch-app", color: "text-[#d97706]", bg: "bg-[#fef3c7]/60" },
  Accessibility: { icon: "accessibility-new", color: "text-[#d97706]", bg: "bg-[#fef3c7]/60" },
  Reliability: { icon: "verified", color: "text-[#059669]", bg: "bg-[#d1fae5]/60" },
  Availability: { icon: "cloud-done", color: "text-[#059669]", bg: "bg-[#d1fae5]/60" },
  Maintainability: { icon: "build", color: "text-on-surface", bg: "bg-surface-container" },
  Compatibility: { icon: "devices", color: "text-on-surface", bg: "bg-surface-container" },
};

const priorities: Record<RequirementPriority, string> = {
  "Must Have": "bg-error/10 text-error border-error/20",
  "Should Have": "bg-secondary/10 text-secondary border-secondary/20",
  "Could Have": "bg-primary/10 text-primary border-primary/20",
  "Won't Have": "bg-surface-container text-on-surface-variant border-outline-variant/60",
};

const priorityOptions: RequirementPriority[] = ["Must Have", "Should Have", "Could Have", "Won't Have"];
const statusOptions: RequirementStatus[] = ["Draft", "In Review", "Approved"];

const createEmptyRequirement = (index: number, category = "Performance"): NonFunctionalRequirement => ({
  localId: `new-${Date.now()}`,
  code: `NFR-${String(index + 1).padStart(2, "0")}`,
  category,
  title: "",
  description: "",
  priority: "Should Have",
  status: "Draft",
});

export default function NonFunctionalRequirements() {
  const { t } = useTranslation("planning");
  const {
    requirements,
    setRequirements,
    loading,
    saveStatus,
    aiState,
    isAiBusy,
    suggestion,
    error,
    markUnsaved,
    saveRequirements,
    generateWithAi,
    refineWithAi,
    translateWithAi,
    cancelAi,
    projectLanguage,
    nonFunctionalRequirementsLanguage,
    acceptSuggestion,
    discardSuggestion,
    dismissError,
  } = useNonFunctionalRequirements();
  const localizedProjectLanguage = getPlanningLanguageLabel(projectLanguage, t);
  const displayError = resolveNonFunctionalError(error, t);

  const [editingId, setEditingId] = useState<string | null>(null);

  const shouldShowTranslate = Boolean(
    projectLanguage &&
    requirements.length > 0 &&
    nonFunctionalRequirementsLanguage !== projectLanguage
  );

  const groupedRequirements = useMemo(() => groupRequirements(requirements), [requirements]);
  const groupedSuggestion = useMemo(() => groupRequirements(suggestion || []), [suggestion]);

  const updateRequirement = (id: string, updates: Partial<NonFunctionalRequirement>) => {
    setRequirements((prev) =>
      prev.map((requirement) =>
        getRequirementKey(requirement) === id ? { ...requirement, ...updates } : requirement
      )
    );
    markUnsaved();
  };

  const addRequirement = (category = "Performance") => {
    const requirement = createEmptyRequirement(requirements.length, category);
    setRequirements((prev) => [...prev, requirement]);
    setEditingId(getRequirementKey(requirement));
    markUnsaved();
  };

  const deleteRequirement = (id: string) => {
    setRequirements((prev) => renumberRequirements(prev.filter((requirement) => getRequirementKey(requirement) !== id)));
    if (editingId === id) setEditingId(null);
    markUnsaved();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-on-surface-variant font-medium text-sm">{t("nonFunctional.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto flex flex-col h-full pb-32">
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{t("nonFunctional.eyebrow")}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface flex items-center">
            {t("nonFunctional.title")}
            <InfoTooltip
              label={t("nonFunctional.tooltipLabel")}
              tooltip={t("nonFunctional.tooltip")}
            />
          </h1>
          <p className="text-sm text-on-surface-variant max-w-[42rem] mt-1.5 leading-relaxed">
            {t("nonFunctional.description")}
          </p>
        </div>

        {/* Global SaveStatusHeader */}
        <SaveStatusHeader
          status={saveStatus}
          onSave={() => saveRequirements(requirements, true)}
          isBusy={isAiBusy}
        />
      </div>

      {/* Background AI Progress Banner */}
      <AiBackgroundBanner
        isVisible={isAiBusy}
        moduleName={t("nonFunctional.title")}
        action={aiState}
        onCancel={cancelAi}
      />

      {/* Global AI Action Toolbar */}
      <AiActionToolbar
        onGenerate={generateWithAi}
        onRefine={refineWithAi}
        onTranslate={translateWithAi}
        isGenerating={aiState === "generating"}
        isRefining={aiState === "refining"}
        isTranslating={aiState === "translating"}
        isBusy={isAiBusy || aiState === "suggestion_ready"}
        canRefine={requirements.length > 0}
        refineDisabledTitle={t("nonFunctional.refineDisabled")}
        refinePlaceholder={t("nonFunctional.refinePlaceholder")}
        showTranslate={shouldShowTranslate}
        translateLabel={t("common.translateTo", { language: localizedProjectLanguage })}
        primaryAction={
          <button
            type="button"
            onClick={() => addRequirement()}
            disabled={isAiBusy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-9 px-4 bg-primary text-on-primary rounded-lg text-[13px] font-semibold tracking-tight hover:bg-primary/90 transition-all duration-150 shadow-2xs active:scale-[0.98] disabled:opacity-50 select-none cursor-pointer"
          >
            <HugeiconsIcon icon="add" size={16} strokeWidth={2} />
            <span>{t("nonFunctional.add")}</span>
          </button>
        }
      />

      {displayError && (
        <div className="mb-6 p-3.5 rounded-xl bg-error-container text-on-error-container border border-error/20 flex items-center justify-between gap-3 shadow-2xs">
          <p className="text-sm font-medium">{displayError}</p>
          <button onClick={dismissError} className="shrink-0 text-xs font-semibold underline hover:no-underline">
            {t("common.dismiss")}
          </button>
        </div>
      )}

      {/* AI Suggestion Ready */}
      {aiState === "suggestion_ready" && suggestion && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon="ai-spark" size={18} strokeWidth={1.8} className="text-primary" />
                <h3 className="text-sm font-bold text-on-surface">{t("nonFunctional.suggestionTitle")}</h3>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {t("nonFunctional.suggestionDescription")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={discardSuggestion}
                className="h-8 px-3.5 rounded-lg border border-outline-variant bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                {t("nonFunctional.discard")}
              </button>
              <button
                onClick={acceptSuggestion}
                className="h-8 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-all shadow-2xs cursor-pointer"
              >
                {t("nonFunctional.accept")}
              </button>
            </div>
          </div>
          <RequirementGrid
            groupedRequirements={groupedSuggestion}
            editingId={null}
            readOnly
            onEdit={() => {}}
            onDelete={() => {}}
            onUpdate={() => {}}
            onAdd={() => {}}
          />
        </div>
      )}

      {/* Grid or Empty State */}
      {requirements.length === 0 ? (
        <button
          onClick={() => addRequirement()}
          className="rounded-2xl border-2 border-dashed border-outline-variant/80 bg-surface-container-lowest/50 hover:bg-surface-container-low/40 transition-all py-16 flex flex-col items-center justify-center gap-3 text-on-surface-variant group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/80 flex items-center justify-center group-hover:scale-110 group-hover:text-primary transition-all duration-200">
            <HugeiconsIcon icon="add" size={22} strokeWidth={2} />
          </div>
          <span className="font-semibold text-sm text-on-surface">{t("nonFunctional.emptyTitle")}</span>
          <span className="text-xs text-on-surface-variant/70">{t("nonFunctional.emptyDescription")}</span>
        </button>
      ) : (
        <RequirementGrid
          groupedRequirements={groupedRequirements}
          editingId={editingId}
          onEdit={setEditingId}
          onDelete={deleteRequirement}
          onUpdate={updateRequirement}
          onAdd={addRequirement}
        />
      )}
    </div>
  );
}

function RequirementGrid({
  groupedRequirements,
  editingId,
  readOnly = false,
  onEdit,
  onDelete,
  onUpdate,
  onAdd,
}: {
  groupedRequirements: Array<{ category: string; requirements: NonFunctionalRequirement[] }>;
  editingId: string | null;
  readOnly?: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NonFunctionalRequirement>) => void;
  onAdd: (category: string) => void;
}) {
  const { t } = useTranslation("planning");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {groupedRequirements.map((group) => {
        const style = getCategoryStyle(group.category);
        return (
          <div key={group.category} className="flex flex-col gap-3.5">
            {/* Category Section Bar */}
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-outline-variant/50", style.bg, style.color)}>
                  <HugeiconsIcon icon={style.icon} size={16} strokeWidth={1.8} />
                </div>
                <h2 className="text-base font-bold text-on-surface tracking-tight">{categoryDisplayLabel(group.category, t)}</h2>
              </div>
              <span className="text-xs font-mono font-semibold text-on-surface-variant px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/60">
                {group.requirements.length}
              </span>
            </div>

            {/* Requirement Cards */}
            <div className="flex flex-col gap-3">
              {group.requirements.map((requirement) => (
                <RequirementCard
                  key={getRequirementKey(requirement)}
                  requirement={requirement}
                  editingId={editingId}
                  readOnly={readOnly}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              ))}

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onAdd(group.category)}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-outline-variant/80 text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <HugeiconsIcon icon="add" size={14} strokeWidth={2} />
                  <span>{t("nonFunctional.addCategory", { category: categoryDisplayLabel(group.category, t) })}</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RequirementCard({
  requirement,
  editingId,
  readOnly,
  onEdit,
  onDelete,
  onUpdate,
}: {
  requirement: NonFunctionalRequirement;
  editingId: string | null;
  readOnly: boolean;
  onEdit: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<NonFunctionalRequirement>) => void;
}) {
  const { t } = useTranslation("planning");
  const id = getRequirementKey(requirement);
  const isEditing = editingId === id;

  return (
    <div
      className={cn(
        "bg-surface-container-lowest border rounded-2xl p-4.5 transition-all duration-200 group shadow-2xs",
        isEditing
          ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
          : "border-outline-variant/80 hover:border-outline hover:shadow-xs"
      )}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md shrink-0">
            {requirement.code}
          </span>
          {isEditing ? (
            <input
              value={requirement.title}
              onChange={(event) => onUpdate(id, { title: event.target.value })}
              className="flex-1 bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1 text-xs font-bold text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder={t("nonFunctional.titlePlaceholder")}
              autoFocus
            />
          ) : (
            <h3 className="font-bold text-sm text-on-surface tracking-tight truncate">
              {requirement.title || t("common.untitledRequirement")}
            </h3>
          )}
        </div>

        {/* Action Buttons */}
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => onEdit(isEditing ? null : id)}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer",
                isEditing
                  ? "bg-primary text-on-primary hover:bg-primary/90 shadow-2xs"
                  : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
              )}
              title={t(isEditing ? "common.saveEdit" : "common.edit")}
              aria-label={t(isEditing ? "common.saveEdit" : "common.edit")}
            >
              <HugeiconsIcon icon={isEditing ? "check" : "edit"} size={15} strokeWidth={1.8} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all cursor-pointer"
              title={t("common.delete")}
              aria-label={t("common.delete")}
            >
              <HugeiconsIcon icon="delete" size={15} strokeWidth={1.8} />
            </button>
          </div>
        )}
      </div>

      {/* Body / Description */}
      {isEditing ? (
        <div className="flex flex-col gap-2.5 mt-2">
          <textarea
            value={requirement.description}
            onChange={(event) => onUpdate(id, { description: event.target.value })}
            className="w-full min-h-[80px] bg-surface border border-outline-variant/80 rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
            placeholder={t("nonFunctional.descriptionPlaceholder")}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={requirement.priority}
              onChange={(event) => onUpdate(id, { priority: event.target.value as RequirementPriority })}
              className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {t(priorityLabelKey(priority))}
                </option>
              ))}
            </select>
            <select
              value={requirement.status}
              onChange={(event) => onUpdate(id, { status: event.target.value as RequirementStatus })}
              className="w-full bg-surface border border-outline-variant/80 rounded-lg px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(statusLabelKey(status))}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3">
            {requirement.description || <span className="text-on-surface-variant/50 italic">{t("common.noDescription")}</span>}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", priorities[requirement.priority])}>
              {t(priorityLabelKey(requirement.priority))}
            </span>
            <span className="text-[10px] font-semibold text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant/60">
              {t(statusLabelKey(requirement.status))}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function groupRequirements(requirements: NonFunctionalRequirement[]) {
  const groups = new Map<string, NonFunctionalRequirement[]>();
  requirements.forEach((requirement) => {
    const category = requirement.category || "Quality";
    groups.set(category, [...(groups.get(category) || []), requirement]);
  });
  return Array.from(groups.entries()).map(([category, groupRequirements]) => ({ category, requirements: groupRequirements }));
}

function getCategoryStyle(category: string) {
  return categoryStyles[category] || categoryStyles[category.split(" ")[0]] || { icon: "tune", color: "text-on-surface", bg: "bg-surface-container" };
}

function getRequirementKey(requirement: NonFunctionalRequirement) {
  return requirement._id || requirement.localId || requirement.code;
}

function priorityLabelKey(priority: RequirementPriority) {
  return ({
    "Must Have": "common.priorityLabels.mustHave",
    "Should Have": "common.priorityLabels.shouldHave",
    "Could Have": "common.priorityLabels.couldHave",
    "Won't Have": "common.priorityLabels.wontHave",
  } as const)[priority];
}

function statusLabelKey(status: RequirementStatus) {
  return ({ Draft: "common.statusLabels.draft", "In Review": "common.statusLabels.inReview", Approved: "common.statusLabels.approved" } as const)[status];
}

function categoryDisplayLabel(category: string, t: (key: string) => string) {
  const categoryKeys: Record<string, string> = {
    Performance: "performance", Scalability: "scalability", Security: "security", Privacy: "privacy",
    Usability: "usability", Accessibility: "accessibility", Reliability: "reliability", Availability: "availability",
    Maintainability: "maintainability", Compatibility: "compatibility", Quality: "quality",
  };
  const key = categoryKeys[category];
  return key ? t(`nonFunctional.categoryLabels.${key}`) : category;
}

function getPlanningLanguageLabel(language: string, t: (key: string) => string) {
  const label = getLanguageLabel(language).toLowerCase();
  if (label === "english") return t("common.languageNames.english");
  if (label === "french") return t("common.languageNames.french");
  if (label === "arabic") return t("common.languageNames.arabic");
  return getLanguageLabel(language);
}

function resolveNonFunctionalError(error: { translationKey: string } | { message: string } | null, t: (key: string) => string) {
  if (!error) return "";
  return "translationKey" in error ? t(error.translationKey) : error.message;
}

