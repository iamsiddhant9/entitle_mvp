import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import type { EligibilityStatus } from "@/lib/api";

const CONFIG: Record<
  EligibilityStatus,
  { label: string; variant: BadgeProps["variant"]; Icon: LucideIcon }
> = {
  eligible: { label: "Eligible", variant: "success", Icon: CheckCircle2 },
  near_miss: { label: "Near miss", variant: "warning", Icon: AlertTriangle },
  not_eligible: { label: "Not eligible", variant: "destructive", Icon: XCircle },
};

export default function StatusBadge({
  status,
  className,
}: {
  status: EligibilityStatus;
  className?: string;
}) {
  const config = CONFIG[status] ?? CONFIG.not_eligible;
  return (
    <Badge variant={config.variant} className={className}>
      <config.Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
