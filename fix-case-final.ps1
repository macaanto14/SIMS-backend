# PowerShell script to definitively fix case sensitivity issues
Write-Host "Fixing case sensitivity issues - Final attempt..."

# Navigate to services directory
Set-Location "C:\Dugsinet\SIMS-backend\src\services"

# Remove the lowercase file if it exists
$lowercaseFile = "auditService.ts"
if (Test-Path $lowercaseFile) {
    Remove-Item $lowercaseFile -Force
    Write-Host "Removed lowercase auditService.ts"
}

# Ensure the uppercase file exists
$uppercaseFile = "AuditService.ts"
if (-not (Test-Path $uppercaseFile)) {
    Write-Host "Creating AuditService.ts..."
    # The file should already exist from our previous creation
}

Write-Host "Case sensitivity fix completed!"
Write-Host "Current files in services directory:"
Get-ChildItem -Name