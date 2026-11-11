# Deploys the app to AWS from your own machine (same steps as the GitHub Actions deploy job).
# Run from the project root:  .\scripts\deploy.ps1
# Needs: Docker running, `aws login` done, Terraform already applied (infra/ has state).
$ErrorActionPreference = "Stop"

function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what failed (exit code $LASTEXITCODE)" } }

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1. Read resource names from Terraform's outputs so nothing is hard-coded.
$out = terraform -chdir=infra output -json | ConvertFrom-Json
Check "terraform output"
$region   = $out.aws_region.value
$repo     = $out.ecr_repository.value
$instance = $out.instance_id.value
$bucket   = $out.frontend_bucket.value
$dist     = $out.cloudfront_distribution_id.value
$env:AWS_DEFAULT_REGION = $region

$account  = aws sts get-caller-identity --query Account --output text
Check "aws sts get-caller-identity (run 'aws login' first)"
$registry = "$account.dkr.ecr.$region.amazonaws.com"

# 2. Unique image tag (ECR tags are immutable, so every deploy needs a new one).
$sha = (git rev-parse --short=12 HEAD 2>$null)
if (-not $sha) { $sha = "nogit" }
$tag = "$sha-$(Get-Date -Format yyyyMMddHHmmss)"
$image = "${registry}/${repo}:${tag}"

# 3. Build the backend image and push it to ECR.
Write-Host "==> Logging in to ECR"
$token = (aws ecr get-login-password --region $region | Out-String).Trim()
if (-not $token) { throw "Could not get an ECR login token (try 'aws login' again)" }
# The ECR token from an 'aws login' session is ~4000 characters, more than Windows Credential Manager
# (Docker's default credential store) can hold. Use a throwaway Docker config folder with no credential
# store, so Docker keeps the token in a plain file there, and delete the folder when finished.
$dockerCfg = Join-Path $env:TEMP "docker-ecr-config"
if (Test-Path $dockerCfg) { Remove-Item -Recurse -Force $dockerCfg }
New-Item -ItemType Directory -Force $dockerCfg | Out-Null
# A placeholder "auths" entry stops Docker from auto-selecting the Windows credential store.
Set-Content -Path (Join-Path $dockerCfg "config.json") -Value '{"auths":{"placeholder.invalid":{}}}' -Encoding ascii
$env:DOCKER_CONFIG = $dockerCfg
try {
  docker login --username AWS --password $token $registry
  Check "docker login"
  Write-Host "==> Building $image"
  docker build -t $image .
  Check "docker build"
  Write-Host "==> Pushing image"
  docker push $image
  Check "docker push"
}
finally {
  Remove-Item Env:\DOCKER_CONFIG -ErrorAction SilentlyContinue
  Remove-Item -Recurse -Force $dockerCfg -ErrorAction SilentlyContinue
}

# 4. Upload the static front end to S3.
Write-Host "==> Syncing front end to s3://$bucket"
aws s3 sync src/main/resources/static "s3://$bucket" --delete
Check "s3 sync"

# 5. Tell the server (through Systems Manager, no SSH) to pull and start the new image.
Write-Host "==> Deploying on $instance"
$paramFile = Join-Path $env:TEMP "ssm-params.json"
@{ commands = @("/opt/storage/deploy.sh $tag") } | ConvertTo-Json -Compress | Set-Content -Path $paramFile -Encoding ascii
$cmdId = aws ssm send-command --instance-ids $instance --document-name "AWS-RunShellScript" `
  --comment "Deploy $tag" --timeout-seconds 600 --parameters "file://$paramFile" `
  --query "Command.CommandId" --output text
Check "ssm send-command"
aws ssm wait command-executed --command-id $cmdId --instance-id $instance
$status = aws ssm get-command-invocation --command-id $cmdId --instance-id $instance --query Status --output text
aws ssm get-command-invocation --command-id $cmdId --instance-id $instance `
  --query "{out:StandardOutputContent,err:StandardErrorContent}" --output text
if ($status -ne "Success") { throw "Deploy command finished with status $status" }

# 6. Make CloudFront forget the cached copy of the front end.
Write-Host "==> Invalidating CloudFront cache"
aws cloudfront create-invalidation --distribution-id $dist --paths "/*" --query "Invalidation.Id" --output text
Check "cloudfront invalidation"

Write-Host ""
Write-Host "Done. Site: $($out.site_url.value)"
