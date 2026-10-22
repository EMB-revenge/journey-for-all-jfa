"use client";

import { createContext, useContext } from "react";

import { authClient, type Session } from "~/server/better-auth/client";

type AuthContextValue = {
  session: Session | null;
  isPending: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Client-side session, read by the navbar and any page that needs the user. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();

  return (
    <AuthContext.Provider value={{ session: data ?? null, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
