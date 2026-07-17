import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}
