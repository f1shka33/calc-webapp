import { CustomOrderForm } from "@/components/CustomOrderForm";
import { HeroBackdrop } from "@/components/HeroBackdrop";

export default function CustomOrderPage() {
  return (
    <div className="relative">
      <HeroBackdrop />
      <div className="container-x relative py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Custom order</div>
          <h1 className="mt-2 heading-display text-balance text-5xl text-silver-100 text-glow md:text-6xl">
            Tell us what you need.
            <br />
            We&apos;ll build it for you.
          </h1>
          <p className="mt-4 text-balance text-silver-300">
            Vocal chains, mixes, covers, banners, beats, full rollouts. Drop your brief and we&apos;ll
            reply within 24 hours.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <CustomOrderForm />
        </div>
      </div>
    </div>
  );
}
