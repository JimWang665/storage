output "site_url" {
  description = "Public URL of the app."
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

output "ecr_repository" {
  value = aws_ecr_repository.app.name
}

output "instance_id" {
  value = aws_instance.app.id
}

output "frontend_bucket" {
  value = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

output "github_deploy_role_arn" {
  value = one(aws_iam_role.github_deploy[*].arn)
}

output "aws_region" {
  value = var.region
}

output "database_endpoint" {
  value = aws_db_instance.main.address
}
