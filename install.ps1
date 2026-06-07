# claude-fleet installer (Windows). Usage: .\install.ps1 [-Profile laptop|server] [-DryRun]
param(
  [ValidateSet("laptop", "server")] [string]$Profile = "laptop",
  [switch]$DryRun
)
$ErrorActionPreference = "Stop"
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "[claude-fleet] installing profile=$Profile"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node 18+ required" }
if (-not (Get-Command git  -ErrorAction SilentlyContinue)) { throw "git required" }
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Write-Host "[claude-fleet][warn] 'claude' CLI not found - MCP registration will be skipped."
}

$fleetArgs = @("$dir/scripts/apply.mjs", "--profile=$Profile")
if ($DryRun) { $fleetArgs += "--dry-run" }
& node @fleetArgs

Write-Host "[claude-fleet] done. Restart Claude Code to load."
