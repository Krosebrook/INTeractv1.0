@echo off
REM INTeract Platform Analyzer
REM Runs the refactoring agent on the Platform codebase

cd /d "%~dp0python"
python -m src.main "%~dp0..\platform" %*
