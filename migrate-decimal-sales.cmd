@echo off
cd /d "%~dp0"
echo.
echo === Decimal sales migration ===
echo.
echo Option 1 - Paste URL from Vercel (recommended for CMD):
echo   node scripts/migrate-decimal-sales.js "postgresql://YOUR_URL_FROM_VERCEL"
echo.
echo Option 2 - Use .env file in this folder with DATABASE_URL=...
echo   npm run migrate:decimal-sales
echo.
echo Option 3 - Run SQL in Neon SQL Editor (no URL needed)
echo.
if "%~1"=="" (
  echo No URL passed. Example:
  echo   migrate-decimal-sales.cmd "postgresql://..."
  exit /b 1
)
node scripts/migrate-decimal-sales.js "%~1"
