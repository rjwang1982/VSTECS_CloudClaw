"""Seed DynamoDB with audit entries and approvals."""
import argparse
import os
import boto3

ORG = "ORG#acme"

def seed(table_name: str, region: str):
    ddb = boto3.resource("dynamodb", region_name=region)
    table = ddb.Table(table_name)
    items = []

    # Audit entries
    audits = [
        {"id": "aud-001", "timestamp": "2026-03-20T10:32:15Z", "eventType": "agent_invocation", "actorName": "Kevin Zhao", "targetType": "agent", "detail": "Architecture review request via Discord", "status": "success"},
        {"id": "aud-002", "timestamp": "2026-03-20T10:28:03Z", "eventType": "tool_execution", "actorName": "Jason Xu", "targetType": "agent", "detail": "shell: git status (Backend Team repo)", "status": "success"},
        {"id": "aud-003", "timestamp": "2026-03-20T10:25:00Z", "eventType": "permission_denied", "actorName": "Victor Qian", "targetType": "system", "detail": "Attempted shell access on idle session — blocked by Plan A", "status": "blocked"},
        {"id": "aud-004", "timestamp": "2026-03-20T10:22:00Z", "eventType": "tool_execution", "actorName": "Leo Zhang", "targetType": "agent", "detail": "shell: terraform plan -out=vpc-peering.tfplan", "status": "success"},
        {"id": "aud-005", "timestamp": "2026-03-20T10:20:00Z", "eventType": "config_change", "actorName": "Kevin Zhao", "targetType": "agent", "detail": "Updated personal SOUL layer v1 -> v2", "status": "info"},
        {"id": "aud-006", "timestamp": "2026-03-20T10:18:00Z", "eventType": "agent_invocation", "actorName": "Diana Wen", "targetType": "agent", "detail": "User interview synthesis via Slack", "status": "success"},
        {"id": "aud-007", "timestamp": "2026-03-20T10:15:00Z", "eventType": "session_start", "actorName": "Henry Luo", "targetType": "agent", "detail": "New session via WhatsApp", "status": "success"},
        {"id": "aud-008", "timestamp": "2026-03-20T10:12:00Z", "eventType": "permission_denied", "actorName": "Henry Luo", "targetType": "system", "detail": "Attempted code_execution — AE role denied", "status": "blocked"},
        {"id": "aud-009", "timestamp": "2026-03-20T10:10:00Z", "eventType": "approval_decision", "actorName": "Megan Xie", "targetType": "skill", "detail": "SAP Connector skill access approved for Finance team", "status": "info"},
        {"id": "aud-010", "timestamp": "2026-03-20T10:08:00Z", "eventType": "tool_execution", "actorName": "Victor Qian", "targetType": "agent", "detail": "code_execution: npm run test (Frontend Team)", "status": "success"},
        {"id": "aud-011", "timestamp": "2026-03-20T10:05:00Z", "eventType": "config_change", "actorName": "Wendy Shen", "targetType": "agent", "detail": "Added GDPR compliance knowledge base to Legal Agent", "status": "info"},
        {"id": "aud-012", "timestamp": "2026-03-20T10:02:00Z", "eventType": "agent_invocation", "actorName": "Stella Zhu", "targetType": "agent", "detail": "Q2 budget variance report via Slack", "status": "success"},
        {"id": "aud-013", "timestamp": "2026-03-20T10:00:00Z", "eventType": "session_start", "actorName": "Cathy Bai", "targetType": "agent", "detail": "QBR preparation session via Slack", "status": "success"},
        {"id": "aud-014", "timestamp": "2026-03-20T09:55:00Z", "eventType": "tool_execution", "actorName": "Frank Jiang", "targetType": "agent", "detail": "jira-query: Sprint 12 open bugs (QA Team)", "status": "success"},
        {"id": "aud-015", "timestamp": "2026-03-20T09:50:00Z", "eventType": "permission_denied", "actorName": "Oscar Ye", "targetType": "system", "detail": "Attempted file_write — AE role denied", "status": "blocked"},
        {"id": "aud-016", "timestamp": "2026-03-20T09:45:00Z", "eventType": "agent_invocation", "actorName": "Ivy Sun", "targetType": "agent", "detail": "APAC deal pipeline review via WhatsApp", "status": "success"},
        {"id": "aud-017", "timestamp": "2026-03-20T09:40:00Z", "eventType": "session_end", "actorName": "Ray Cheng", "targetType": "agent", "detail": "Budget forecast session ended (12 turns, 18min)", "status": "success"},
        {"id": "aud-018", "timestamp": "2026-03-20T09:35:00Z", "eventType": "approval_decision", "actorName": "Leo Zhang", "targetType": "binding", "detail": "Approved onboarding agent access for intern", "status": "info"},
        {"id": "aud-019", "timestamp": "2026-03-20T09:30:00Z", "eventType": "tool_execution", "actorName": "Grace Ding", "targetType": "agent", "detail": "shell: kubectl get pods -n production", "status": "success"},
        {"id": "aud-020", "timestamp": "2026-03-20T09:25:00Z", "eventType": "config_change", "actorName": "IT Admin", "targetType": "system", "detail": "Updated global TOOLS.md — added new blocked patterns", "status": "info"},
    ]
    for a in audits:
        items.append({"PK": ORG, "SK": f"AUDIT#{a['id']}", "GSI1PK": "TYPE#audit", "GSI1SK": f"AUDIT#{a['id']}", **a})

    # Approvals
    approvals = [
        {"id": "APR-001", "tenant": "Victor Qian", "tenantId": "vstecs-dev2", "tool": "shell", "reason": "Need shell access to run unit tests for frontend project", "risk": "high", "timestamp": "2026-03-20T09:23:00Z", "status": "pending"},
        {"id": "APR-002", "tenant": "Stella Zhu", "tenantId": "vstecs-fin1", "tool": "data_path:/finance/reports/q2", "reason": "Quarterly report generation requires access to Q2 financial data", "risk": "medium", "timestamp": "2026-03-20T10:05:00Z", "status": "pending"},
        {"id": "APR-003", "tenant": "Oscar Ye", "tenantId": "vstecs-sales3", "tool": "file_write", "reason": "Need to export sales training materials to local drive", "risk": "medium", "timestamp": "2026-03-20T10:30:00Z", "status": "pending"},
        {"id": "APR-098", "tenant": "Jason Xu", "tenantId": "vstecs-RDadmin", "tool": "code_execution", "reason": "CI pipeline debugging requires code execution in sandbox", "risk": "high", "timestamp": "2026-03-19T14:12:00Z", "status": "approved", "reviewer": "Kevin Zhao", "resolvedAt": "2026-03-19T14:18:00Z"},
        {"id": "APR-097", "tenant": "Henry Luo", "tenantId": "vstecs-sales1", "tool": "file_write", "reason": "Export CRM contacts to CSV", "risk": "medium", "timestamp": "2026-03-19T11:30:00Z", "status": "denied", "reviewer": "Kevin Zhao", "resolvedAt": "2026-03-19T11:45:00Z"},
        {"id": "APR-096", "tenant": "Ivy Sun", "tenantId": "vstecs-sales2", "tool": "browser", "reason": "Research internal wiki for documentation task", "risk": "low", "timestamp": "2026-03-18T16:00:00Z", "status": "approved", "reviewer": "Auto-approved (low risk)", "resolvedAt": "2026-03-18T16:00:00Z"},
    ]
    for a in approvals:
        items.append({"PK": ORG, "SK": f"APPROVAL#{a['id']}", "GSI1PK": "TYPE#approval", "GSI1SK": f"APPROVAL#{a['id']}", **a})

    print(f"Writing {len(items)} items...")
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)
    print(f"Done! {len(items)} audit + approval items seeded.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", default=os.environ.get("DYNAMODB_TABLE", "openclaw"))
    parser.add_argument("--region", default=os.environ.get("AWS_REGION", "us-east-1"))
    args = parser.parse_args()
    seed(args.table, args.region)
