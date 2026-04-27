import { fakeProvider } from "./fake";
import { stripeProvider } from "./stripe";
import { yookassaProvider } from "./yookassa";
import type { PaymentProviderAdapter } from "./types";

export type { PaymentProviderAdapter, CreatePaymentInput, CreatePaymentResult } from "./types";

export function getPaymentProvider(): PaymentProviderAdapter {
  const name = (process.env.PAYMENT_PROVIDER ?? "fake").toLowerCase();
  switch (name) {
    case "stripe":
      return stripeProvider;
    case "yookassa":
      return yookassaProvider;
    case "fake":
    default:
      return fakeProvider;
  }
}
