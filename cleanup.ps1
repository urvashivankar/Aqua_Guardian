# Cleanup Script - Remove Temporary Files
# Run this to clean up one-time troubleshooting files before demo

# Files to remove (temporary troubleshooting SQL scripts)
$filesToRemove = @(
    "backend\db\fix_all_roles.sql",
    "backend\db\fix_user_roles.sql",
    "backend\db\force_admin_role.sql",
    "backend\db\force_ngo_role.sql",
    "backend\db\verify_and_fix.sql"
)

Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Cyan

foreach ($file in $filesToRemove) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "✅ Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✨ Cleanup complete! Project is ready for demo." -ForegroundColor Green
