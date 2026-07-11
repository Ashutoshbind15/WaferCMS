#!/usr/bin/env node
/**
 * Generate a full third-party attribution disclaimer (license texts included)
 * via @quantco/pnpm-licenses. Intended for image builds / CI — do not commit output.
 *
 * Usage:
 *   node scripts/generate-third-party-notices.mjs \
 *     --filter cms-server... \
 *     --component cms-server \
 *     --out /licenses/THIRD_PARTY_NOTICES
 *
 * @see https://github.com/Quantco/pnpm-licenses
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const PNPM_LICENSES_PKG = "@quantco/pnpm-licenses@2.4.2";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  if (i === -1) return fallback;
  return args[i + 1] ?? fallback;
};

const filter = getArg("--filter");
const component = getArg("--component", filter ?? "wafercms");
const outPath = resolve(getArg("--out", "THIRD_PARTY_NOTICES"));

if (!filter) {
  console.error("Missing required --filter (e.g. cms-server... or cms-client...)");
  process.exit(1);
}

const licensesJson = spawnSync(
  "pnpm",
  ["licenses", "list", "--filter", filter, "--prod", "--json"],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);

if (licensesJson.status !== 0) {
  console.error(
    licensesJson.stderr || licensesJson.stdout || "pnpm licenses list failed",
  );
  process.exit(licensesJson.status ?? 1);
}

const tmpJson = join(
  tmpdir(),
  `wafercms-licenses-${randomBytes(8).toString("hex")}.json`,
);
const tmpDisclaimer = join(
  tmpdir(),
  `wafercms-disclaimer-${randomBytes(8).toString("hex")}.txt`,
);
writeFileSync(tmpJson, licensesJson.stdout, "utf8");

// Exclude this monorepo's own packages from third-party attribution.
const excludeOwn = JSON.stringify([
  "wafercms",
  "cms-server",
  "cms-client",
  "@packages/*",
  "@wafercms/*",
]);

const disclaimer = runPnpmLicenses([
  "generate-disclaimer",
  "--json-input-file",
  tmpJson,
  "--output-file",
  tmpDisclaimer,
  `--filter=${excludeOwn}`,
]);

if (disclaimer.status !== 0) {
  console.error(
    disclaimer.stderr || disclaimer.stdout || "pnpm-licenses generate-disclaimer failed",
  );
  process.exit(disclaimer.status ?? 1);
}

const body = readFileSync(tmpDisclaimer, "utf8");
const header = [
  `Third-Party Notices for WaferCMS (${component})`,
  `Generated: ${new Date().toISOString()}`,
  "",
  "WaferCMS itself is licensed under the MIT License; see /licenses/LICENSE.",
  "",
  "This file contains attribution notices and license texts for production",
  "npm dependencies redistributed with this component, generated with",
  "@quantco/pnpm-licenses (https://github.com/Quantco/pnpm-licenses).",
  "",
  "Operating-system packages and other contents of the container base image",
  "are inventoried in the container SBOM (Syft) published alongside the image.",
  "",
  "NOTE: Some dependencies (notably sharp/libvips) use LGPL. Those libraries",
  "are dynamically linked; their license texts appear in the notices below.",
  "",
  "".padEnd(72, "="),
  "",
  "",
].join("\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, header + body, "utf8");
console.log(`Wrote ${outPath} (${Buffer.byteLength(header + body)} bytes)`);

/**
 * Resolve @quantco/pnpm-licenses CLI: global install, pnpm exec, then npx pin.
 * @param {string[]} cliArgs
 */
function runPnpmLicenses(cliArgs) {
  const attempts = [
    ["pnpm-licenses", cliArgs],
    ["pnpm", ["exec", "pnpm-licenses", ...cliArgs]],
    ["npx", ["--yes", PNPM_LICENSES_PKG, ...cliArgs]],
  ];

  let last = null;
  for (const [cmd, cmdArgs] of attempts) {
    last = spawnSync(cmd, cmdArgs, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    if (last.status === 0) return last;
    // ENOENT / not found → try next resolver
    if (last.error?.code === "ENOENT") continue;
    // Other failures: still try fallbacks (e.g. pnpm exec when pkg not installed)
    if (/not found|Cannot find|ERR_PNPM|npm error/i.test(
      `${last.stderr ?? ""}${last.stdout ?? ""}`,
    )) {
      continue;
    }
    return last;
  }
  return last ?? { status: 1, stderr: "pnpm-licenses CLI not available" };
}
