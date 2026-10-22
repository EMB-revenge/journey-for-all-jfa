import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "~/app/_components/auth/login-form";
import { getSession } from "~/server/better-auth/server";

export const metadata: Metadata = { title: "Sign in | JFA Transit" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo: raw } = await searchParams;

  // Only same-site paths: a full URL here would bounce the user to it
  // right after they sign in (open redirect).
  const redirectTo =
    raw?.startsWith("/") && !raw.startsWith("//") ? raw : undefined;

  if (await getSession()) redirect(redirectTo ?? "/");

  return <LoginForm redirectTo={redirectTo} />;
}
