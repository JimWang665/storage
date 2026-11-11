resource "aws_cloudwatch_log_group" "backend" {
  name              = "/${var.project}/backend"
  retention_in_days = 14
}

# Turn log lines containing the word ERROR into a metric, so an alarm can watch it.
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "${var.project}-backend-errors"
  log_group_name = aws_cloudwatch_log_group.backend.name
  pattern        = "ERROR"

  metric_transformation {
    name          = "BackendErrorCount"
    namespace     = var.project
    value         = "1"
    default_value = "0"
  }
}

resource "aws_sns_topic" "alerts" {
  count = var.alert_email == "" ? 0 : 1
  name  = "${var.project}-alerts"
}

# Note: the recipient must click the confirmation link AWS emails before notifications are delivered.
resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email == "" ? 0 : 1
  topic_arn = aws_sns_topic.alerts[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

locals {
  alarm_actions = var.alert_email == "" ? [] : [aws_sns_topic.alerts[0].arn]
}

resource "aws_cloudwatch_metric_alarm" "backend_errors" {
  alarm_name          = "${var.project}-backend-errors"
  alarm_description   = "5 or more ERROR log lines from the backend within 5 minutes"
  namespace           = var.project
  metric_name         = "BackendErrorCount"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 5
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions

  depends_on = [aws_cloudwatch_log_metric_filter.errors]
}

resource "aws_cloudwatch_metric_alarm" "instance_status" {
  alarm_name          = "${var.project}-instance-status-check-failed"
  alarm_description   = "The backend server failed its EC2 status checks for 2 minutes"
  namespace           = "AWS/EC2"
  metric_name         = "StatusCheckFailed"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions

  dimensions = {
    InstanceId = aws_instance.app.id
  }
}

resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "${var.project}-db-cpu-high"
  alarm_description   = "Database CPU above 80% for 10 minutes"
  namespace           = "AWS/RDS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 2
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = local.alarm_actions

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.identifier
  }
}
