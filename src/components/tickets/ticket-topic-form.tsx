"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTicketFromTopic } from "@/features/tickets/actions";
import { uploadAttachment } from "@/features/tickets/upload";
import { TOPICS, getTopic } from "@/features/tickets/topics";

export function TicketTopicForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [topicId, setTopicId] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [submitted, setSubmitted] = useState(false);

  const topic = getTopic(topicId);

  function setField(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function missing(key: string, required?: boolean) {
    return submitted && required && !(values[key] ?? "").trim();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic) {
      toast.error("Selecione um assunto.");
      return;
    }
    setSubmitted(true);

    const allFields = [...topic.fields, ...(topic.describe ? [topic.describe] : [])];
    const hasMissing = allFields.some(
      (f) => f.required && !(values[f.key] ?? "").trim(),
    );
    if (hasMissing) return;

    start(async () => {
      const res = await createTicketFromTopic({ topicId, values });
      if (!res.ok || !res.id) {
        toast.error(res.error ?? "Não foi possível abrir o ticket.");
        return;
      }

      // Envia os anexos (se houver) após o ticket existir.
      const uploads = (topic.files ?? []).flatMap((ff) =>
        (files[ff.key] ?? []).map((file) =>
          uploadAttachment({ ticketId: res.id!, file, fieldLabel: ff.label }),
        ),
      );
      if (uploads.length > 0) {
        const results = await Promise.all(uploads);
        const failed = results.filter((r) => !r.ok);
        if (failed.length > 0) {
          toast.warning(
            "Ticket aberto, mas alguns anexos falharam ao enviar.",
          );
        }
      }

      toast.success("Ticket aberto");
      router.push(`/chamados/${res.id}`);
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel>
                Assunto
                <span className="text-destructive"> *</span>
              </FieldLabel>
              <Select
                value={topicId}
                onValueChange={(v) => {
                  setTopicId(v);
                  setSubmitted(false);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o assunto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TOPICS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {topic ? (
                <FieldDescription>{topic.description}</FieldDescription>
              ) : (
                <FieldDescription>
                  Selecione o assunto desejado para que possamos atendê-lo
                  corretamente.
                </FieldDescription>
              )}
            </Field>

            {topic ? (
              <>
                {topic.fields.map((f) => (
                  <Field key={f.key} data-invalid={missing(f.key, f.required)}>
                    <FieldLabel htmlFor={f.key}>
                      {f.label}
                      {f.required ? (
                        <span className="text-destructive"> *</span>
                      ) : f.hideOptionalHint ? (
                        ""
                      ) : (
                        " (opcional)"
                      )}
                    </FieldLabel>
                    {f.type === "textarea" ? (
                      <Textarea
                        id={f.key}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        rows={3}
                        aria-invalid={missing(f.key, f.required)}
                      />
                    ) : (
                      <Input
                        id={f.key}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setField(f.key, e.target.value)}
                        aria-invalid={missing(f.key, f.required)}
                      />
                    )}
                    {missing(f.key, f.required) ? (
                      <FieldError>Campo obrigatório.</FieldError>
                    ) : null}
                  </Field>
                ))}

                {topic.files.map((ff) => (
                  <Field key={ff.key}>
                    <FieldLabel htmlFor={ff.key}>
                      {ff.label} (opcional)
                    </FieldLabel>
                    <Input
                      id={ff.key}
                      type="file"
                      multiple
                      accept={ff.accept}
                      onChange={(e) =>
                        setFiles((prev) => ({
                          ...prev,
                          [ff.key]: Array.from(e.target.files ?? []),
                        }))
                      }
                    />
                    <FieldDescription>
                      {(files[ff.key]?.length ?? 0) > 0
                        ? `${files[ff.key].length} arquivo(s) selecionado(s)`
                        : "Imagens, vídeos ou PDFs até 25 MB."}
                    </FieldDescription>
                  </Field>
                ))}

                {topic.describe ? (
                  <Field
                    data-invalid={missing(
                      topic.describe.key,
                      topic.describe.required,
                    )}
                  >
                    <FieldLabel htmlFor={topic.describe.key}>
                      {topic.describe.label}
                      {topic.describe.required ? (
                        <span className="text-destructive"> *</span>
                      ) : (
                        " (opcional)"
                      )}
                    </FieldLabel>
                    <Textarea
                      id={topic.describe.key}
                      value={values[topic.describe.key] ?? ""}
                      onChange={(e) =>
                        setField(topic.describe!.key, e.target.value)
                      }
                      rows={5}
                      aria-invalid={missing(
                        topic.describe.key,
                        topic.describe.required,
                      )}
                    />
                    {missing(topic.describe.key, topic.describe.required) ? (
                      <FieldError>Campo obrigatório.</FieldError>
                    ) : null}
                  </Field>
                ) : null}

                <div className="flex justify-end">
                  <Button type="submit" disabled={pending}>
                    {pending ? <Spinner data-icon="inline-start" /> : null}
                    Abrir ticket
                  </Button>
                </div>
              </>
            ) : null}
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
