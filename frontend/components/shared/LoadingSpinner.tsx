import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-10 w-10",
} as const;

export default function LoadingSpinner({
  label,
  size = "default",
  className,
}: {
  label?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-slate-500",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-indiagreen", SIZES[size])} />
      {label ? <p className="text-sm font-medium">{label}</p> : null}
    </div>
  );
}
