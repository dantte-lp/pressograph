/**
 * TypeScript type augmentation for next-intl
 *
 * This file provides type safety for translation keys across the entire application.
 * With this augmentation, TypeScript will validate that translation keys exist
 * and provide autocomplete for all available translation paths.
 *
 * @see https://next-intl.dev/docs/workflows/typescript
 */

import type enMessages from '@/messages/en.json';

type Messages = typeof enMessages;

declare global {
  // Use type safe messages!
  interface IntlMessages extends Messages {}
}
