/**
 * Tópicos do formulário de abertura do cliente ("Assunto").
 * Cada tópico define campos próprios. Todos roteiam para a fila "SAC Geral".
 */

export type TopicFieldType = "text" | "textarea";

export interface TopicField {
  key: string;
  label: string;
  type: TopicFieldType;
  required?: boolean;
  /** Não-obrigatório, mas sem exibir o sufixo "(opcional)" no rótulo. */
  hideOptionalHint?: boolean;
}

export interface TopicFileField {
  key: string;
  label: string;
  /** accept attribute for the file input */
  accept: string;
  required?: boolean;
}

export interface Topic {
  id: string;
  label: string;
  description: string;
  /** Campos de texto que viram `details`. */
  fields: TopicField[];
  /** Campo livre que vira a descrição do ticket (opcional). */
  describe?: TopicField;
  /** Campos de arquivo (anexos). */
  files: TopicFileField[];
}

// ---- Campos reutilizados ----
const razao: TopicField = { key: "razao_social", label: "Nome ou Razão Social", type: "text", required: true };
const cnpj: TopicField = { key: "cnpj", label: "Número do CPF ou CNPJ", type: "text", required: true };
const endereco: TopicField = { key: "endereco", label: "Endereço completo com CEP", type: "text", required: true };
const nf: TopicField = { key: "nf", label: "Número da NF", type: "text", hideOptionalHint: true };
const produto: TopicField = { key: "produto", label: "Produto / Lote", type: "text", required: true };
const produtoOpcional: TopicField = { key: "produto", label: "Produto / Lote", type: "text" };
const telefone: TopicField = { key: "telefone", label: "Telefone para contato", type: "text", required: true };
const transportadora: TopicField = { key: "transportadora", label: "Transportadora", type: "text", required: true };

const descrever: TopicField = { key: "descricao", label: "Descreva o ocorrido", type: "textarea", required: true };

const fotoProduto: TopicFileField = { key: "foto_produto", label: "Foto / vídeo do produto com nº de lote", accept: "image/*,video/*" };
const fotosVideos: TopicFileField = { key: "fotos_videos", label: "Fotos e vídeos", accept: "image/*,video/*" };
const documentos: TopicFileField = { key: "documentos", label: "Documentos", accept: "image/*,application/pdf,.pdf" };

export const TOPICS: Topic[] = [
  {
    id: "produto-defeito",
    label: "Produto com desvio",
    description:
      "Produto com vazamento, problemas com a embalagem, alteração de cor ou consistência, não funciona corretamente, etc.",
    fields: [razao, cnpj, endereco, nf, produto],
    files: [fotoProduto],
    describe: descrever,
  },
  {
    id: "pedido",
    label: "Pedido (informações, acompanhamento ou problemas)",
    description:
      "Divergência de quantidade de produtos com o pedido ou NF, cancelamento do pedido, etc.",
    fields: [razao, cnpj, endereco, nf, produto],
    files: [fotoProduto],
    describe: descrever,
  },
  {
    id: "transportadora",
    label: "Entrega e transportadora",
    description: "Produtos trocados, avarias, atraso na entrega, roubo, etc.",
    fields: [razao, cnpj, transportadora, nf],
    files: [fotosVideos],
    describe: descrever,
  },
  {
    id: "duvidas-tecnicas",
    label: "Informações e dúvidas técnicas",
    description:
      "Informações sobre os produtos, dúvidas técnicas, modo de uso, etc.",
    fields: [razao, cnpj, endereco, telefone, produto],
    files: [],
    describe: { key: "duvida", label: "Dúvida", type: "textarea", required: true },
  },
  {
    id: "regulatorio",
    label: "Assuntos Regulatórios",
    description:
      "Solicitação de documentos como alvarás, licença sanitária, FDS, instrução de uso, especificação técnica, etc.",
    fields: [razao, cnpj, produtoOpcional],
    files: [documentos],
    describe: { key: "observacoes", label: "Observações", type: "textarea", required: false },
  },
  {
    id: "comercial",
    label: "Interesse comercial",
    description:
      "Informações comerciais, compras, parcerias, onde encontrar nossos produtos, etc.",
    fields: [razao, cnpj, endereco, telefone],
    files: [],
    describe: { key: "mensagem", label: "Mensagem", type: "textarea", required: true },
  },
  {
    id: "financeiro",
    label: "Financeiro",
    description: "Boletos, NF, etc.",
    fields: [razao, cnpj, endereco, nf, { key: "resumo", label: "Resumo", type: "text", required: true }],
    files: [],
    describe: descrever,
  },
  {
    id: "outros",
    label: "Outros",
    description: "Elogios, críticas, RH, eventos, etc.",
    fields: [razao, cnpj, endereco, telefone, { key: "resumo", label: "Resumo", type: "text", required: true }],
    files: [],
    describe: descrever,
  },
];

export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export function getTopic(id: string): Topic | undefined {
  return TOPIC_BY_ID.get(id);
}
