#!/usr/bin/env node
/**
 * Dependency audit as a hard gate, ratcheted against a committed baseline.
 *
 * `pnpm audit` with `continue-on-error: true` can never fail a build, so it stops being a gate
 * and becomes a log line nobody reads. Instead: any critical or high advisory that is not
 * already listed in `scripts/ci/audit-baseline.json` fails CI. Pre-existing advisories are
 * listed there and are paid down by SHRINKING that file — never by adding to it to get a red
 * build green.
 *
 * Advisories are keyed by `<module>@<advisory id>` so a bump that merely changes the resolved
 * version still matches, while a genuinely new advisory does not.
 *
 * Run: `pnpm audit:ci`
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BLOCKING = new Set(['critical', 'high']);
const baselinePath = join(fileURLToPath(new URL('.', import.meta.url)), 'audit-baseline.json');

function readBaseline() {
  try {
    const parsed = JSON.parse(readFileSync(baselinePath, 'utf8'));
    return new Set(parsed.accepted?.map((entry) => entry.id) ?? []);
  } catch (error) {
    if (error.code === 'ENOENT') return new Set();
    throw error;
  }
}

function runAudit() {
  // `--json` exits non-zero whenever anything is found, so the status is not the signal —
  // the parsed report is.
  const result = spawnSync('pnpm', ['audit', '--json'], { encoding: 'utf8', shell: true });
  const stdout = result.stdout?.trim() ?? '';

  if (!stdout) {
    if (result.error) throw result.error;
    // No output and no error: nothing to report.
    return [];
  }

  let report;
  try {
    report = JSON.parse(stdout);
  } catch {
    console.error('Could not parse `pnpm audit --json` output:');
    console.error(stdout.slice(0, 2000));
    process.exit(1);
  }

  return Object.values(report.advisories ?? {}).map((advisory) => ({
    id: `${advisory.module_name}@${advisory.github_advisory_id ?? advisory.id}`,
    module: advisory.module_name,
    severity: advisory.severity,
    title: advisory.title,
    url: advisory.url,
  }));
}

const baseline = readBaseline();
const advisories = runAudit();
const blocking = advisories.filter((advisory) => BLOCKING.has(advisory.severity));
const unlisted = blocking.filter((advisory) => !baseline.has(advisory.id));
const stale = [...baseline].filter((id) => !blocking.some((advisory) => advisory.id === id));

if (stale.length > 0) {
  // Not a failure — a nudge. The ratchet only tightens when someone removes these.
  console.log(
    `::notice::${stale.length} baselined advisory/ies no longer appear; drop them from audit-baseline.json:`,
  );
  for (const id of stale) console.log(`  - ${id}`);
}

if (unlisted.length === 0) {
  console.log(`Audit clean: ${blocking.length} blocking advisory/ies, all baselined.`);
  process.exit(0);
}

console.error(`::error::${unlisted.length} new critical/high advisory/ies:`);
for (const advisory of unlisted) {
  console.error(`  - [${advisory.severity}] ${advisory.id} — ${advisory.title}`);
  console.error(`    ${advisory.url}`);
}
console.error('');
console.error('Fix them by upgrading, or — only with a written reason — add the id to');
console.error('scripts/ci/audit-baseline.json.');
process.exit(1);
