resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-db"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier     = "${var.project}-db"
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class

  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = "storage"
  username = "storageadmin"

  # AWS generates the master password and keeps it in Secrets Manager. It never appears in code or in
  # the Terraform configuration, and the app reads it at startup.
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.db.id]
  publicly_accessible    = false
  multi_az               = false

  backup_retention_period    = 1
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true
  apply_immediately          = true

  # Demo settings so `terraform destroy` removes everything cleanly. A real production database would
  # keep deletion protection on and take a final snapshot.
  deletion_protection = false
  skip_final_snapshot = true
}
