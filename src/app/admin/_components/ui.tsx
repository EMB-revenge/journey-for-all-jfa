import type { ReactNode } from "react";

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-2xl font-bold tracking-tight text-charcoal">
        {title}
      </h2>
      {children}
    </div>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return (
    <p className="px-4 py-8 text-center text-sm text-neutral-500">{text}</p>
  );
}

const tones = {
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  gray: "bg-neutral-100 text-neutral-600",
  yellow: "bg-yellow-100 text-yellow-800",
} as const;

export function Badge({
  tone,
  children,
}: {
  tone: keyof typeof tones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export const th =
  "bg-paper px-4 py-3 text-xs font-semibold tracking-wider text-neutral-500 uppercase";
export const td = "px-4 py-3 text-neutral-700";
export const row = "border-t border-neutral-100 hover:bg-paper";
export const input =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm text-charcoal outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40";
export const btnPrimary =
  "rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-yellow-300 disabled:opacity-50";
export const btnDanger =
  "text-sm font-semibold text-red-600 transition hover:text-red-800 disabled:opacity-50";
export const btnLink =
  "text-sm font-semibold text-charcoal underline-offset-2 transition hover:text-yellow-600 hover:underline disabled:opacity-50";