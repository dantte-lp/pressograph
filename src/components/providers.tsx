'use client';

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { SimpleQueryProvider } from "@/lib/query/query-provider-simple";
import { I18nProvider } from "@/components/i18n-provider";
import { Toaster } from "@/components/ui/sonner";

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
        <I18nProvider>
          <SimpleQueryProvider>
            {children}
            <Toaster />
          </SimpleQueryProvider>
        </I18nProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}