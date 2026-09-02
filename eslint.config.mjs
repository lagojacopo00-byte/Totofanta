import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Worktree scratch space usata dalle sessioni cloud di Claude Code:
    // è una copia completa del repo, senza escluderla viene lintata due
    // volte (raddoppia ogni problema, veri e falsi).
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
