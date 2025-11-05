import drizzlePlugin from "eslint-plugin-drizzle";

/**
 * ESLint Configuration
 *
 * Includes Drizzle ORM plugin for best practices enforcement
 *
 * @see https://orm.drizzle.team/docs/eslint-plugin
 */
export default [
  {
    ignores: ["*.config.*", ".next/**", "node_modules/**", "drizzle/**"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      drizzle: drizzlePlugin,
    },
    rules: {
      // TypeScript rules (relaxed for development)
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // Drizzle ORM rules
      "drizzle/enforce-delete-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
      "drizzle/enforce-update-with-where": [
        "error",
        {
          drizzleObjectName: ["db", "ctx.db"],
        },
      ],
    },
  },
];