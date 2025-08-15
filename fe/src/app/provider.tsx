"use client";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return <SessionProvider>{children}</SessionProvider>;
};

// refetchInterval={5 * 60}
// refetchOnWindowFocus={true}
