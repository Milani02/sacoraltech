"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  TICKET_PRIORITY,
  TICKET_PRIORITY_ORDER,
} from "@/features/tickets/constants";
import { createTicket } from "@/features/tickets/actions";
import type { Client, Sector, TicketPriority } from "@/types/domain";

export function NovoChamadoForm({
  clients,
  sectors,
  isClient = false,
}: {
  clients: Client[];
  sectors: Sector[];
  isClient?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  // Com apenas um setor (SAC Geral), já vem selecionado e o campo é ocultado.
  const singleSector = sectors.length === 1;
  const [sector, setSector] = useState(singleSector ? sectors[0].id : "");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    title: !title.trim() ? "Informe um título." : null,
    description: !description.trim() ? "Descreva o ticket." : null,
    requester: !isClient && !requester ? "Selecione o solicitante." : null,
    sector: !sector ? "Selecione o setor." : null,
  };
  const isValid = Object.values(errors).every((e) => e === null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid) return;
    start(async () => {
      const res = await createTicket({
        title,
        description,
        requesterId: requester,
        sectorId: sector,
        priority,
      });
      if (res.ok && res.id) {
        toast.success("Ticket aberto");
        router.push(`/chamados/${res.id}`);
      } else {
        toast.error(res.error ?? "Não foi possível abrir o ticket.");
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent>
        <form onSubmit={handleSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={submitted && !!errors.title}>
              <FieldLabel htmlFor="title">Título</FieldLabel>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resumo do problema ou solicitação"
                aria-invalid={submitted && !!errors.title}
              />
              {submitted && errors.title ? (
                <FieldError>{errors.title}</FieldError>
              ) : null}
            </Field>

            <Field data-invalid={submitted && !!errors.description}>
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhe o ocorrido, com o máximo de informações úteis."
                rows={5}
                aria-invalid={submitted && !!errors.description}
              />
              {submitted && errors.description ? (
                <FieldError>{errors.description}</FieldError>
              ) : null}
            </Field>

            <div
              className={
                !isClient && !singleSector
                  ? "grid gap-6 sm:grid-cols-2"
                  : "grid gap-6"
              }
            >
              {!isClient ? (
                <Field data-invalid={submitted && !!errors.requester}>
                  <FieldLabel>Solicitante</FieldLabel>
                  <Select value={requester} onValueChange={setRequester}>
                    <SelectTrigger
                      aria-invalid={submitted && !!errors.requester}
                    >
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {submitted && errors.requester ? (
                    <FieldError>{errors.requester}</FieldError>
                  ) : null}
                </Field>
              ) : null}

              {!singleSector ? (
                <Field data-invalid={submitted && !!errors.sector}>
                  <FieldLabel>Setor responsável</FieldLabel>
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger aria-invalid={submitted && !!errors.sector}>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {sectors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {submitted && errors.sector ? (
                    <FieldError>{errors.sector}</FieldError>
                  ) : null}
                </Field>
              ) : null}
            </div>

            <Field>
              <FieldLabel>Prioridade</FieldLabel>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as TicketPriority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {TICKET_PRIORITY_ORDER.map((p) => (
                      <SelectItem key={p} value={p}>
                        {TICKET_PRIORITY[p].label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>
                Define a ordem de atenção da equipe.
              </FieldDescription>
            </Field>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/chamados">Cancelar</Link>
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : null}
                Abrir ticket
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
