# claude-fleet — Complete Guide

The full reference for installing, understanding, customizing, updating, and troubleshooting `claude-fleet` — a portable, consistent Claude Code setup for every machine you own (Ubuntu / Debian servers, macOS, Windows laptops).

- Repo: https://github.com/ojesusmp/claude-fleet
- Quickstart: see [`README.md`](../README.md)

---

## Table of contents

1. [What this is](#1-what-this-is)
2. [What's included](#2-whats-included)
3. [Prerequisites](#3-prerequisites)
4. [Install](#4-install)
5. [What the installer actually does](#5-what-the-installer-actually-does)
6. [Verify the install](#6-verify-the-install)
7. [Updating](#7-updating)
8. [Customizing the manifest](#8-customizing-the-manifest)
9. [How the cross-platform hooks work](#9-how-the-cross-platform-hooks-work)
10. [Security & hardening](#10-security--hardening)
11. [Troubleshooting](#11-troubleshooting)
12. [Uninstall / rollback](#12-uninstall--rollback)
13. [Repo file map](#13-repo-file-map)

---

## 1. What this is

`claude-fleet` reproduces one curated Claude Code baseline across many machines. It is **declarative**, not a copy of `~/.claude`:

- Copying `~/.claude` directly **breaks** across operating systems (hardcoded `C:\…` paths, PowerShell-only hooks, `cmd /c` MCP launchers) and **leaks machine state** (`~/.claude.json` holds OAuth tokens and per-project history).
- Instead, `claude-fleet` reads a single [`manifest.json`](../manifest.json) and rebuilds the setup from scratch on each box: enables plugins, installs skills from GitHub, writes OS-correct hooks, and registers the MCP server.

**No profiles** — every machine gets the identical set, on purpose, for consistency.

---

## 2. What's included

### Plugins (GitHub marketplaces, auto-updating)

| Plugin | What it does |
|---|---|
| `oh-my-claudecode` (OMC) | Multi-agent orchestration layer — specialized agents, skills, teams, autopilot/ralph/ultrawork modes. |
| `superpowers` | Skill framework: brainstorming, TDD, systematic debugging, writing-plans, code review, and more. |
| `frontend-design` | Generates distinctive, production-grade UI that avoids generic AI aesthetics. |
| `andrej-karpathy-skills` | Coding discipline: simplicity-first, surgical changes, surface assumptions, verify before claiming done. |
| `line-check` | Per-line diff audit catching shell continuation traps and the SSH/tar bug class across shells. |
| `caveman` *(disabled by default)* | Token-compressed communication mode (~75% shorter replies). Enable only for long sessions — it costs ~3.2k tokens always-on. |

### ECC skills (from `affaan-m/ECC`, sparse-cloned)

| Skill | What it does |
|---|---|
| `gateguard` | Fact-forcing gate that blocks Edit/Write/Bash until concrete investigation is done. |
| `security-scan` | Scans your `.claude/` config for vulnerabilities using AgentShield. |
| `context-budget` | Audits token overhead across skills/agents/MCP/rules and recommends cuts. |
| `python-patterns` | Pythonic idioms, PEP 8, type hints, best practices. |
| `react-patterns` | React 18/19 patterns: hooks discipline, server/client boundaries, accessibility. |
| `workspace-surface-audit` | Audits what your repo + MCP + plugins can actually do and what to add next. |

### Council / decision skills (your `ojesusmp` repos, one repo = one skill)

| Skill (invoke) | Source repo | What it does |
|---|---|---|
| `TrueCouncilOf12` | TrueCouncilOf12 | 12-lens universal decision analysis with Solomon coordinator. |
| `decision-council` | DecisionCouncil | Bounded go/no-go decision: PROCEED / FIX FIRST / STOP. |
| `operations-council` | OperationsCouncil | Solo-operator operability review: OPERABLE / FIX FIRST / NOT OPERABLE. |
| `techcouncil` | TechCouncil | 4-seat technical decision council (Musk, Schneier, DHH, Solomon). |
| `customer-experience-council` | Customer_Experience_Council | CX decisions (trust, anxiety, affordance, repair). |
| `sales-council` | SalesCouncil | Adversarial 3-round sales review. |
| `marketing-council` | MarketingCouncil | Adversarial 3-round marketing review: SHIP / EDIT / KILL. |
| `explica` | TrueExplica | Generates an HTML visual guide of current project state. |
| `epistemic-honesty` | Epistemic-Honesty | Truthfulness + confidence-scoring discipline against hallucination. |
| `trio` | TrueTrio | 3-lens simplicity check: PROCEED / SIMPLIFY / STOP. |

### MCP server

| Server | What it does |
|---|---|
| `claude-flow` | Multi-agent coordination + persistent vector memory (AgentDB) + self-learning hooks + neural patterns. ~314 tools. Registered at user scope via `npx @claude-flow/cli@latest mcp start`. |

### Hooks (cross-platform Node scripts)

| Event | Hook | Effect |
|---|---|---|
| SessionStart | `karpathy-sessionstart.mjs` | Injects the karpathy coding guidelines into every session. |
| PreToolUse (Bash) | `line-check-pre.mjs` | Nudges the 6-item pilot checklist before shell commands. |
| PostToolUse (Write/Edit/MultiEdit) | `line-check-post.mjs` | Nudges a 5-check diff audit after file edits. |

### Hardened settings (`settings.base.json`)

- `permissions.deny` list (`rm -rf /*`, `sudo *`, `chmod 777 *`)
- **No** `enableAllProjectMcpServers` (prevents cloned repos auto-running MCP servers)
- `effortLevel: high`, agent teams enabled
- No secrets, no machine state

---

## 3. Prerequisites

Every machine needs **Node 18+**, **git**, and the **Claude Code CLI**.

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y git curl
# Node 18+ (NodeSource — Debian/Ubuntu ship old node)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
# Claude Code CLI
npm install -g @anthropic-ai/claude-code
# verify
node -v && git --version && claude --version
```

### macOS

```bash
brew install git node
npm install -g @anthropic-ai/claude-code
node -v && git --version && claude --version
```

### Windows

Install **Node** (nodejs.org), **Git** (git-scm.com), and **Claude Code**, then use PowerShell. Verify:

```powershell
node -v; git --version; claude --version
```

> The repo is **public** — cloning needs no GitHub authentication.

---

## 4. Install

### Linux / macOS / server (over SSH works)

```bash
git clone https://github.com/ojesusmp/claude-fleet.git ~/claude-fleet
cd ~/claude-fleet
./install.sh --dry-run     # optional: preview, writes nothing
./install.sh               # real install
```

### Windows

```powershell
git clone https://github.com/ojesusmp/claude-fleet.git $HOME\claude-fleet
cd $HOME\claude-fleet
.\install.ps1              # or: .\install.ps1 -DryRun
```

Then **restart Claude Code** (close + reopen, or start a new `claude` session). Plugins are auto-installed by Claude Code on first launch after the settings are written.

> **Keep the cloned repo in place.** The hooks reference scripts inside `~/claude-fleet` by absolute path. If you delete or move the folder, re-run the installer from the new location so the hook paths update.

---

## 5. What the installer actually does

`install.sh` / `install.ps1` are thin bootstraps: check Node + git + claude, then run `scripts/apply.mjs`. The Node script (cross-platform) performs five steps:

1. **Write settings** → builds `~/.claude/settings.json` from `settings.base.json` + plugins from the manifest + OS-correct hook commands. Any existing `settings.json` is backed up first as `settings.json.bak-fleet-<timestamp>`.
2. **Install ECC skills** → sparse-clones `affaan-m/ECC` into `~/.claude/.fleet-cache/ECC` (only the needed skill folders) and copies them to `~/.claude/skills/`.
3. **Install root-skill repos** → shallow-clones each council repo and copies its contents to `~/.claude/skills/<name>/` (these repos keep `SKILL.md` at the root).
4. **Copy vendored skills** → anything in this repo's `skills-vendored/` is copied as-is.
5. **Register MCP** → runs `claude mcp add claude-flow -s user -- npx -y @claude-flow/cli@latest mcp start` (skipped with a warning if the `claude` CLI is absent).

All clones land under `~/.claude/.fleet-cache/` (git-ignored, safe to delete; re-created on next run).

---

## 6. Verify the install

```bash
# settings written
cat ~/.claude/settings.json | grep -A6 enabledPlugins

# skills present
ls ~/.claude/skills | grep -E "gateguard|sales-council|trio|python-patterns"

# MCP registered
claude mcp list | grep claude-flow
```

Inside Claude Code after restart:
- Type `/` — the new skills (e.g. `/trio`, `/security-scan`, `/sales-council`) should appear.
- Run `/context-budget` to confirm ECC skills loaded.

---

## 7. Updating

Re-running the installer refreshes everything:

```bash
cd ~/claude-fleet
git pull
./install.sh
```

- Skill repos are `git fetch` + `reset --hard` to latest.
- Plugins auto-update through their marketplaces.
- To change the lineup, edit `manifest.json` (next section) and re-run.

---

## 8. Customizing the manifest

Everything lives in [`manifest.json`](../manifest.json). After any edit, re-run the installer.

- **Add a plugin** → append to `plugins[]`:
  ```json
  { "id": "name@marketplace", "marketplace": { "name": "marketplace", "source": { "source": "github", "repo": "owner/repo" } } }
  ```
- **Add a multi-skill repo** (skills under `skills/<name>/`, like ECC) → append to `skillRepos[]`:
  ```json
  { "name": "Repo", "url": "https://github.com/owner/repo.git", "skillsPath": "skills", "sparse": true, "skills": ["a", "b"] }
  ```
- **Add a single-skill repo** (`SKILL.md` at repo root, like the councils) → append to `rootSkillRepos[]`:
  ```json
  { "repo": "RepoName", "name": "skill-name" }
  ```
  `name` **must** equal the `name:` field inside that repo's `SKILL.md` so `/skill-name` resolves. The repo label may differ (e.g. `SalesCouncil` → `sales-council`).
- **Add a skill with no GitHub repo** → drop its folder (containing `SKILL.md`) into `skills-vendored/`. It ships with this repo and installs on every run.
- **Enable caveman by default** → set its `"enabled": true`. Worth it only for long sessions (~3.2k tokens always-on; pays back after ~6 replies via ~75% shorter output).
- **Drop claude-flow** → set `"mcp": { "claudeFlow": false }`.

### Private-repo skills

Private repos (e.g. `forge-council`, `TrueBusinessCouncil`) can be added to `rootSkillRepos[]`, but the install only succeeds on machines where git is authenticated to that account (`gh auth login` or an SSH key / PAT). They are not included by default to keep the public install auth-free.

---

## 9. How the cross-platform hooks work

The original Windows setup used a `python -c` one-liner with an absolute `C:\…` path and a PowerShell silex hook — neither runs on Linux. `claude-fleet` replaces them with three self-contained Node scripts in `scripts/hooks/`:

- `karpathy-sessionstart.mjs` — walks `~/.claude/plugins` to find the karpathy-guidelines `SKILL.md` (wherever the plugin cache put it on this machine) and prints it as session context. Silent if the plugin is absent.
- `line-check-pre.mjs` / `line-check-post.mjs` — print the line-check checklists as hook context. Self-contained; no dependency on a versioned plugin path.

`apply.mjs` writes the hook commands into `settings.json` with the **absolute path resolved at install time** on each machine — so the same manifest produces `~/claude-fleet/...` on Linux and `C:\Users\you\claude-fleet\...` on Windows automatically. Node and JSON files are forced to **LF** via `.gitattributes` so bash and shebangs work on Linux.

---

## 10. Security & hardening

- **No secrets, no machine state, no absolute personal paths** are stored in the repo (verified). `~/.claude.json` (OAuth, history) is never touched or shipped.
- **Deny list** blocks `rm -rf /*`, `sudo *`, `chmod 777 *`.
- **`enableAllProjectMcpServers` is intentionally absent**, so a cloned repo cannot auto-approve and run its own MCP servers.
- The installer **backs up** any existing `settings.json` before overwriting.
- Commit history uses a GitHub **noreply** email — no personal email is exposed.

To re-audit your live config any time, the bundled `security-scan` skill runs AgentShield against `~/.claude/`.

---

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `install.sh: bad interpreter` or `^M` errors | CRLF line endings | `.gitattributes` forces LF; if you edited on Windows, run `git add --renormalize . && git checkout -- install.sh`, or `sed -i 's/\r$//' install.sh`. |
| `ERROR: Node 18+ required` | Old/missing Node | Install Node 20 (see Prerequisites). Debian's apt node is too old — use NodeSource. |
| MCP step skipped: `claude CLI not found` | Claude Code not on PATH | Install `@anthropic-ai/claude-code`, then re-run, or register manually: `claude mcp add claude-flow -s user -- npx -y @claude-flow/cli@latest mcp start`. |
| Hooks don't fire after install | Claude Code not restarted, or repo folder moved | Restart Claude Code. If you moved `~/claude-fleet`, re-run the installer from the new path. |
| Skills don't appear under `/` | Claude Code not restarted, or skill name mismatch | Restart. Confirm `~/.claude/skills/<name>/SKILL.md` exists and its `name:` matches what you invoke. |
| ECC clone is large/slow | ECC repo is ~74 MB | First run sparse-clones only the needed skill folders into `.fleet-cache`; subsequent runs just fetch. Safe to delete `.fleet-cache` to reclaim space. |
| `claude-flow` tools missing in session | MCP `autoStart` / not loaded yet | `claude mcp list` to confirm; restart Claude Code; ensure Node is available (claude-flow runs via npx). |
| Plugins not installed | First launch hasn't run yet | Claude Code auto-installs enabled marketplace plugins on the first launch after settings are written. Give it one start. |

---

## 12. Uninstall / rollback

- **Restore previous settings:**
  ```bash
  # pick the newest backup the installer made
  ls ~/.claude/settings.json.bak-fleet-*
  cp ~/.claude/settings.json.bak-fleet-<timestamp> ~/.claude/settings.json
  ```
- **Remove installed skills:** delete the folders under `~/.claude/skills/` that the manifest added (e.g. `gateguard`, the councils).
- **Remove the MCP server:** `claude mcp remove claude-flow`
- **Clear the cache:** `rm -rf ~/.claude/.fleet-cache`
- **Disable a plugin** without a full rollback: `/plugin` inside Claude Code, or set its `enabled: false` in the manifest and re-run.

---

## 13. Repo file map

```
claude-fleet/
├── README.md                         quickstart
├── docs/GUIDE.md                     this guide
├── manifest.json                     the single source of what gets installed
├── install.sh                        Linux/macOS bootstrap
├── install.ps1                       Windows bootstrap
├── .gitattributes                    forces LF on shell/node/json (Linux safety)
├── settings/
│   └── settings.base.json            static settings (env, permissions, deny list)
├── scripts/
│   ├── apply.mjs                     the installer engine (cross-platform Node)
│   └── hooks/
│       ├── karpathy-sessionstart.mjs SessionStart guideline injector
│       ├── line-check-pre.mjs        Bash pre-flight nudge
│       └── line-check-post.mjs       edit-audit nudge
└── skills-vendored/                  drop no-repo skills here to ship them
```
