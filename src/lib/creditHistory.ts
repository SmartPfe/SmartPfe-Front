export const CREDIT_HISTORY_PATH = "/workspace/settings/credits";

export type CreditRequest = {
  _id: string; studentName?: string; email?: string; phone?: string;
  requestedCredits: number; packageLabel: string; price: number; currency: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  createdAt: string; confirmedAt?: string; cancelledAt?: string; creditedAt?: string;
  adminNote?: string; cancellationReason?: string; creditTransaction?: string;
  receiptEmailStatus?: "pending" | "sent" | "failed" | "unavailable"; receiptEmailSentAt?: string;
};

export type CreditTransaction = {
  _id: string; kind: string; status: string; actionKey?: string; reason?: string; reference?: string;
  enforcementMode?: string; freeQuotaUsed?: boolean; quotedCost?: number; chargedCost?: number;
  promotionalDelta?: number; purchasedDelta?: number; promotionalUsed?: number; purchasedUsed?: number;
  createdAt: string; balanceAfter?: { promotional: number; purchased: number; total: number };
};

export const requestStatusTone: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  CONFIRMED: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-secondary/10 text-secondary border-secondary/20",
  CANCELLED: "bg-error/10 text-error border-error/20",
};

export const requestStatusDescription: Record<string, string> = {
  PENDING: "A team member will contact you to explain the payment steps. Credits will be added after your payment is verified.",
  CONFIRMED: "The administrator has confirmed your request. Your credits will appear when the deposit is completed.",
  COMPLETED: "Your purchased credits have been added to your wallet.",
  CANCELLED: "This request was cancelled. No credits will be added for this request.",
};

export const creditDate = (value?: string, locale: "en" | "fr" = "en") => value ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) : "—";
export const creditMoney = (price: number, currency: string, locale: "en" | "fr" = "en") => `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price)} ${currency}`;
export const transactionLabel = (item: CreditTransaction) => {
  if (item.reference?.startsWith("credit-request:")) return "Credit purchase";
  if (item.kind === "welcome") return "Welcome credits";
  if (item.kind === "daily_refill") return "Daily refill";
  if (item.kind === "admin_adjustment") return item.reason || "Wallet adjustment";
  if (item.kind === "purchase") return "Credit purchase";
  if (item.kind === "refund") return "Credit refund";
  return item.actionKey?.replaceAll("_", " ") || "AI activity";
};
export const transactionDelta = (item: CreditTransaction) => {
  if (["refunded", "cancelled", "pending"].includes(item.status)) return 0;
  if (item.status === "reserved") return -((item.promotionalUsed || 0) + (item.purchasedUsed || 0));
  return (item.promotionalDelta || 0) + (item.purchasedDelta || 0) - (item.chargedCost || 0);
};
