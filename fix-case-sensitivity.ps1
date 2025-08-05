# PowerShell script to fix case sensitivity issues
Write-Host "Fixing case sensitivity issues..."

# Remove the lowercase auditService.ts file
$lowercaseFile = "C:\Dugsinet\SIMS-backend\src\services\auditService.ts"
if (Test-Path $lowercaseFile) {
    Remove-Item $lowercaseFile -Force
    Write-Host "Removed lowercase auditService.ts"
}

# Rename the temp file to the correct case
$tempFile = "C:\Dugsinet\SIMS-backend\src\services\AuditServiceTemp.ts"
$correctFile = "C:\Dugsinet\SIMS-backend\src\services\AuditService.ts"

if (Test-Path $tempFile) {
    if (Test-Path $correctFile) {
        Remove-Item $correctFile -Force
    }
    Rename-Item $tempFile $correctFile
    Write-Host "Renamed AuditServiceTemp.ts to AuditService.ts"
}

Write-Host "Case sensitivity fix completed!"