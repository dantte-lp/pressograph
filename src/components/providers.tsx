'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SimpleQueryProvider } from "@/lib/query/query-provider-simple";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <SimpleQueryProvider>
          {children}
        </SimpleQueryProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}