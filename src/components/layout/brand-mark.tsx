import { cn } from "@/lib/utils";

/**
 * Marca provisória da SAC Oraltech (anel + arco, aludindo ao "O" inicial).
 * Trocar por uma marca definitiva quando a identidade visual da Oraltech
 * for enviada (ver BrandLogo).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-5", className)}
      aria-hidden
    >
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M7.5 12a4.5 4.5 0 0 1 9 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
