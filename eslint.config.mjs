import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "eslint-config-next";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.recommended,
  pluginReactHooks.configs.recommended,
  ...nextPlugin,
];