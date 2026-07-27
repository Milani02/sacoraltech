import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Logo da Oraltech (PNG transparente). A variante branca (só o texto vira
 * branco — o ícone já tem fundo navy próprio) é usada sobre fundos escuros.
 */
export function BrandLogo({
  onDark = false,
  className,
}: {
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={onDark ? "/logo-oraltech-branca.png" : "/logo-oraltech.png"}
      alt="Oraltech"
      width={1200}
      height={262}
      priority
      className={cn(
        "h-auto w-[220px] shrink-0 self-start object-contain",
        className,
      )}
    />
  );
}
