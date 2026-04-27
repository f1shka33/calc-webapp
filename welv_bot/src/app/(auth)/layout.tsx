import { HeroBackdrop } from "@/components/HeroBackdrop";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[80vh]">
      <HeroBackdrop />
      <div className="container-x relative grid min-h-[80vh] place-items-center py-20">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
