import type { PaymentProviderAdapter } from "./types";

// Stripe placeholder — wire up `stripe` SDK + a webhook route at /api/webhooks/stripe.
// Kept as a deliberate stub so the project compiles without `stripe` as a dependency.
export const stripeProvider: PaymentProviderAdapter = {
  name: "stripe",
  async createPayment({ orderId, amountUsdCents, description, successUrl, cancelUrl }) {
    // TODO: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-09-30.acacia" });
    // const session = await stripe.checkout.sessions.create({
    //   mode: "payment",
    //   line_items: [{ price_data: { currency: "usd", product_data: { name: description }, unit_amount: amountUsdCents }, quantity: 1 }],
    //   success_url: successUrl,
    //   cancel_url: cancelUrl,
    //   metadata: { orderId }
    // });
    // return { redirectUrl: session.url!, providerRef: session.id };
    void amountUsdCents;
    void cancelUrl;
    throw new Error(
      "Stripe provider is not configured. Set PAYMENT_PROVIDER=stripe and implement src/lib/payments/stripe.ts."
    );
  },
  async confirmPayment(providerRef) {
    // TODO: verify checkout.session.completed via webhook, then mark order PAID.
    throw new Error(`Stripe confirmPayment is a placeholder (ref=${providerRef}).`);
  }
};
