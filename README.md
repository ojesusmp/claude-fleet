# claude-fleet

Portable, token-lean **Claude Code** setup for a mixed fleet — Ubuntu/Debian servers, macOS/Windows laptops. One repo, one command, the same baseline everywhere.

It does **not** clone a `~/.claude` directory (that breaks across OSes and leaks machine state). It declaratively rebuilds the setup from a `manifest.json`:

- **Plugins** — enabled via marketplaces (GitHub-sourced, auto-updating).
- **Skills with a GitHub home** — git-cloned at install (sparse) and refreshed on every re-run.
- **Hooks** — rewritten as self-locating cross-platform Node scripts (no hardcoded paths, no PowerShell).
- **claude-flow MCP** — registered through the `claude` CLI so each OS gets the right launcher.
- **Hardened defaults** — deny list, no `enableAllProjectMcpServers`, no secrets, no machine state.

## Install

```bash
# Linux / macOS
git clone https://github.com/ojesusmp/claude-fleet.git ~/claude-fleet
cd ~/claude-fleet
./install.sh              # install everything
./install.sh --dry-run   # preview, write nothing
```

```powershell
# Windows
git clone https://github.com/ojesusmp/claude-fleet.git $HOME\claude-fleet
cd $HOME\claude-fleet
.\install.ps1            # or: .\install.ps1 -DryRun
```

Then **restart Claude Code**. Re-run `install.sh` anytime to pull updated skills.

> Keep the cloned repo in place — hooks reference scripts inside it by absolute path.

## What you get (same on every machine)

No profiles — every box installs the identical set for consistency:

- **Plugins:** oh-my-claudecode, superpowers, frontend-design, karpathy-guidelines, line-check (caveman available but disabled).
- **ECC skills:** gateguard, security-scan, context-budget, python-patterns, react-patterns, workspace-surface-audit.
- **Council / decision skills:** TrueCouncilOf12, decision-council, operations-council, techcouncil, customer-experience-council, sales-council, marketing-council, explica, epistemic-honesty, trio.
- **MCP:** claude-flow (user scope).
- **Hooks:** karpathy + line-check (cross-platform Node).

## Customize

Edit `manifest.json`:

- **Add a plugin** → append to `plugins[]` with its `marketplace`.
- **Add a multi-skill GitHub repo** (skills live under `skills/<name>/`) → append to `skillRepos[]` (`url`, `skillsPath`, `skills[]`, `sparse: true`).
- **Add a single-skill repo** (SKILL.md at repo root) → append to `rootSkillRepos[]` as `{ "repo": "<RepoName>", "name": "<skill-name>" }`. `name` must equal the skill's `name:` field.
- **Add a one-off skill with no repo** → drop its folder in `skills-vendored/`.
- **Enable caveman by default** → set its `enabled: true` (worth it only on long sessions; ~3.2k tokens/session always-on).
- **Drop claude-flow** → set `mcp.claudeFlow` to `false`.

Re-run the installer after any edit to apply.

## What it writes

- `~/.claude/settings.json` (backed up first as `settings.json.bak-fleet-<ts>`)
- `~/.claude/skills/<name>/` (from `skillRepos` + `skills-vendored`)
- `~/.claude/.fleet-cache/` (shallow skill-repo clones; git-ignored, safe to delete)
- user-scope `claude-flow` MCP server

## Requirements

Node 18+, git, and the `claude` CLI (MCP step is skipped with a warning if `claude` is absent).
