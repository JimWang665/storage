#!/usr/bin/env bash
# Destroys EVERYTHING this project created in AWS (server, database, storage, CloudFront, IAM, alarms).
# Usage: scripts/teardown.sh
set -euo pipefail
cd "$(dirname "$0")/../infra"

echo "This will permanently delete all AWS resources managed by this Terraform project,"
echo "including the database and its data."
read -r -p "Type 'destroy' to continue: " answer
[ "$answer" = "destroy" ] || { echo "Cancelled."; exit 1; }

terraform destroy
echo "Done. Check the AWS console (EC2, RDS, S3, CloudFront) to confirm nothing is left."
