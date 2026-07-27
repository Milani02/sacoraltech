import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TICKET_STATUS } from "@/features/tickets/constants";
import type { TicketStatus } from "@/types/domain";

// Full, static class strings so Tailwind can detect them at build time.
const styles: Record<TicketStatus, { badge: string; dot: string }> = {
  new: { badge: "border-status-new/25 bg-status-new/10 text-status-new", dot: "bg-status-new" },
  in_progress: { badge: "border-status-progress/25 bg-status-progress/10 text-status-progress", dot: "bg-status-progress" },
  waiting_client: { badge: "border-status-waiting/25 bg-status-waiting/10 text-status-waiting", dot: "bg-status-waiting" },
  closed: { badge: "border-status-closed/25 bg-status-closed/10 text-status-closed", dot: "bg-status-closed" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: TicketStatus;
  className?: string;
}) {
  const style = styles[status];
  return (
    <Badge variant="outline" className={cn(style.badge, className)}>
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {TICKET_STATUS[status].label}
    </Badge>
  );
}
