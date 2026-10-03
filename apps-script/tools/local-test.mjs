/**
 * Runs setupDatabase() twice (idempotency) and selfTest() against the in-memory mock.
 *   node apps-script/tools/local-test.mjs
 */
import { createAppsScriptContext } from "./mock-env.mjs";

const { ss, logs, run } = createAppsScriptContext();
let failed = false;
try {
  const result = run("setupDatabase()");
  console.log(`setupDatabase(): created ${result.sheetsCreated.length} sheets`);
  run("setupDatabase()");
  const names = ss.sheets.map((s) => s.name);
  console.log(`setupDatabase() re-run: ${names.length} sheets total (no duplicates: ${new Set(names).size === names.length})`);
  run("selfTest()");
} catch (e) {
  failed = true;
  console.error(e);
}
console.log(logs.filter((l) => /✅|❌|🧹|⚠️/.test(l)).join("\n"));

const leftovers = ss.sheets
  .filter((s) => !/Logs/.test(s.name))
  .map((s) => [s.name, s.getLastRow() - 1])
  .filter(([, n]) => n > 0);
console.log(leftovers.length ? `Leftover rows: ${JSON.stringify(leftovers)}` : "No leftover rows after cleanup");
process.exit(failed || logs.some((l) => l.includes("❌")) ? 1 : 0);
