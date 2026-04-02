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

export DEBIAN_FRONTEND=noninteractive

# ---- Signal helpers (CloudFormation WaitCondition) ----
signal_success() {
  curl -X PUT -H "Content-Type:" \
    --data-binary '{"Status":"SUCCESS","Reason":"Setup complete","UniqueId":"setup","Data":"OK"}' \
    "$WAIT_HANDLE"
}
signal_failure() {
  curl -X PUT -H "Content-Type:" \
    --data-binary "{\"Status\":\"FAILURE\",\"Reason\":\"$1\",\"UniqueId\":\"setup\",\"Data\":\"FAILED\"}" \
    "$WAIT_HANDLE"
  exit 1
}

# ---- 1. System packages ----
apt-get update -y
apt-get install -y python3-pip python3-venv git unzip curl jq \
  || signal_failure "apt-get failed"

# ---- 2. Node.js 22 (LTS) ----
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs || signal_failure "Node.js install failed"

# ---- 3. Clone repository ----
cd /home/ubuntu
git clone --depth 1 \
  https://github.com/jiade-dev/sample-openclaw-on-AWS-with-Bedrock.git app \
  || signal_failure "git clone failed"
cd app/enterprise/admin-console

# ---- 4. Build frontend (React 19 + Vite 6) ----
npm install --production=false || signal_failure "npm install failed"
npx vite build || signal_failure "vite build failed"

# ---- 5. Install Python dependencies ----
cd server
pip3 install --break-system-packages --ignore-installed -r requirements.txt \
  || signal_failure "pip install failed"

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
Environment=AWS_REGION=${AWS_REGION}
Environment=DYNAMODB_TABLE=${DYNAMODB_TABLE}
Environment=S3_BUCKET=${S3_BUCKET}
Environment=CONSOLE_PORT=8099
Environment=ADMIN_PASSWORD=${ADMIN_PASSWORD}
Environment=BEDROCK_MODEL=${BEDROCK_MODEL}
ExecStart=/usr/bin/python3 main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVCEOF

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
