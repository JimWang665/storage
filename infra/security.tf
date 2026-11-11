# ---- Backend server ----
resource "aws_security_group" "app" {
  name_prefix = "${var.project}-app-"
  description = "Backend server: HTTP only from CloudFront"
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "app_http_from_cloudfront" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP from CloudFront origin-facing IP ranges only"
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

# HTTPS out: pull images from ECR, read secrets, ship logs, talk to Systems Manager, install packages.
resource "aws_vpc_security_group_egress_rule" "app_https_out" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS to AWS services"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}

resource "aws_vpc_security_group_egress_rule" "app_mysql_out" {
  security_group_id            = aws_security_group.app.id
  description                  = "MySQL to the database"
  referenced_security_group_id = aws_security_group.db.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}

# ---- Database ----
resource "aws_security_group" "db" {
  name_prefix = "${var.project}-db-"
  description = "Database: MySQL only from the backend server"
  vpc_id      = aws_vpc.main.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_app" {
  security_group_id            = aws_security_group.db.id
  description                  = "MySQL from the backend server security group"
  referenced_security_group_id = aws_security_group.app.id
  ip_protocol                  = "tcp"
  from_port                    = 3306
  to_port                      = 3306
}
