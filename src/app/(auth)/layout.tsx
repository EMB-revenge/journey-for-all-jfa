import { Navbar } from "~/app/_components/navbar";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[calc(100vh-5rem)] justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </>
  );
}
