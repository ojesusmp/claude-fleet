#!/usr/bin/env node
/** Cross-platform PostToolUse(Write|Edit|MultiEdit) nudge: line-check 5-check diff audit. */
const ctx =
  '[LINE-CHECK ACTIVE] File write/edit completed. Re-read the diff and audit each changed line ' +
  'through the 5 checks (Contradiction, Syntax, Shell-Mode, Fact, Scope). Fix mechanical failures ' +
  'via Edit; surface judgment-level findings before claiming completion. ' +
  'Format: <file>:<line> -- <check> -- <issue> -- <fix>. Silent on clean audits.';
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: ctx } }));
