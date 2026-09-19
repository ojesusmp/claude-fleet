#!/usr/bin/env node
/**
 * Cross-platform SessionStart hook: inject the navaja SKILL.md (Occam's razor discipline
 * for intake/output/craft/spend) as session context. Silent if the skill is absent.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const localSkill = path.join(dir, 'skills', 'navaja', 'SKILL.md');

let ctx = '';
if (fs.existsSync(localSkill)) {
  try { ctx = '[NAVAJA ACTIVE - apply Occam\'s razor to intake, output, craft, and spend]\n\n' + fs.readFileSync(localSkill, 'utf8'); } catch { /* ignore */ }
}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
