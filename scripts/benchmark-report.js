'use strict';

const fs = require('fs');
const path = require('path');

function usage() {
  console.error('Usage: node scripts/benchmark-report.js <result.json|directory> [...]');
  process.exit(2);
}

function collectFiles(inputs) {
  const files = [];
  for (const input of inputs) {
    const absolute = path.resolve(input);
    if (!fs.existsSync(absolute)) throw new Error(`input not found: ${input}`);
    const stat = fs.statSync(absolute);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolute).sort()) {
        if (entry.endsWith('.json') && !entry.endsWith('.schema.json')) {
          files.push(path.join(absolute, entry));
        }
      }
    } else if (stat.isFile()) {
      files.push(absolute);
    }
  }
  return [...new Set(files)];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function optionalNonNegative(value, label, integer = false) {
  if (value === null || value === undefined) return;
  assert(typeof value === 'number' && Number.isFinite(value) && value >= 0, `${label} must be null or a non-negative number`);
  if (integer) assert(Number.isInteger(value), `${label} must be an integer`);
}

function validate(run, file) {
  const prefix = path.basename(file);
  assert(run && typeof run === 'object' && !Array.isArray(run), `${prefix}: result must be an object`);
  assert(run.schemaVersion === '0.1', `${prefix}: schemaVersion must be 0.1`);
  for (const key of ['experimentId', 'pairId', 'repository', 'baseCommit', 'taskId']) {
    assert(typeof run[key] === 'string' && run[key].length > 0, `${prefix}: ${key} is required`);
  }
  assert(run.condition === 'control' || run.condition === 'ppgp', `${prefix}: invalid condition`);
  if (run.condition === 'ppgp') assert(typeof run.ppgpVersion === 'string' && run.ppgpVersion.length > 0, `${prefix}: ppgpVersion required for PPGP condition`);
  assert(run.agent && typeof run.agent.product === 'string' && typeof run.agent.model === 'string', `${prefix}: agent.product and agent.model required`);
  assert(run.interruption && typeof run.interruption.trigger === 'string' && typeof run.interruption.repositoryState === 'string', `${prefix}: interruption data required`);
  assert(run.recovery && typeof run.recovery.success === 'boolean', `${prefix}: recovery.success required`);
  optionalNonNegative(run.recovery.humanReconstructionMessages, `${prefix}: humanReconstructionMessages`, true);
  optionalNonNegative(run.recovery.humanReconstructionCharacters, `${prefix}: humanReconstructionCharacters`, true);
  optionalNonNegative(run.recovery.humanReconstructionTokens, `${prefix}: humanReconstructionTokens`, true);
  optionalNonNegative(run.recovery.latencySeconds, `${prefix}: latencySeconds`);
  optionalNonNegative(run.recovery.latencyTurns, `${prefix}: latencyTurns`, true);
  optionalNonNegative(run.recovery.latencyToolCalls, `${prefix}: latencyToolCalls`, true);
  optionalNonNegative(run.recovery.latencyInputTokens, `${prefix}: latencyInputTokens`, true);
  optionalNonNegative(run.recovery.latencyOutputTokens, `${prefix}: latencyOutputTokens`, true);
  optionalNonNegative(run.recovery.avoidableDuplicateActions, `${prefix}: avoidableDuplicateActions`, true);
  assert(Number.isInteger(run.recovery.humanReconstructionMessages), `${prefix}: humanReconstructionMessages required`);
  assert(Number.isInteger(run.recovery.avoidableDuplicateActions), `${prefix}: avoidableDuplicateActions required`);
  assert(run.verification && typeof run.verification.passed === 'boolean', `${prefix}: verification.passed required`);
  if (run.maintenanceOverhead) {
    optionalNonNegative(run.maintenanceOverhead.tokens, `${prefix}: maintenanceOverhead.tokens`, true);
    optionalNonNegative(run.maintenanceOverhead.toolCalls, `${prefix}: maintenanceOverhead.toolCalls`, true);
    optionalNonNegative(run.maintenanceOverhead.seconds, `${prefix}: maintenanceOverhead.seconds`);
    optionalNonNegative(run.maintenanceOverhead.bytesWritten, `${prefix}: maintenanceOverhead.bytesWritten`, true);
    optionalNonNegative(run.maintenanceOverhead.linesWritten, `${prefix}: maintenanceOverhead.linesWritten`, true);
  }
}

function sumKnown(runs, getter) {
  let total = 0;
  let count = 0;
  for (const run of runs) {
    const value = getter(run);
    if (typeof value === 'number' && Number.isFinite(value)) {
      total += value;
      count += 1;
    }
  }
  return { total, count };
}

function fmtKnown(stat, decimals = 0) {
  if (stat.count === 0) return 'n/a';
  return decimals === 0 ? String(stat.total) : stat.total.toFixed(decimals);
}

function meanKnown(runs, getter, decimals = 1) {
  const stat = sumKnown(runs, getter);
  if (stat.count === 0) return 'n/a';
  return (stat.total / stat.count).toFixed(decimals);
}

