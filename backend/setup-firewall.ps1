# Run this script as Administrator to allow incoming connections on port 5000

Write-Host "Setting up Windows Firewall rule for Macronix Backend..." -ForegroundColor Cyan

# Check if rule already exists
$existingRule = Get-NetFirewallRule -DisplayName "Macronix Backend Port 5000" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "Rule already exists. Removing old rule..." -ForegroundColor Yellow
    Remove-NetFirewallRule -DisplayName "Macronix Backend Port 5000"
}

# Create new firewall rule
New-NetFirewallRule `
    -DisplayName "Macronix Backend Port 5000" `
    -Direction Inbound `
    -LocalPort 5000 `
    -Protocol TCP `
    -Action Allow `
    -Profile Any `
    -Enabled True

Write-Host "✓ Firewall rule created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your backend server at http://192.168.29.228:5000 is now accessible from mobile devices." -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
