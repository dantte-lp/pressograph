/**
 * TypeScript module declarations for JSON files
 *
 * Allows importing JSON files with proper typing
 */

declare module '*/messages/en.json' {
  const value: Record<string, any>;
  export default value;
}

declare module '*/messages/ru.json' {
  const value: Record<string, any>;
  export default value;
}
