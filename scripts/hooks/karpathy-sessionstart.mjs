#!/usr/bin/env node
/**
 * Cross-platform SessionStart hook: inject the karpathy-guidelines SKILL.md as session context.
 *
 * Reads ONLY ~/.claude/skills/karpathy-guidelines/SKILL.md, the copy the fleet manages, and is
 * silent if that file is absent. This used to fall back to scanning ~/.claude/plugins for any
 * SKILL.md whose path contained "karpathy-guidelines", which meant a plugin marketplace clone
 * could supply the text injected into every session as authoritative coding guidance. That
 * marketplace was pinned to a GitHub path that later became a redirect to a different owner, so
 * the fallback was a live path from a third-party repo straight into session context. Failing
 * silent is the correct behaviour: a missing banner is visible and harmless, whereas a banner
 * someone else wrote is neither. navaja-sessionstart.mjs alongside this file is written the same
 * way and is the model.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const dir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const localSkill = path.join(dir, 'skills', 'karpathy-guidelines', 'SKILL.md');

let ctx = '';
if (fs.existsSync(localSkill)) {
  try { ctx = '[KARPATHY GUIDELINES ACTIVE - apply to all coding/review/refactor work]\n\n' + fs.readFileSync(localSkill, 'utf8'); } catch { /* ignore */ }
}
process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: ctx } }));
