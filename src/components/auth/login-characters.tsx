"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Painel de personagens animados.
 * - Flutuam suavemente e piscam de tempos em tempos.
 * - As pupilas seguem o mouse.
 * - Ao digitar o e-mail, o personagem verde se inclina para o formulário (espia)
 *   e todos olham para o campo.
 * - Enquanto a senha está escondida, ficam de olhos abertos tentando ver.
 * - Quando a senha é revelada, fecham os olhos.
 */

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function Eyes({
  lr,
  ud,
  closed,
  size = 16,
  gap = 16,
  pupil = 7,
}: {
  lr: number;
  ud: number;
  closed: boolean;
  size?: number;
  gap?: number;
  pupil?: number;
}) {
  const range = size / 2 - pupil / 2 - 1;
  const tx = lr * range;
  const ty = ud * range * 0.7;
  return (
    <div className="flex items-center" style={{ gap }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-center justify-center rounded-full bg-white"
          style={{
            width: size,
            height: closed ? 3 : size,
            transition: "height .18s ease",
          }}
        >
          {!closed ? (
            <div
              className="rounded-full bg-neutral-900"
              style={{
                width: pupil,
                height: pupil,
                transform: `translate(${tx}px, ${ty}px)`,
                transition: "transform .12s ease-out",
              }}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function LoginCharacters({
  emailFocused = false,
  passwordFocused = false,
  revealPassword = false,
}: {
  emailFocused?: boolean;
  passwordFocused?: boolean;
  revealPassword?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ lr: 0, ud: 0 });
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = ref.current;
      const cx = el
        ? el.getBoundingClientRect().left + el.offsetWidth / 2
        : window.innerWidth / 2;
      const cy = el
        ? el.getBoundingClientRect().top + el.offsetHeight / 2
        : window.innerHeight / 2;
      setMouse({
        lr: clamp((e.clientX - cx) / 320, -1, 1),
        ud: clamp((e.clientY - cy) / 320, -1, 1),
      });
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    function schedule() {
      timeout = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => setBlink(false), 140);
          schedule();
        },
        2400 + Math.random() * 2600,
      );
    }
    schedule();
    return () => clearTimeout(timeout);
  }, []);

  // Olhos fechados só quando a senha é revelada (ou piscando).
  const closed = revealPassword || blink;

  // Para onde olham: ao mexer no formulário, olham para o campo (direita/baixo);
  // caso contrário, seguem o mouse.
  const peeking = emailFocused;
  let look = mouse;
  if (passwordFocused && !revealPassword) {
    look = { lr: 0.7, ud: 0.4 }; // tentando ver a senha
  } else if (emailFocused) {
    look = { lr: 0.6, ud: 0.2 };
  }
  const { lr, ud } = look;

  // Verde espia: sobe um pouco e inclina para o formulário (direita).
  const greenPeek = peeking
    ? "translateY(-12px) rotate(13deg)"
    : "translateY(0) rotate(0deg)";

  return (
    <div ref={ref} className="relative h-72 w-full max-w-md" aria-hidden>
      {/* personagem verde (alto) */}
      <div
        className="char-bob absolute left-[18%] bottom-0 h-60 w-32"
        style={{ animationDelay: "0s" }}
      >
        <div
          className="size-full rounded-t-[3.5rem] transition-transform duration-500 ease-out"
          style={{ background: "var(--char-green)", transform: greenPeek, transformOrigin: "bottom center" }}
        >
          <div className="absolute left-1/2 top-9 -translate-x-1/2">
            <Eyes lr={lr} ud={ud} closed={closed} />
          </div>
        </div>
      </div>

      {/* personagem carvão (estreito) */}
      <div
        className="char-bob absolute left-[42%] bottom-0 h-48 w-24"
        style={{ animationDelay: "0.8s" }}
      >
        <div
          className="size-full rounded-t-[3rem]"
          style={{ background: "var(--char-dark)" }}
        >
          <div className="absolute left-1/2 top-8 -translate-x-1/2">
            <Eyes lr={lr} ud={ud} closed={closed} size={13} gap={12} pupil={6} />
          </div>
        </div>
      </div>

      {/* personagem laranja (domo grande) */}
      <div
        className="char-bob absolute left-0 bottom-0 h-44 w-52"
        style={{ animationDelay: "1.4s" }}
      >
        <div
          className="size-full rounded-t-full"
          style={{ background: "var(--char-orange)" }}
        >
          <div className="absolute left-1/2 top-16 -translate-x-1/2">
            <Eyes lr={lr} ud={ud} closed={closed} size={14} gap={28} pupil={6} />
          </div>
        </div>
      </div>

      {/* personagem amarelo (domo com boca) */}
      <div
        className="char-bob absolute right-0 bottom-0 h-52 w-40"
        style={{ animationDelay: "0.4s" }}
      >
        <div
          className="size-full rounded-t-full"
          style={{ background: "var(--char-yellow)" }}
        >
          <div className="absolute left-1/2 top-12 -translate-x-1/2 flex flex-col items-center gap-3">
            <Eyes lr={lr} ud={ud} closed={closed} size={13} gap={26} pupil={6} />
            <div className="h-0.5 w-8 rounded-full bg-neutral-900/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
