# Destroys EVERYTHING this project created in AWS (server, database, storage, CloudFront, IAM, alarms).
# Usage (PowerShell, from the repo root):  .\scripts\teardown.ps1
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\infra")

Write-Host "This will permanently delete all AWS resources managed by this Terraform project,"
Write-Host "including the database and its data."
$answer = Read-Host "Type 'destroy' to continue"
if ($answer -ne "destroy") { Write-Host "Cancelled."; exit 1 }

terraform destroy
Write-Host "Done. Check the AWS console (EC2, RDS, S3, CloudFront) to confirm nothing is left."
