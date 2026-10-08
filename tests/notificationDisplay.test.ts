import assert from "node:assert/strict";
import test from "node:test";
import { getNotificationDisplayText } from "@/lib/notificationDisplay";
import type { NotificationItem } from "@/context/NotificationContext";

const knownKeys = new Set([
  "generation.actors.title",
  "generation.actors.message",
  "account.profile.title",
  "account.profile.message",
]);

const translate = (key: string, options?: Record<string, unknown>) => {
  const value = key === "generation.actors.title"
    ? "La section Acteurs est prête"
    : key === "generation.actors.message"
      ? "La section Acteurs a été générée avec succès."
      : key === "account.profile.title"
        ? "Profil mis à jour"
        : key === "account.profile.message"
          ? "Profil de {{name}} mis à jour"
        : key;

  return Object.entries(options || {}).reduce(
    (result, [name, replacement]) => result.replaceAll(`{{${name}}}`, String(replacement)),
    value
  );
};

const exists = (key: string) => knownKeys.has(key);

function notification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    _id: "n1",
    title: "Original title",
    message: "Original message",
    type: "info",
    read: false,
    createdAt: "2026-10-08T12:00:00.000Z",
    ...overrides,
  };
}

test("legacy generation notifications translate only for a recognized canonical feature", () => {
  const item = notification({ type: "generation_complete", feature: "actors" });
  assert.deepEqual(getNotificationDisplayText(item, translate, exists), {
    title: "La section Acteurs est prête",
    message: "La section Acteurs a été générée avec succès.",
  });

  assert.deepEqual(getNotificationDisplayText(
    notification({ type: "success", feature: "actors" }),
    translate,
    exists
  ), { title: "Original title", message: "Original message" });
});

test("keyed templates interpolate primitive metadata and unknown notification content stays verbatim", () => {
  assert.deepEqual(getNotificationDisplayText(notification({
    titleKey: "account.profile.title",
    messageKey: "account.profile.message",
    messageParams: { name: "Mayssen", ignored: { content: "not a primitive" } } as NotificationItem["messageParams"],
  }), translate, exists), {
    title: "Profil mis à jour",
    message: "Profil de Mayssen mis à jour",
  });

  assert.deepEqual(getNotificationDisplayText(notification({
    title: "A student created \"Project Alpha\".",
    message: "A student created \"Project Alpha\".",
  }), translate, exists), {
    title: "A student created \"Project Alpha\".",
    message: "A student created \"Project Alpha\".",
  });
});
