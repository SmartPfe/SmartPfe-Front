import type { NotificationItem } from "@/context/NotificationContext";

type Translate = (key: string, options?: Record<string, unknown>) => string;
type TranslationExists = (key: string, options?: Record<string, unknown>) => boolean;

const legacyGenerationKeys: Record<string, { title: string; message: string }> = {
  problemStatement: { title: "generation.problemStatement.title", message: "generation.problemStatement.message" },
  actors: { title: "generation.actors.title", message: "generation.actors.message" },
  userStories: { title: "generation.userStories.title", message: "generation.userStories.message" },
  existingSolutions: { title: "generation.existingSolutions.title", message: "generation.existingSolutions.message" },
  functionalRequirements: { title: "generation.functionalRequirements.title", message: "generation.functionalRequirements.message" },
  nonFunctionalRequirements: { title: "generation.nonFunctionalRequirements.title", message: "generation.nonFunctionalRequirements.message" },
  productBacklog: { title: "generation.productBacklog.title", message: "generation.productBacklog.message" },
  reportStructure: { title: "generation.reportStructure.title", message: "generation.reportStructure.message" },
  reportBuilder: { title: "generation.reportBuilder.title", message: "generation.reportBuilder.message" },
  completeReport: { title: "generation.completeReport.title", message: "generation.completeReport.message" },
  umlPreparation: { title: "generation.umlPreparation.title", message: "generation.umlPreparation.message" },
  presentation: { title: "generation.presentation.title", message: "generation.presentation.message" },
  pitch: { title: "generation.pitch.title", message: "generation.pitch.message" },
  pitchSlide: { title: "generation.pitchSlide.title", message: "generation.pitchSlide.message" },
  jurySimulation: { title: "generation.jurySimulation.title", message: "generation.jurySimulation.message" },
};

function safeMessageParams(params: NotificationItem["messageParams"]): Record<string, string | number | boolean> | undefined {
  if (!params || typeof params !== "object" || Array.isArray(params)) return undefined;

  return Object.fromEntries(
    Object.entries(params).filter(([key, value]) =>
      !["lng", "lngs", "ns", "defaultValue", "context", "returnObjects", "returnDetails", "postProcess", "interpolation"].includes(key) &&
      (typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    )
  );
}

export function getNotificationDisplayText(
  notification: NotificationItem,
  t: Translate,
  exists: TranslationExists
) {
  const legacyKeys = notification.type === "generation_complete"
    ? legacyGenerationKeys[notification.feature || ""]
    : undefined;
  const titleKey = notification.titleKey || legacyKeys?.title;
  const messageKey = notification.messageKey || legacyKeys?.message;
  const messageParams = safeMessageParams(notification.messageParams);
  if (messageKey === "events.userRegistered.message" && messageParams) {
    if (messageParams.role === "etudiant") messageParams.role = t("events.roles.student", { ns: "notifications" });
    else if (messageParams.role === "admin") messageParams.role = t("events.roles.admin", { ns: "notifications" });
  }
  if (messageKey === "events.newProjectCreated.message" && messageParams) {
    if (messageParams.nameMissing === true) messageParams.name = t("events.studentFallback", { ns: "notifications" });
    if (messageParams.titleMissing === true) messageParams.title = t("events.untitledProject", { ns: "notifications" });
  }

  return {
    title: titleKey && !titleKey.includes(":") && exists(titleKey, { ns: "notifications" })
      ? t(titleKey, { ns: "notifications" })
      : notification.title,
    message: messageKey && !messageKey.includes(":") && exists(messageKey, { ns: "notifications" })
      ? t(messageKey, { ...(messageParams || {}), ns: "notifications" })
      : notification.message,
  };
}
