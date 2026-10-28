@echo off
cd /d "%~dp0"
if exist "runtime\node.exe" (
  "runtime\node.exe" scripts\presentation.mjs
) else (
  node scripts\presentation.mjs
)
pause
