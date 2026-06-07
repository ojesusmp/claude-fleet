#!/usr/bin/env node
/**
 * claude-fleet :: apply.mjs
 * Cross-platform setup applier. Reads manifest.json and:
 *   1. Writes a hardened ~/.claude/settings.json (plugins + marketplaces + OS-correct hooks)
 *   2. Installs skills from GitHub repos (sparse, updatable on re-run)
 *   3. Copies vendored skills shipped in this repo
 *   4. Registers the claude-flow MCP server via the claude CLI
 *
 * Usage: node scripts/apply.mjs --profile=server|laptop [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const profile = (argv.find((a) => a.startsWith('--profile=')) || '--profile=laptop').split('=')[1];
const dryRun = argv.includes('--dry-run');

const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const SKILLS_DIR = path.join(CLAUDE_DIR, 'skills');
const SETTINGS = path.join(CLAUDE_DIR, 'settings.json');
const CACHE = path.join(CLAUDE_DIR, '.fleet-cache');

const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'manifest.json'), 'utf8'));

const log = (...a) => console.log('[claude-fleet]', ...a);
const warn = (...a) => console.warn('[claude-fleet][warn]', ...a);
const ensureDir = (d) => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); };
const inProfile = (obj) => !obj.profiles || obj.profiles.includes(profile);
const sh = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const q = (s) => JSON.stringify(s); // safe shell-quoting for paths/urls

// ---------------------------------------------------------------- settings
function buildSettings() {
  const base = JSON.parse(fs.readFileSync(path.join(REPO, 'settings', 'settings.base.json'), 'utf8'));
  base.enabledPlugins = {};
  base.extraKnownMarketplaces = {};
  for (const p of manifest.plugins || []) {
    if (!inProfile(p)) continue;
    base.enabledPlugins[p.id] = p.enabled !== false;
    if (p.marketplace) base.extraKnownMarketplaces[p.marketplace.name] = { source: p.marketplace.source };
  }
  // Cross-platform hooks: shipped Node scripts, absolute path resolved at install time.
  const hook = (file) => 'node ' + q(path.join(REPO, 'scripts', 'hooks', file));
  base.hooks = {
    SessionStart: [{ hooks: [{ type: 'command', command: hook('karpathy-sessionstart.mjs') }] }],
    PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: hook('line-check-pre.mjs') }] }],
    PostToolUse: [{ matcher: 'Write|Edit|MultiEdit', hooks: [{ type: 'command', command: hook('line-check-post.mjs') }] }]
  };
  return base;
}

function applySettings() {
  ensureDir(CLAUDE_DIR);
  const s = buildSettings();
  if (dryRun) { log('DRY-RUN settings.json:\n' + JSON.stringify(s, null, 2)); return; }
  if (fs.existsSync(SETTINGS)) {
    const bak = `${SETTINGS}.bak-fleet-${Date.now()}`;
    fs.copyFileSync(SETTINGS, bak);
    log('backed up existing settings ->', path.basename(bak));
  }
  fs.writeFileSync(SETTINGS, JSON.stringify(s, null, 2));
  log('wrote', SETTINGS);
}

// ---------------------------------------------------------------- skill repos
function syncRepo(r) {
  const dest = path.join(CACHE, r.name);
  const paths = (r.skills || []).map((s) => `${r.skillsPath || 'skills'}/${s}`);
  try {
    if (fs.existsSync(path.join(dest, '.git'))) {
      sh(`git -C ${q(dest)} fetch --depth 1 origin`);
      sh(`git -C ${q(dest)} reset --hard FETCH_HEAD`);
    } else if (r.sparse) {
      sh(`git clone --depth 1 --filter=blob:none --sparse ${q(r.url)} ${q(dest)}`);
      sh(`git -C ${q(dest)} sparse-checkout set ${paths.map(q).join(' ')}`);
    } else {
      sh(`git clone --depth 1 ${q(r.url)} ${q(dest)}`);
    }
  } catch (e) {
    warn('repo sync failed:', r.name, e.message);
    return false;
  }
  return true;
}

function applySkillRepos() {
  if (!(manifest.skillRepos || []).length) return;
  ensureDir(SKILLS_DIR);
  ensureDir(CACHE);
  for (const r of manifest.skillRepos) {
    if (!inProfile(r)) continue;
    if (dryRun) { log('DRY-RUN would sync repo', r.name, '->', (r.skills || []).join(', ')); continue; }
    if (!syncRepo(r)) continue;
    for (const sk of r.skills || []) {
      const src = path.join(CACHE, r.name, r.skillsPath || 'skills', sk);
      if (!fs.existsSync(src)) { warn('skill missing in repo:', `${r.name}/${sk}`); continue; }
      fs.cpSync(src, path.join(SKILLS_DIR, sk), { recursive: true, force: true });
      log('skill <-', `${r.name}/${sk}`);
    }
  }
}

// ---------------------------------------------------------------- root-skill repos
// Repos where SKILL.md is at the repo root (one repo == one skill).
function applyRootSkillRepos() {
  const repos = manifest.rootSkillRepos || [];
  if (!repos.length) return;
  ensureDir(SKILLS_DIR);
  ensureDir(CACHE);
  for (const r of repos) {
    if (!inProfile(r)) continue;
    if (dryRun) { log('DRY-RUN would install root-skill', r.repo, '->', r.name); continue; }
    const url = r.url || `https://github.com/${manifest.githubOwner}/${r.repo}.git`;
    const dest = path.join(CACHE, 'root-' + r.repo);
    try {
      if (fs.existsSync(path.join(dest, '.git'))) {
        sh(`git -C ${q(dest)} fetch --depth 1 origin`);
        sh(`git -C ${q(dest)} reset --hard FETCH_HEAD`);
      } else {
        sh(`git clone --depth 1 ${q(url)} ${q(dest)}`);
      }
    } catch (e) {
      warn('root-skill clone failed:', r.repo, e.message);
      continue;
    }
    if (!fs.existsSync(path.join(dest, 'SKILL.md'))) { warn('no root SKILL.md in', r.repo); continue; }
    const target = path.join(SKILLS_DIR, r.name);
    fs.rmSync(target, { recursive: true, force: true });
    ensureDir(target);
    for (const e of fs.readdirSync(dest)) {
      if (e === '.git' || e === '.github') continue;
      fs.cpSync(path.join(dest, e), path.join(target, e), { recursive: true, force: true });
    }
    log('skill <-', `${r.repo} (${r.name})`);
  }
}

// ---------------------------------------------------------------- vendored skills
function applyVendored() {
  const vdir = path.join(REPO, 'skills-vendored');
  if (!fs.existsSync(vdir)) return;
  ensureDir(SKILLS_DIR);
  for (const sk of fs.readdirSync(vdir)) {
    const src = path.join(vdir, sk);
    if (!fs.statSync(src).isDirectory()) continue;
    if (dryRun) { log('DRY-RUN would vendor skill', sk); continue; }
    fs.cpSync(src, path.join(SKILLS_DIR, sk), { recursive: true, force: true });
    log('skill <- vendored/' + sk);
  }
}

// ---------------------------------------------------------------- MCP
function applyMcp() {
  const m = manifest.mcp;
  if (!m || !m.claudeFlow || !inProfile(m)) return;
  if (dryRun) { log('DRY-RUN would register claude-flow MCP'); return; }
  const addCmd = 'claude mcp add claude-flow -s user -- npx -y @claude-flow/cli@latest mcp start';
  try {
    execSync('claude mcp list', { stdio: 'pipe' });
  } catch {
    warn('claude CLI not found. Register MCP manually:\n  ' + addCmd);
    return;
  }
  try {
    sh(addCmd);
    log('registered claude-flow MCP (user scope)');
  } catch (e) {
    warn('claude-flow MCP not added (may already exist):', e.message);
  }
}

// ---------------------------------------------------------------- main
log(`profile=${profile} target=${CLAUDE_DIR}${dryRun ? ' (dry-run)' : ''}`);
applySettings();
applySkillRepos();
applyRootSkillRepos();
applyVendored();
applyMcp();
log('done. Restart Claude Code to load the new configuration.');
