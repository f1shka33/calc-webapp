import type { PaymentProviderAdapter } from "./types";

// Fake provider — used in development. Always succeeds.
// Redirects the user to an internal /checkout/fake page that confirms the order.
export const fakeProvider: PaymentProviderAdapter = {
  name: "fake",
  async createPayment({ orderId, successUrl }) {
    const url = new URL(successUrl, "http://localhost");
    url.searchParams.set("orderId", orderId);
    url.searchParams.set("provider", "fake");
    return {
      redirectUrl: `/checkout/fake?orderId=${encodeURIComponent(orderId)}&next=${encodeURIComponent(successUrl)}`,
      providerRef: `fake_${orderId}`
    };
  },
  async confirmPayment(providerRef) {
    return { status: "PAID", providerRef };
  }
};
