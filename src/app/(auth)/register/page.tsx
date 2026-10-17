import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { RegisterForm } from "~/app/_components/auth/register-form";
import { getSession } from "~/server/better-auth/server";

export const metadata: Metadata = { title: "Create account | JFA Transit" };

export default async function RegisterPage() {
  if (await getSession()) redirect("/");

  return <RegisterForm />;
}
