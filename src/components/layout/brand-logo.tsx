import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";

/**
 * Placeholder textual da marca (sem arquivo de logo da Oraltech ainda).
 * Troque por uma <Image> apontando para o PNG/SVG definitivo assim que a
 * identidade visual for enviada — mantém a mesma assinatura (onDark/className)
 * usada em login, registro e atualizar-senha.
 */
export function BrandLogo({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 self-start",
        onDark ? "text-white" : "text-foreground",
        className,
      )}
    >
      <BrandMark className="size-7" />
      <span className="text-xl font-semibold tracking-tight">SAC Oraltech</span>
    </div>
  );
}
