import { BriefGenerator } from "@/components/BriefGenerator";

export default function AIBriefPage() {
  return (
    <div className="container-x py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ AI Brief Generator</div>
        <h1 className="mt-2 heading-display text-balance text-5xl text-silver-100 text-glow md:text-6xl">
          Generate a professional creative brief
          <span className="text-blood-500"> in seconds.</span>
        </h1>
        <p className="mt-4 text-balance text-silver-300">
          Pick a deliverable, fill in the project, copy the result. Good for hiring designers,
          producers, and engineers — or for impressing your managers.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl">
        <BriefGenerator />
      </div>
    </div>
  );
}
