import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/tickets/status-badge";
import { PriorityBadge } from "@/components/tickets/priority-badge";
import {
  AssigneeSelect,
  CategorySelect,
  PrioritySelect,
  StatusSelect,
} from "@/components/tickets/ticket-controls";
import { MessageComposer } from "@/components/tickets/message-composer";
import { can } from "@/features/auth/roles";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  getTicket,
  getTicketAttachments,
  getTicketMessages,
} from "@/features/tickets/queries";
import { AttachmentsList } from "@/components/tickets/attachments-list";
import { listAgents } from "@/features/users/queries";
import { formatDateTime, formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TicketAttachment, TicketMessage } from "@/types/domain";

export const metadata: Metadata = { title: "Ticket" };

function MessageBubble({
  message,
  attachments = [],
}: {
  message: TicketMessage;
  attachments?: TicketAttachment[];
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="size-8">
        <AvatarFallback
          className={cn(
            "text-xs",
            message.isInternal
              ? "bg-warning/15 text-warning"
              : "bg-primary/10 text-primary",
          )}
        >
          {initials(message.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "mt-1 rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap",
            message.isInternal ? "border-warning/30 bg-warning/5" : "bg-card",
          )}
        >
          {message.body}
        </div>
        {attachments.length > 0 ? (
          <AttachmentsList attachments={attachments} className="mt-2" />
        ) : null}
      </div>
    </div>
  );
}

export default async function ChamadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [messages, attachments] = await Promise.all([
    getTicketMessages(id),
    getTicketAttachments(id),
  ]);
  const formAttachments = attachments.filter((a) => a.messageId === null);
  const attByMessage = new Map<string, TicketAttachment[]>();
  for (const a of attachments) {
    if (a.messageId) {
      const arr = attByMessage.get(a.messageId) ?? [];
      arr.push(a);
      attByMessage.set(a.messageId, arr);
    }
  }
  const isStaff = can.respondTickets(user.role);
  const showInternal = can.seeInternalNotes(user.role);
  const agents = isStaff ? await listAgents() : [];

  const thread = messages.filter((m) => !m.isInternal);
  const internalNotes = messages.filter((m) => m.isInternal);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/chamados">Tickets</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="font-mono">{ticket.code}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-2xl font-semibold tracking-tight">{ticket.title}</h2>
        <div className="flex items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
              {ticket.topic ? (
                <CardDescription>Assunto: {ticket.topic}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {ticket.description}
              </p>
            </CardContent>
          </Card>

          {ticket.details.fields.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Informações do formulário</CardTitle>
                <CardDescription>
                  Dados enviados pelo solicitante na abertura.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {ticket.details.fields.map((f, i) => (
                    <div key={i} className="grid gap-0.5">
                      <dt className="text-xs text-muted-foreground">
                        {f.label}
                      </dt>
                      <dd className="text-sm break-words">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          ) : null}

          {formAttachments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
                <CardDescription>
                  Arquivos enviados na abertura do ticket.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AttachmentsList attachments={formAttachments} />
              </CardContent>
            </Card>
          ) : null}

          <Tabs defaultValue="conversa">
            <TabsList>
              <TabsTrigger value="conversa">
                Conversa
                {thread.length > 0 ? (
                  <span className="text-muted-foreground">({thread.length})</span>
                ) : null}
              </TabsTrigger>
              {showInternal ? (
                <TabsTrigger value="notas">
                  <Lock data-icon="inline-start" />
                  Notas internas
                  {internalNotes.length > 0 ? (
                    <span className="text-muted-foreground">
                      ({internalNotes.length})
                    </span>
                  ) : null}
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="conversa" className="flex flex-col gap-4">
              {thread.length > 0 ? (
                thread.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    attachments={attByMessage.get(m.id)}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhuma mensagem ainda. Comece a conversa abaixo.
                </p>
              )}
              <Separator />
              {isStaff || ticket.status !== "closed" ? (
                <MessageComposer
                  ticketId={ticket.id}
                  placeholder={
                    isStaff ? undefined : "Escreva sua mensagem para a equipe..."
                  }
                />
              ) : (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="size-4" aria-hidden />
                  Este ticket foi fechado pela equipe. Caso precise de ajuda,
                  abra um novo ticket.
                </p>
              )}
            </TabsContent>

            {showInternal ? (
              <TabsContent value="notas" className="flex flex-col gap-4">
                {internalNotes.length > 0 ? (
                  internalNotes.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      attachments={attByMessage.get(m.id)}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma nota interna ainda.
                  </p>
                )}
                <Separator />
                <MessageComposer ticketId={ticket.id} isInternal />
              </TabsContent>
            ) : null}
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            {isStaff ? (
              <>
                <Detail label="Status">
                  <StatusSelect ticketId={ticket.id} value={ticket.status} />
                </Detail>
                <Detail label="Prioridade">
                  <PrioritySelect ticketId={ticket.id} value={ticket.priority} />
                </Detail>
                <Detail label="Responsável">
                  <AssigneeSelect
                    ticketId={ticket.id}
                    value={ticket.assigneeId}
                    agents={agents}
                    currentUserId={user.id}
                  />
                </Detail>
                <Detail label="Categoria">
                  <CategorySelect ticketId={ticket.id} value={ticket.category} />
                </Detail>
                <Separator />
              </>
            ) : null}

            <Detail label="Solicitante">
              <span className="font-medium">{ticket.requester.name}</span>
            </Detail>
            {!isStaff ? (
              <Detail label="Responsável">
                {ticket.assignee ? (
                  ticket.assignee.fullName
                ) : (
                  <span className="text-muted-foreground">Não atribuído</span>
                )}
              </Detail>
            ) : null}
            <Separator />
            <Detail label="Aberto em">
              <span className="tabular-nums">
                {formatDateTime(ticket.createdAt)}
              </span>
            </Detail>
            <Detail label="Atualizado em">
              <span className="tabular-nums">
                {formatDateTime(ticket.updatedAt)}
              </span>
            </Detail>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}
