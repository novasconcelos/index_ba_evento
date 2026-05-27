import type {
  StandStatus,
  OrderStatus,
  Captador,
  ContractStatus,
  PaymentStatus,
  StandOptionKind,
} from "@/lib/enums";

export const standOptionKindLabel: Record<StandOptionKind, string> = {
  TIPO: "Tipo (Estande/Piso)",
  ASA: "ASA",
  LOCALIZACAO: "Localização",
};

// Forma singular para textos de formulário ("Adicionar novo {singular}").
export const standOptionKindSingular: Record<StandOptionKind, string> = {
  TIPO: "tipo",
  ASA: "ASA",
  LOCALIZACAO: "localização",
};

export const standStatusLabel: Record<StandStatus, string> = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservado",
  SOLD: "Vendido",
  BLOCKED: "Bloqueado",
  SPONSOR: "Patrocínio",
  CEDED: "Cedido",
};

// Cor de preenchimento das formas no mapa SVG (e legenda).
export const standStatusColor: Record<StandStatus, string> = {
  AVAILABLE: "#22c55e",
  RESERVED: "#f59e0b",
  SOLD: "#9333ea",
  BLOCKED: "#6b7280",
  SPONSOR: "#0ea5e9",
  CEDED: "#475569",
};

export const orderStatusLabel: Record<OrderStatus, string> = {
  CART: "Carrinho",
  RESERVED: "Estande reservado",
  CONTRACT_PENDING: "Contrato em execução",
  SIGNED: "Contrato assinado",
  PAYMENT_PENDING: "Aguardando pagamento",
  PAID: "Pagamento concluído",
  CANCELLED: "Cancelado",
};

export const orderStatusColor: Record<OrderStatus, string> = {
  CART: "#94a3b8",
  RESERVED: "#f59e0b",
  CONTRACT_PENDING: "#3b82f6",
  SIGNED: "#8b5cf6",
  PAYMENT_PENDING: "#eab308",
  PAID: "#22c55e",
  CANCELLED: "#ef4444",
};

export const captadorLabel: Record<Captador, string> = {
  FIEB: "FIEB",
  SEBRAE: "SEBRAE",
  BAHIA_EVENTOS: "Bahia Eventos",
  OUTRO: "Outro",
};

export const contractStatusLabel: Record<ContractStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado para assinatura",
  SIGNED: "Assinado",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};
