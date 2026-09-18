import creditCoin from "@/assets/credit-coin.png";
import { useCredits } from "@/context/CreditContext";
import { cn } from "@/lib/utils";

export default function CreditBadge({ actionKey, cost, className, showFree = false }: {
  actionKey?: string;
  cost?: number;
  className?: string;
  showFree?: boolean;
}) {
  const { getPolicy, wallet } = useCredits();
  const policy = getPolicy(actionKey);
  const value = cost ?? policy?.cost ?? 0;
  if (policy && !policy.enabled) {
    return <span className={cn("rounded-full bg-error/10 px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-error", className)}>PAUSED</span>;
  }
  const freeRemaining = policy?.freeUsesPerDay
    ? Math.max(0, policy.freeUsesPerDay - Number(wallet?.freeUsage?.[policy.key] || 0))
    : 0;
  if (freeRemaining > 0) {
    return (
      <span className={cn("rounded-full border border-secondary/25 bg-secondary/10 px-1.5 py-0.5 text-[9px] font-extrabold leading-none text-secondary", className)} title={`${freeRemaining} free use${freeRemaining === 1 ? "" : "s"} remaining today, then ${value} credits`}>
        FREE
      </span>
    );
  }
  if (value <= 0 && !showFree) return null;
  if (value <= 0) {
    return <span className={cn("text-[10px] font-bold text-secondary", className)}>FREE</span>;
  }
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-700 dark:text-amber-300", className)}
      title={policy?.freeUsesPerDay ? `${policy.freeUsesPerDay} free use${policy.freeUsesPerDay === 1 ? "" : "s"} each day, then ${value} credits` : `${value} credits`}
    >
      <img src={creditCoin} alt="" className="h-3.5 w-3.5" />
      <span>{value}</span>
    </span>
  );
}
