import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "~/app/_components/auth/profile-form";
import { getSession } from "~/server/better-auth/server";

export const metadata: Metadata = { title: "Account | JFA Transit" };

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?redirectTo=/account");

  return (
    <ProfileForm
      email={session.user.email}
      initialName={session.user.name}
      initialPhone={session.user.phone ?? ""}
    />
  );
}
