// Tipos de "enum" mantidos em TypeScript porque o banco local (SQLite) usa
// colunas String. Ao migrar para Postgres, as colunas continuam compatíveis.

export type Role = "ADMIN" | "STAFF";

export type StandStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "BLOCKED"
  | "SPONSOR"
  | "CEDED";

export type OrderStatus =
  | "CART"
  | "RESERVED"
  | "CONTRACT_PENDING"
  | "SIGNED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "CANCELLED";

export type ContractStatus = "DRAFT" | "SENT" | "SIGNED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED";

export type Captador = "FIEB" | "SEBRAE" | "BAHIA_EVENTOS" | "OUTRO";

export type GoalMetric = "REVENUE" | "STANDS_SOLD";

// Status do lead (interesse capturado no mapa).
export type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED";

export const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED"];

// Listas cadastráveis pelo admin (modelo StandOption).
export type StandOptionKind = "TIPO" | "ASA" | "LOCALIZACAO";

export const STAND_OPTION_KINDS: StandOptionKind[] = [
  "TIPO",
  "ASA",
  "LOCALIZACAO",
];

export const STAND_STATUSES: StandStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "SOLD",
  "BLOCKED",
  "SPONSOR",
  "CEDED",
];

export const ORDER_STATUSES: OrderStatus[] = [
  "CART",
  "RESERVED",
  "CONTRACT_PENDING",
  "SIGNED",
  "PAYMENT_PENDING",
  "PAID",
  "CANCELLED",
];

export const CAPTADORES: Captador[] = [
  "FIEB",
  "SEBRAE",
  "BAHIA_EVENTOS",
  "OUTRO",
];
