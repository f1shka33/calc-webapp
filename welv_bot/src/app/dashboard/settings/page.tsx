import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true }
  });
  if (!dbUser) throw new Error("User not found");
  return (
    <div className="max-w-xl">
      <h2 className="heading-display text-2xl text-silver-100">Account settings</h2>
      <p className="mt-1 text-sm text-silver-300">
        Update your artist name and password. Your email is your login identity.
      </p>
      <div className="mt-6">
        <SettingsForm user={{ email: dbUser.email, name: dbUser.name, role: dbUser.role }} />
      </div>
    </div>
  );
}
