import { FileText, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import type { TicketAttachment } from "@/types/domain";

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsList({
  attachments,
  className,
}: {
  attachments: TicketAttachment[];
  className?: string;
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.isImage && a.url);
  const others = attachments.filter((a) => !a.isImage || !a.url);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {images.map((a) => (
            <a
              key={a.id}
              href={a.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.url!}
                alt={a.fileName}
                className="size-full object-cover transition-transform group-hover:scale-105"
              />
            </a>
          ))}
        </div>
      ) : null}

      {others.map((a) => (
        <a
          key={a.id}
          href={a.url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-md border p-2.5 text-sm transition-colors hover:bg-muted"
        >
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate">{a.fileName}</span>
          <span className="text-xs text-muted-foreground">
            {formatSize(a.sizeBytes)}
          </span>
          <Download className="size-4 shrink-0 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
