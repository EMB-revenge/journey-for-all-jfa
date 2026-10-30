import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import { redirect } from "next/navigation";

import { ResolveFeedbackButton } from "~/app/_components/admin/resolve-feedback-button";
import { Navbar } from "~/app/_components/navbar";
import { formatBookedAt } from "~/app/_lib/format";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "Feedback | JFA Transit admin" };

export default async function AdminFeedbackPage() {
  let messages;
  try {
    messages = await api.admin.feedback.list();
  } catch (error) {
    if (error instanceof TRPCError) {
      if (error.code === "UNAUTHORIZED") {
        redirect(`/login?redirectTo=${encodeURIComponent("/admin/feedback")}`);
      }
      if (error.code === "FORBIDDEN") redirect("/");
    }
    throw error;
  }

  const open = messages.filter((message) => message.resolvedAt === null).length;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">
          Contact tickets
        </h1>
        <p className="mt-2 text-neutral-600">
          {open === 0
            ? "Nothing open right now."
            : `${open} open ${open === 1 ? "ticket" : "tickets"} to answer.`}
        </p>

        {messages.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center text-neutral-600">
            No tickets yet. Messages sent from the contact page land here.
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {messages.map((message) => (
              <li
                key={message.id}
                className={`rounded-2xl border p-6 ${
                  message.resolvedAt
                    ? "border-neutral-200 bg-neutral-50"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-neutral-900">
                    {message.name}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {formatBookedAt(message.createdAt)}
                  </p>
                </div>
                <p className="text-sm break-all text-neutral-500">
                  {message.email}
                </p>
                <p className="mt-3 whitespace-pre-line text-neutral-800">
                  {message.message}
                </p>

                <div className="mt-4">
                  {message.resolvedAt ? (
                    <p className="text-sm font-semibold text-green-700">
                      Handled {formatBookedAt(message.resolvedAt)}
                    </p>
                  ) : (
                    <ResolveFeedbackButton id={message.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
