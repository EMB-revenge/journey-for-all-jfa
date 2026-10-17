import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "~/app/_components/auth/change-password-form";
import { getSession } from "~/server/better-auth/server";

export const metadata: Metadata = { title: "Change password | JFA Transit" };

export default async function ChangePasswordPage() {
  if (!(await getSession())) redirect("/login?redirectTo=/change-password");

  return <ChangePasswordForm />;
}
