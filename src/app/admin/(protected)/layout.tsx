import { requireAdmin } from "@/server/auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const signOutAction = async () => {
    "use server";
    await auth.api.signOut({ headers: await headers() });
    redirect("/admin/login");
  };

  return (
    <AdminShell userEmail={session.user.email} signOutAction={signOutAction}>
      {children}
    </AdminShell>
  );
}
