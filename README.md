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
git clone https://github.com/<you>/claude-fleet.git ~/claude-fleet
cd ~/claude-fleet
./install.sh server      # headless box   (lean)
./install.sh laptop      # workstation    (full)
./install.sh laptop --dry-run   # preview, write nothing
```

```powershell
# Windows
git clone https://github.com/<you>/claude-fleet.git $HOME\claude-fleet
cd $HOME\claude-fleet
.\install.ps1 -Profile laptop
```

Then **restart Claude Code**. Re-run `install.sh` anytime to pull updated skills.

> Keep the cloned repo in place — hooks reference scripts inside it by absolute path.

## Profiles

| | `server` | `laptop` |
|---|---|---|
| Core plugins (OMC, superpowers, karpathy, line-check) | ✅ | ✅ |
| frontend-design | — | ✅ |
| ECC skills (gateguard, security-scan, context-budget, python/react-patterns, workspace-surface-audit) | ✅ | ✅ |
| claude-flow MCP | ✅ | ✅ |
| caveman | off (available) | off (available) |

## Customize

Edit `manifest.json`:

- **Add a plugin** → append to `plugins[]` with its `marketplace`. Add `"profiles": ["laptop"]` to scope it.
- **Add a GitHub skill** → append to `skillRepos[]` (`url`, `skillsPath`, `skills[]`, `sparse: true`). Re-run to install.
- **Add a one-off skill with no repo** → drop its folder in `skills-vendored/`. It ships with this repo and updates when you update the repo.
- **Enable caveman by default** → set its `enabled: true` (worth it only on long sessions; costs ~3.2k tokens/session always-on).
- **Drop claude-flow on a box** → remove `"server"`/`"laptop"` from `mcp.profiles`.

## What it writes

- `~/.claude/settings.json` (backed up first as `settings.json.bak-fleet-<ts>`)
- `~/.claude/skills/<name>/` (from `skillRepos` + `skills-vendored`)
- `~/.claude/.fleet-cache/` (shallow skill-repo clones; git-ignored, safe to delete)
- user-scope `claude-flow` MCP server

## Requirements

Node 18+, git, and the `claude` CLI (MCP step is skipped with a warning if `claude` is absent).
