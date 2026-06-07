#!/usr/bin/env node
/**
 * Cross-platform SessionStart hook: locate the karpathy-guidelines SKILL.md inside
 * whatever plugin cache exists on this machine and inject it as session context.
 * Replaces the Windows-absolute-path python one-liner. Silent if the plugin is absent.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const base = path.join(dir, 'plugins');

function findSkill(root) {
  if (!fs.existsSync(root)) return null;
  const stack = [root];
  while (stack.length) {
    const d = stack.pop();
    let ents;
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (e.name === 'SKILL.md' && p.includes('karpathy-guidelines')) return p;
    }
  }
  return null;
}

let ctx = '';
const f = findSkill(base);
if (f) {
  try { ctx = '[KARPATHY GUIDELINES ACTIVE - apply to all coding/review/refactor work]\n\n' + fs.readFileSync(f, 'utf8'); } catch { /* ignore */ }
}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
