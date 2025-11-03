'use client';

import { SimpleQueryProvider } from "@/lib/query/query-provider-simple";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Temporarily simplified providers to diagnose build issues
  return (
    <SimpleQueryProvider>
      {children}
    </SimpleQueryProvider>
  );
}