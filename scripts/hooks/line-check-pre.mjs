#!/usr/bin/env node
/** Cross-platform PreToolUse(Bash) nudge: line-check pilot pre-send checklist. */
const ctx =
  '[LINE-CHECK PRE-FLIGHT] Before sending this Bash command, run the 6-item Pilot Checklist: ' +
  'quotes paired, brackets paired, heredocs closed, no accidental trailing continuation, ' +
  'flag-args filled, right shell. If any item fails, fix the command BEFORE sending. Silent on clean.';
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: ctx } }));
