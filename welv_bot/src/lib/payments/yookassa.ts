import type { PaymentProviderAdapter } from "./types";

// YooKassa placeholder — call POST https://api.yookassa.ru/v3/payments with Idempotence-Key.
// Kept as a stub so the project compiles without YooKassa SDK or HTTP wiring.
export const yookassaProvider: PaymentProviderAdapter = {
  name: "yookassa",
  async createPayment({ orderId, amountRubKop, description, successUrl }) {
    // TODO: const res = await fetch("https://api.yookassa.ru/v3/payments", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": "Basic " + Buffer.from(`${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`).toString("base64"),
    //     "Idempotence-Key": crypto.randomUUID(),
    //     "Content-Type": "application/json"
    //   },
    //   body: JSON.stringify({
    //     amount: { value: (amountRubKop / 100).toFixed(2), currency: "RUB" },
    //     confirmation: { type: "redirect", return_url: successUrl },
    //     capture: true,
    //     description,
    //     metadata: { orderId }
    //   })
    // });
    void amountRubKop;
    void description;
    void successUrl;
    void orderId;
    throw new Error(
      "YooKassa provider is not configured. Set PAYMENT_PROVIDER=yookassa and implement src/lib/payments/yookassa.ts."
    );
  },
  async confirmPayment(providerRef) {
    // TODO: verify webhook event "payment.succeeded" and mark order PAID.
    throw new Error(`YooKassa confirmPayment is a placeholder (ref=${providerRef}).`);
  }
};
