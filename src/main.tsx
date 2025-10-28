// ═══════════════════════════════════════════════════════════════════
// Application Entry Point
// ═══════════════════════════════════════════════════════════════════

import { createRoot } from 'react-dom/client';
import { HeroUIProvider } from '@heroui/react';
import { LanguageProvider } from './i18n';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <HeroUIProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </HeroUIProvider>
);
