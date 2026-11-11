# ---- Permissions for the server (least privilege: only what deploy.sh and the app need) ----
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "${var.project}-app"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Lets the deploy workflow run commands on the server through Systems Manager instead of SSH.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "app" {
  statement {
    sid       = "EcrLogin"
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }

  statement {
    sid = "EcrPull"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:BatchGetImage",
      "ecr:GetDownloadUrlForLayer",
    ]
    resources = [aws_ecr_repository.app.arn]
  }

  statement {
    sid       = "ReadDatabaseSecret"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_db_instance.main.master_user_secret[0].secret_arn]
  }

  statement {
    sid       = "ReadOriginSecret"
    actions   = ["ssm:GetParameter"]
    resources = [aws_ssm_parameter.origin_verify.arn]
  }

  statement {
    sid       = "WriteLogs"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.backend.arn}:*"]
  }
}

resource "aws_iam_role_policy" "app" {
  name   = "${var.project}-app"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app.json
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.project}-app"
  role = aws_iam_role.app.name
}

# ---- The server ----
resource "aws_instance" "app" {
  ami                    = data.aws_ssm_parameter.al2023.value
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.app.name

  user_data = templatefile("${path.module}/ec2_user_data.sh.tftpl", {
    region        = var.region
    ecr_registry  = split("/", aws_ecr_repository.app.repository_url)[0]
    ecr_repo_url  = aws_ecr_repository.app.repository_url
    db_host       = aws_db_instance.main.address
    db_name       = aws_db_instance.main.db_name
    db_secret_arn = aws_db_instance.main.master_user_secret[0].secret_arn
    origin_param  = aws_ssm_parameter.origin_verify.name
    log_group     = aws_cloudwatch_log_group.backend.name
  })
  user_data_replace_on_change = true

  # IMDSv2 only: blocks a common class of credential-theft attacks.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device {
    volume_type = "gp3"
    volume_size = 16
    encrypted   = true
  }

  tags = { Name = "${var.project}-app" }

  lifecycle {
    ignore_changes = [ami] # do not replace the server just because a newer Amazon Linux image was published
  }
}

# A fixed public address, so CloudFront can keep pointing at the server across reboots.
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id

  depends_on = [aws_internet_gateway.main]
}
