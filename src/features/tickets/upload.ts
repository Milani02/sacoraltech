import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * UUID v4 sem depender de `crypto.randomUUID`, que os navegadores só expõem
 * em contexto seguro (https/localhost) — o app é acessado via http://IP na
 * rede interna. `getRandomValues` está disponível em qualquer contexto.
 */
function randomUUID(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface UploadResult {
  ok: boolean;
  error?: string;
}

/**
 * Uploads a file to the private `attachments` bucket under the ticket's folder
 * and records its metadata. Runs in the browser with the user's session, so
 * RLS / Storage policies apply (the user must be able to access the ticket).
 */
export async function uploadAttachment(opts: {
  ticketId: string;
  file: File;
  fieldLabel?: string | null;
  messageId?: string | null;
}): Promise<UploadResult> {
  if (opts.file.size > MAX_BYTES) {
    return { ok: false, error: `${opts.file.name}: arquivo acima de 25 MB.` };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessão expirada." };

  const ext = opts.file.name.includes(".")
    ? `.${opts.file.name.split(".").pop()}`
    : "";
  const path = `${opts.ticketId}/${randomUUID()}${ext}`;

  const up = await supabase.storage
    .from("attachments")
    .upload(path, opts.file, { upsert: false });
  if (up.error) return { ok: false, error: up.error.message };

  const ins = await supabase.from("ticket_attachments").insert({
    ticket_id: opts.ticketId,
    message_id: opts.messageId ?? null,
    uploaded_by: user.id,
    field_label: opts.fieldLabel ?? null,
    file_path: path,
    file_name: opts.file.name,
    mime_type: opts.file.type || null,
    size_bytes: opts.file.size,
  });
  if (ins.error) return { ok: false, error: ins.error.message };

  return { ok: true };
}
