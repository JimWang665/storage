# The database password lives in Secrets Manager (created and rotated-capable via aws_db_instance above).
# This second value is the shared secret CloudFront sends to the backend. SecureString parameters in
# Systems Manager Parameter Store are free, so it is stored there.

resource "random_password" "origin_verify" {
  length  = 40
  special = false
}

resource "aws_ssm_parameter" "origin_verify" {
  name  = "/${var.project}/origin-verify"
  type  = "SecureString"
  value = random_password.origin_verify.result
}
