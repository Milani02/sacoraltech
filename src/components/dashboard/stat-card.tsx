import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "text-muted-foreground",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  /** Token-based text color for the icon, e.g. "text-status-progress". */
  accent?: string;
}) {
  return (
    <Card className="surface-hover">
      <CardHeader>
        <CardDescription className="text-xs font-medium uppercase tracking-wide">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
          {value}
        </CardTitle>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
        <CardAction>
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-xl bg-current/10 ring-1 ring-inset ring-current/15",
              accent,
            )}
          >
            <Icon className="size-5" />
          </div>
        </CardAction>
      </CardHeader>
    </Card>
  );
}