function conditionSummary(runs, condition) {
  const subset = runs.filter((r) => r.condition === condition && !r.excluded);
  const successes = subset.filter((r) => r.recovery.success && r.verification.passed).length;
  return {
    runs: subset.length,
    successes,
    hrm: sumKnown(subset, (r) => r.recovery.humanReconstructionMessages),
    duplicate: sumKnown(subset, (r) => r.recovery.avoidableDuplicateActions),
    latencySecondsMean: meanKnown(subset, (r) => r.recovery.latencySeconds),
    latencyTurnsMean: meanKnown(subset, (r) => r.recovery.latencyTurns),
    latencyToolCallsMean: meanKnown(subset, (r) => r.recovery.latencyToolCalls),
    latencyTokensMean: meanKnown(subset, (r) => {
      const input = r.recovery.latencyInputTokens;
      const output = r.recovery.latencyOutputTokens;
      if (typeof input !== 'number' || typeof output !== 'number') return null;
      return input + output;
    }),
    overheadTokens: sumKnown(subset, (r) => r.maintenanceOverhead && r.maintenanceOverhead.tokens),
    overheadToolCalls: sumKnown(subset, (r) => r.maintenanceOverhead && r.maintenanceOverhead.toolCalls)
  };
}

function render(runs) {
  const active = runs.filter((r) => !r.excluded);
  const excluded = runs.filter((r) => r.excluded);
  const control = conditionSummary(runs, 'control');
  const ppgp = conditionSummary(runs, 'ppgp');
  const experiments = [...new Set(runs.map((r) => r.experimentId))].sort();
  const pairs = [...new Set(active.map((r) => r.pairId))].sort();

  const lines = [];
  lines.push('# PPGP Recovery Benchmark Report');
  lines.push('');
  lines.push(`Experiments: ${experiments.join(', ') || 'none'}`);
  lines.push(`Included runs: ${active.length}`);
  lines.push(`Paired identifiers observed: ${pairs.length}`);
  lines.push(`Excluded runs: ${excluded.length}`);
  lines.push('');
  lines.push('## Aggregate descriptive results');
  lines.push('');
  lines.push('| Metric | Control | PPGP |');
  lines.push('| --- | ---: | ---: |');
  lines.push(`| Included runs | ${control.runs} | ${ppgp.runs} |`);
  lines.push(`| Successful + verified recoveries | ${control.successes}/${control.runs} | ${ppgp.successes}/${ppgp.runs} |`);
  lines.push(`| Human reconstruction messages, total | ${fmtKnown(control.hrm)} | ${fmtKnown(ppgp.hrm)} |`);
  lines.push(`| Avoidable duplicate actions, total | ${fmtKnown(control.duplicate)} | ${fmtKnown(ppgp.duplicate)} |`);
  lines.push(`| Recovery latency seconds, mean of known runs | ${control.latencySecondsMean} | ${ppgp.latencySecondsMean} |`);
  lines.push(`| Recovery latency turns, mean of known runs | ${control.latencyTurnsMean} | ${ppgp.latencyTurnsMean} |`);
  lines.push(`| Recovery latency tool calls, mean of known runs | ${control.latencyToolCallsMean} | ${ppgp.latencyToolCallsMean} |`);
  lines.push(`| Recovery latency tokens, mean of comparable known runs | ${control.latencyTokensMean} | ${ppgp.latencyTokensMean} |`);
  lines.push(`| PPGP maintenance tokens, total known | n/a | ${fmtKnown(ppgp.overheadTokens)} |`);
  lines.push(`| PPGP maintenance tool calls, total known | n/a | ${fmtKnown(ppgp.overheadToolCalls)} |`);
  lines.push('');
  lines.push('## Run table');
  lines.push('');
  lines.push('| Pair | Condition | Agent | Recovery | Verification | HRM | Duplicate actions | Latency s | Deviation |');
  lines.push('| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |');
  for (const run of active.sort((a, b) => `${a.pairId}:${a.condition}`.localeCompare(`${b.pairId}:${b.condition}`))) {
    const agent = `${run.agent.product}/${run.agent.model}`.replace(/\|/g, '\\|');
    const deviation = (run.protocolDeviation || '').replace(/\|/g, '\\|');
    lines.push(`| ${run.pairId} | ${run.condition} | ${agent} | ${run.recovery.success ? 'PASS' : 'FAIL'} | ${run.verification.passed ? 'PASS' : 'FAIL'} | ${run.recovery.humanReconstructionMessages} | ${run.recovery.avoidableDuplicateActions} | ${run.recovery.latencySeconds ?? 'n/a'} | ${deviation} |`);
  }
  if (excluded.length > 0) {
    lines.push('');
    lines.push('## Exclusions');
    lines.push('');
    for (const run of excluded) {
      lines.push(`- ${run.pairId}/${run.condition}: ${run.exclusionReason || 'reason not recorded'}`);
    }
  }
  lines.push('');
  lines.push('## Interpretation constraint');
  lines.push('');
  lines.push('This report is descriptive. It does not establish universal or peer-reviewed validation of PPGP. Interpret results only for the recorded tasks, agents, versions and interruption conditions.');
  return lines.join('\n');
}

if (require.main === module) {
  if (process.argv.length < 3) usage();
  try {
    const files = collectFiles(process.argv.slice(2));
    if (files.length === 0) throw new Error('no result JSON files found');
    const runs = files.map((file) => {
      const run = JSON.parse(fs.readFileSync(file, 'utf8'));
      validate(run, file);
      return run;
    });
    process.stdout.write(`${render(runs)}\n`);
  } catch (error) {
    console.error(`benchmark-report: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { collectFiles, validate, render };
