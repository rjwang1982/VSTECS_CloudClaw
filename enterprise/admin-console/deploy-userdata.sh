#!/bin/bash
# VSTECS CloudClaw Admin Console — EC2 UserData Bootstrap Script
# Author: RJ.Wang <wangrenjun@gmail.com>
# Date: 2026-04-02
# Version: 2.0.0
#
# This script is embedded in CloudFormation UserData.
# It runs as root on first boot to set up the entire platform.
#
# Required environment variables (injected by CloudFormation !Sub):
#   AWS_REGION, STACK_NAME, DYNAMODB_TABLE, S3_BUCKET,
#   ADMIN_PASSWORD, BEDROCK_MODEL, SEED_DATA, WAIT_HANDLE

set -ex
exec > /var/log/admin-console-setup.log 2>&1

# =============================================================================
# OpenClaw Enterprise Admin Console — User-Data Bootstrap
#
# NOTE: This script is for reference / manual deployment on the EC2 instance.
# deploy.sh does NOT run this automatically — you must execute Steps 4-5
# from the README after deploy.sh completes.
#
# For Ubuntu 24.04 (default AMI in CFN template):
#   - Uses python3 (3.12 pre-installed)
#   - Requires python3.12-venv (not installed by default)
#   - boto3/botocore must be upgraded for bedrock-agentcore API support
#
# For Amazon Linux 2023:
#   - Replace apt-get with yum
#   - python3.12-venv is not needed (venv works out of the box)
# =============================================================================

# Install dependencies (Ubuntu 24.04)
apt-get update -qq
apt-get install -y python3.12-venv
pip3 install --break-system-packages --upgrade boto3 botocore

# Clone repo
cd /home/ubuntu
git clone https://github.com/aws-samples/sample-OpenClaw-on-AWS-with-Bedrock.git app
cd app/enterprise/admin-console

# ---- 4. Build frontend (React 19 + Vite 6) ----
npm install --production=false || signal_failure "npm install failed"
npx vite build || signal_failure "vite build failed"

# Seed data — IMPORTANT: set DYNAMODB_REGION to match where your table lives.
# deploy.sh creates the table in DYNAMODB_REGION from .env (default: us-east-2).
# If you created it in us-east-1 (same region as the stack), change these accordingly.
cd server
DYNAMODB_REGION="${DYNAMODB_REGION:-us-east-1}"
AWS_REGION="$DYNAMODB_REGION" python3 seed_dynamodb.py --region "$DYNAMODB_REGION"
AWS_REGION="$DYNAMODB_REGION" python3 seed_roles.py --region "$DYNAMODB_REGION"
AWS_REGION="$DYNAMODB_REGION" python3 seed_audit_approvals.py --region "$DYNAMODB_REGION"
AWS_REGION="$DYNAMODB_REGION" python3 seed_settings.py --region "$DYNAMODB_REGION"
AWS_REGION="$DYNAMODB_REGION" python3 seed_knowledge.py --region "$DYNAMODB_REGION"
# tenant→position mappings are now in DynamoDB (EMP# records), no SSM seeding needed

# ---- 6. Seed DynamoDB demo data (optional) ----
if [ "$SEED_DATA" = "true" ]; then
  export DYNAMODB_TABLE
  python3 seed_dynamodb.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" || true
  python3 seed_roles.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_skills_final.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_audit_approvals.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" || true
  python3 seed_settings.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" || true
  python3 seed_knowledge.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" || true
  python3 seed_usage.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_workspaces.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_all_workspaces.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_routing_conversations.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_knowledge_docs.py --region "$AWS_REGION" --table "$DYNAMODB_TABLE" 2>/dev/null || true
  python3 seed_ssm_tenants.py --region "$AWS_REGION" --stack "$STACK_NAME" 2>/dev/null || true
fi

# ---- 7. Set ownership ----
chown -R ubuntu:ubuntu /home/ubuntu/app

# ---- 8. Create systemd service ----
tee /etc/systemd/system/openclaw-admin.service > /dev/null <<SVCEOF
[Unit]
Description=VSTECS CloudClaw Admin Console
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/app/enterprise/admin-console/server
EnvironmentFile=-/etc/openclaw/env
Environment=CONSOLE_PORT=8099
ExecStart=/opt/admin-venv/bin/python main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

chown -R ubuntu:ubuntu /home/ubuntu/app
systemctl daemon-reload
systemctl enable openclaw-admin
systemctl start openclaw-admin

# ---- 9. Health check ----
sleep 5
for i in $(seq 1 12); do
  if curl -sf http://localhost:8099/api/v1/settings/services > /dev/null 2>&1; then
    echo "Health check passed on attempt $i"
    signal_success
    exit 0
  fi
  echo "Waiting for service... attempt $i"
  sleep 5
done

signal_failure "Service health check failed after 60s"
