"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, Send, X } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { addMessage } from "@/features/tickets/actions";
import { uploadAttachment } from "@/features/tickets/upload";

export function MessageComposer({
  ticketId,
  isInternal = false,
  placeholder,
}: {
  ticketId: string;
  isInternal?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, start] = useTransition();

  const canSend = body.trim().length > 0 || files.length > 0;

  function send() {
    if (!canSend) return;
    start(async () => {
      const text = body.trim() || "(anexo)";
      const res = await addMessage(ticketId, text, isInternal);
      if (!res.ok) {
        toast.error(res.error ?? "Não foi possível enviar.");
        return;
      }

      if (files.length > 0 && res.id) {
        const results = await Promise.all(
          files.map((file) =>
            uploadAttachment({ ticketId, file, messageId: res.id }),
          ),
        );
        if (results.some((r) => !r.ok)) {
          toast.warning("Mensagem enviada, mas alguns anexos falharam.");
        }
      }

      setBody("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      toast.success(isInternal ? "Nota adicionada" : "Mensagem enviada");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <InputGroup>
        <InputGroupTextarea
          placeholder={
            placeholder ??
            (isInternal
              ? "Escreva uma nota interna (visível só para a equipe)..."
              : "Escreva uma resposta ao solicitante...")
          }
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={pending}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton
            type="button"
            variant="ghost"
            onClick={() => fileRef.current?.click()}
            disabled={pending}
          >
            <Paperclip data-icon="inline-start" />
            Anexar
          </InputGroupButton>
          <InputGroupButton
            className="ml-auto"
            onClick={send}
            disabled={pending || !canSend}
          >
            {pending ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Send data-icon="inline-start" />
            )}
            {isInternal ? "Adicionar nota" : "Responder"}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
      />

      {files.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs"
            >
              <span className="max-w-[180px] truncate">{f.name}</span>
              <button
                type="button"
                onClick={() =>
                  setFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remover ${f.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
