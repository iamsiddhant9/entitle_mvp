import { cn } from "@/lib/utils";

interface ProgressBarProps {
  stepTitles: string[];
  stepIndex: number;
  questionNumber: number;
  questionCount: number;
}

export default function ProgressBar({
  stepTitles,
  stepIndex,
  questionNumber,
  questionCount,
}: ProgressBarProps) {
  const percent = Math.round((questionNumber / questionCount) * 100);

  return (
    <div className="w-full">
      <div className="mb-3 hidden items-center gap-3 sm:flex">
        {stepTitles.map((title, i) => (
          <div key={title} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
                i < stepIndex
                  ? "bg-indiagreen text-white"
                  : i === stepIndex
                    ? "bg-saffron text-white"
                    : "bg-slate-200 text-slate-500"
              )}
            >
              {i + 1}
            </span>
            <span
              className={cn(
                "truncate text-xs font-semibold",
                i === stepIndex ? "text-slate-900" : "text-slate-400"
              )}
            >
              {title}
            </span>
          </div>
        ))}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-saffron to-indiagreen transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs font-medium text-slate-500">
        Question {questionNumber} of {questionCount}
      </p>
    </div>
  );
}
