import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import eslintReact from "@eslint-react/eslint-plugin";

const reactRecommendedTsConfig = eslintReact.configs["recommended-typescript"];
const tsRecommendedRules = tsPlugin.configs.recommended.rules;

export default [
  {
    ignores: ["build/**", "node_modules/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    ...reactRecommendedTsConfig,
    rules: {
      ...reactRecommendedTsConfig.rules,
      "@eslint-react/jsx-no-children-prop": "off",
      "@eslint-react/naming-convention-ref-name": "off",
      "@eslint-react/no-context-provider": "off",
      "@eslint-react/no-unnecessary-use-prefix": "off",
      "@eslint-react/no-use-context": "off",
      "@eslint-react/purity": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/web-api-no-leaked-event-listener": "off",
      "@eslint-react/web-api-no-leaked-timeout": "off",
      "no-prototype-builtins": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsRecommendedRules,
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
];
