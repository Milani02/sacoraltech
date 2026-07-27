import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TICKET_PRIORITY } from "@/features/tickets/constants";
import type { TicketPriority } from "@/types/domain";

const styles: Record<TicketPriority, string> = {
  low: "border-prio-low/25 bg-prio-low/10 text-prio-low",
  medium: "border-prio-medium/25 bg-prio-medium/10 text-prio-medium",
  high: "border-prio-high/25 bg-prio-high/10 text-prio-high",
  urgent: "border-prio-urgent/25 bg-prio-urgent/10 text-prio-urgent",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TicketPriority;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(styles[priority], className)}>
      {TICKET_PRIORITY[priority].label}
    </Badge>
  );
}
