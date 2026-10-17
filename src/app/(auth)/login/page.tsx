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
  const { redirectTo } = await searchParams;

  if (await getSession()) redirect(redirectTo ?? "/");

  return <LoginForm redirectTo={redirectTo} />;
}
