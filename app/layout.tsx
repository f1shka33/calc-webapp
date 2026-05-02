import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Casino Wallet Sandbox · Demo",
  description:
    "A sandbox-only crypto-wallet & casino simulator. Demo balances, fake coins, fake transaction hashes — no real money. Created by welv_bot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AppShell>{children}</AppShell>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            className:
              "!bg-white/[0.04] !backdrop-blur-xl !border !border-white/10 !text-white",
          }}
        />
      </body>
    </html>
  );
}
