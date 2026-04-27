import type { OrderStatus } from "@prisma/client";

export type CreatePaymentInput = {
  orderId: string;
  amountUsdCents: number;
  amountRubKop: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
};

export type CreatePaymentResult = {
  redirectUrl: string;
  providerRef: string;
};

export type ConfirmPaymentResult = {
  status: OrderStatus;
  providerRef: string;
};

export interface PaymentProviderAdapter {
  readonly name: "fake" | "stripe" | "yookassa";
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  confirmPayment(providerRef: string): Promise<ConfirmPaymentResult>;
}
