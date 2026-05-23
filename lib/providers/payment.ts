export interface CreateChargeInput {
  orderId: string;
  trackingToken: string;
  amountCents: number;
  description: string;
  customer: { name: string; email: string; cnpj?: string | null };
}

export interface CreateChargeResult {
  provider: string;
  externalId: string | null;
  paymentUrl: string;
  status: "PENDING" | "PAID";
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<CreateChargeResult>;
}

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

// Adaptador manual: gera um "link" interno onde o pagamento é confirmado
// manualmente (pela responsável/admin) até plugarmos Asaas/Mercado Pago/etc.
class ManualPaymentProvider implements PaymentProvider {
  readonly name = "manual";
  async createCharge(input: CreateChargeInput): Promise<CreateChargeResult> {
    return {
      provider: this.name,
      externalId: input.orderId,
      paymentUrl: `${appUrl()}/acompanhar/${input.trackingToken}`,
      status: "PENDING",
    };
  }
}

let instance: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (instance) return instance;
  // Espaço para plugar Asaas/Mercado Pago/etc. conforme PAYMENT_PROVIDER.
  instance = new ManualPaymentProvider();
  return instance;
}
