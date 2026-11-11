variable "region" {
  description = "AWS region to deploy into."
  type        = string
  default     = "us-east-2"
}

variable "project" {
  description = "Name prefix for every resource."
  type        = string
  default     = "storage"
}

variable "github_repo" {
  description = "GitHub repository (owner/name) that is allowed to deploy through OIDC."
  type        = string
  default     = "JimWang665/storage"
}

variable "instance_type" {
  description = "EC2 instance type for the backend."
  type        = string
  default     = "t3.micro"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "alert_email" {
  description = "Email for CloudWatch alarm notifications. Leave empty to skip the email subscription."
  type        = string
  default     = ""
}

variable "enable_github_oidc" {
  description = "Create the GitHub OIDC provider and deploy role. Set true only if your AWS organization allows iam:CreateOpenIDConnectProvider."
  type        = bool
  default     = false
}
