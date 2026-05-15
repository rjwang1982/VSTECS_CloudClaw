"""
Seed DynamoDB with enterprise demo data.
Single-table design: PK/SK pattern from PRD §15.

Usage: python seed_dynamodb.py [--region us-east-1] [--table openclaw]
"""
import argparse
import os
import json
import time
import boto3

ORG = "ORG#acme"

def seed(table_name: str, region: str):
    ddb = boto3.resource("dynamodb", region_name=region)
    table = ddb.Table(table_name)

    items = []

    # --- Organization meta ---
    items.append({"PK": ORG, "SK": "META", "GSI1PK": "TYPE#org", "GSI1SK": ORG,
        "name": "VSTECS Corp", "plan": "enterprise", "createdAt": "2026-01-10T00:00:00Z"})

    # --- Departments ---
    depts = [
        ("dept-eng", "Engineering", None, 22), ("dept-eng-platform", "Platform Team", "dept-eng", 5),
        ("dept-eng-backend", "Backend Team", "dept-eng", 8), ("dept-eng-frontend", "Frontend Team", "dept-eng", 5),
        ("dept-eng-qa", "QA Team", "dept-eng", 4), ("dept-sales", "Sales", None, 12),
        ("dept-sales-ent", "Enterprise Sales", "dept-sales", 5), ("dept-sales-smb", "SMB Sales", "dept-sales", 7),
        ("dept-product", "Product", None, 6), ("dept-finance", "Finance", None, 5),
        ("dept-hr", "HR & Admin", None, 4), ("dept-cs", "Customer Success", None, 6),
        ("dept-legal", "Legal & Compliance", None, 3),
    ]
    for did, name, parent, hc in depts:
        items.append({"PK": ORG, "SK": f"DEPT#{did}", "GSI1PK": "TYPE#dept", "GSI1SK": f"DEPT#{did}",
            "id": did, "name": name, "parentId": parent, "headCount": hc, "createdAt": "2026-01-10T00:00:00Z"})

    # --- Positions ---
    positions = [
        ("pos-sa", "Solutions Architect", "dept-eng", "Engineering", ["jina-reader","deep-research","arch-diagram-gen","cost-calculator"], ["web_search","shell","browser","file","code_execution"], 3),
        ("pos-sde", "Software Engineer", "dept-eng", "Engineering", ["jina-reader","deep-research","github-pr","code-review"], ["web_search","shell","browser","file","file_write","code_execution"], 8),
        ("pos-devops", "DevOps Engineer", "dept-eng-platform", "Platform Team", ["jina-reader","deep-research","github-pr"], ["web_search","shell","browser","file","file_write","code_execution"], 3),
        ("pos-qa", "QA Engineer", "dept-eng-qa", "QA Team", ["jina-reader","deep-research","jira-query"], ["web_search","shell","file","code_execution"], 3),
        ("pos-ae", "Account Executive", "dept-sales", "Sales", ["jina-reader","web-search","crm-query"], ["web_search","file"], 6),
        ("pos-pm", "Product Manager", "dept-product", "Product", ["jina-reader","deep-research","jira-query","transcript"], ["web_search","browser","file"], 4),
        ("pos-fa", "Finance Analyst", "dept-finance", "Finance", ["jina-reader","sap-connector","excel-gen"], ["web_search","file"], 3),
        ("pos-hr", "HR Specialist", "dept-hr", "HR & Admin", ["jina-reader","web-search"], ["web_search","file"], 3),
        ("pos-csm", "Customer Success Manager", "dept-cs", "Customer Success", ["jina-reader","web-search","crm-query","slack-bridge"], ["web_search","file","browser"], 4),
        ("pos-legal", "Legal Counsel", "dept-legal", "Legal & Compliance", ["jina-reader","deep-research"], ["web_search","file"], 2),
        ("pos-exec", "Executive", "dept-eng", "Engineering", ["jina-reader","deep-research","web_search"], ["web_search","shell","browser","file","file_write","code_execution"], 1),
    ]
    for pid, name, did, dname, skills, tools, mc in positions:
        items.append({"PK": ORG, "SK": f"POS#{pid}", "GSI1PK": "TYPE#pos", "GSI1SK": f"POS#{pid}",
            "id": pid, "name": name, "departmentId": did, "departmentName": dname,
            "defaultSkills": skills, "toolAllowlist": tools, "memberCount": mc, "createdAt": "2026-01-20T00:00:00Z"})

    # --- Employees ---
    employees = [
        # Engineering — Solutions Architects
        ("vstecs-admin",   "Kevin Zhao",    "EMP-001", "pos-sa",    "Solutions Architect",         "dept-eng",          "Engineering",       ["discord","slack"],   "agent-sa-admin",     "active"),
        ("vstecs-sa1",     "Andy Liu",      "EMP-002", "pos-sa",    "Solutions Architect",         "dept-eng",          "Engineering",       ["slack","telegram"],  "agent-sa-sa1",       "active"),
        ("vstecs-sa2",     "Brian Feng",    "EMP-003", "pos-sa",    "Solutions Architect",         "dept-eng",          "Engineering",       ["slack"],             "agent-sa-sa2",       "active"),
        # Engineering — Software Engineers
        ("vstecs-RDadmin", "Jason Xu",      "EMP-004", "pos-sde",   "Software Engineer",           "dept-eng-backend",  "Backend Team",      ["slack","discord"],   "agent-sde-RDadmin",  "active"),
        ("vstecs-dev1",    "Tina Huang",    "EMP-005", "pos-sde",   "Software Engineer",           "dept-eng-backend",  "Backend Team",      ["slack"],             "agent-sde-dev1",     "active"),
        ("vstecs-dev2",    "Victor Qian",   "EMP-006", "pos-sde",   "Software Engineer",           "dept-eng-frontend", "Frontend Team",     ["slack"],             "agent-sde-dev2",     "active"),
        # Engineering — DevOps & QA
        ("vstecs-ITadmin", "Leo Zhang",     "EMP-007", "pos-devops","DevOps Engineer",             "dept-eng-platform", "Platform Team",     ["slack","telegram"],  "agent-devops-ITadmin","active"),
        ("vstecs-devops1", "Grace Ding",    "EMP-008", "pos-devops","DevOps Engineer",             "dept-eng-platform", "Platform Team",     ["slack"],             "agent-devops-devops1","active"),
        ("vstecs-qa1",     "Frank Jiang",   "EMP-009", "pos-qa",    "QA Engineer",                 "dept-eng-qa",       "QA Team",           ["slack"],             "agent-qa-qa1",       "active"),
        # Sales
        ("vstecs-sales1",  "Henry Luo",     "EMP-011", "pos-ae",    "Account Executive",           "dept-sales-ent",    "Enterprise Sales",  ["whatsapp","slack"],  "agent-ae-sales1",    "active"),
        ("vstecs-sales2",  "Ivy Sun",       "EMP-012", "pos-ae",    "Account Executive",           "dept-sales-ent",    "Enterprise Sales",  ["whatsapp"],          "agent-ae-sales2",    "active"),
        ("vstecs-sales3",  "Oscar Ye",      "EMP-013", "pos-ae",    "Account Executive",           "dept-sales-smb",    "SMB Sales",         ["slack"],             "agent-ae-sales3",    "active"),
        # Product
        ("vstecs-pm1",     "Diana Wen",     "EMP-015", "pos-pm",    "Product Manager",             "dept-product",      "Product",           ["slack"],             "agent-pm-pm1",       "active"),
        ("vstecs-pm2",     "Nina Gao",      "EMP-014", "pos-pm",    "Product Manager",             "dept-product",      "Product",           ["slack","discord"],   "agent-pm-pm2",       "active"),
        # Finance
        ("vstecs-fin1",    "Stella Zhu",    "EMP-016", "pos-fa",    "Finance Analyst",             "dept-finance",      "Finance",           ["slack","telegram"],  "agent-fa-fin1",      "active"),
        ("vstecs-fin2",    "Ray Cheng",     "EMP-017", "pos-fa",    "Finance Analyst",             "dept-finance",      "Finance",           ["slack"],             "agent-fa-fin2",      "active"),
        # HR, CS, Legal
        ("vstecs-hr1",     "Megan Xie",     "EMP-018", "pos-hr",    "HR Specialist",               "dept-hr",           "HR & Admin",        ["slack"],             "agent-hr-hr1",       "active"),
        ("vstecs-csm1",    "Cathy Bai",     "EMP-019", "pos-csm",   "Customer Success Manager",    "dept-cs",           "Customer Success",  ["slack","whatsapp"],  "agent-csm-csm1",     "active"),
        ("vstecs-legal1",  "Wendy Shen",    "EMP-021", "pos-legal", "Legal Counsel",               "dept-legal",        "Legal & Compliance",["slack"],             "agent-legal-legal1", "active"),
        # Executive
        ("vstecs-exec1",   "Patrick Tan",   "EMP-031", "pos-exec",  "Executive",                   "dept-eng",          "Engineering",       ["discord"],           "agent-exec-exec1",   "active"),
    ]
    for eid, name, eno, pid, pname, did, dname, chs, aid, ast in employees:
        item = {"PK": ORG, "SK": f"EMP#{eid}", "GSI1PK": "TYPE#emp", "GSI1SK": f"EMP#{eid}",
            "id": eid, "name": name, "employeeNo": eno, "positionId": pid, "positionName": pname,
            "departmentId": did, "departmentName": dname, "channels": chs, "agentStatus": ast, "createdAt": "2026-01-20T00:00:00Z"}
        if aid:
            item["agentId"] = aid
        items.append(item)

    # --- Agents ---
    agents = [
        # SA agents
        ("agent-sa-admin",     "SA Agent - Kevin",    "vstecs-admin",   "Kevin Zhao",    "pos-sa",    "Solutions Architect",         "active", None, ["jina-reader","deep-research","arch-diagram-gen","cost-calculator"], ["discord","slack"]),
        ("agent-sa-sa1",       "SA Agent - Andy",     "vstecs-sa1",     "Andy Liu",      "pos-sa",    "Solutions Architect",         "active", 4.6, ["jina-reader","deep-research","arch-diagram-gen","cost-calculator"], ["slack","telegram"]),
        ("agent-sa-sa2",       "SA Agent - Brian",    "vstecs-sa2",     "Brian Feng",    "pos-sa",    "Solutions Architect",         "active", 4.4, ["jina-reader","deep-research","arch-diagram-gen"], ["slack"]),
        # SDE agents
        ("agent-sde-RDadmin",  "SDE Agent - Jason",   "vstecs-RDadmin", "Jason Xu",      "pos-sde",   "Software Engineer",           "active", 4.5, ["jina-reader","deep-research","github-pr","code-review"], ["slack","discord"]),
        ("agent-sde-dev1",     "SDE Agent - Tina",    "vstecs-dev1",    "Tina Huang",    "pos-sde",   "Software Engineer",           "active", 4.2, ["jina-reader","deep-research","github-pr"], ["slack"]),
        # DevOps agents
        ("agent-devops-ITadmin","DevOps Agent - Leo",  "vstecs-ITadmin", "Leo Zhang",     "pos-devops","DevOps Engineer",             "active", 4.7, ["jina-reader","deep-research","github-pr"], ["slack","telegram"]),
        ("agent-devops-devops1","DevOps Agent - Grace","vstecs-devops1", "Grace Ding",    "pos-devops","DevOps Engineer",             "active", 4.1, ["jina-reader","deep-research","github-pr"], ["slack"]),
        # QA
        ("agent-qa-qa1",       "QA Agent - Frank",    "vstecs-qa1",     "Frank Jiang",   "pos-qa",    "QA Engineer",                 "active", 4.3, ["jina-reader","deep-research","jira-query"], ["slack"]),
        # Sales
        ("agent-ae-sales1",    "Sales Agent - Henry", "vstecs-sales1",  "Henry Luo",     "pos-ae",    "Account Executive",           "active", 3.9, ["jina-reader","web-search","crm-query"], ["whatsapp","slack"]),
        ("agent-ae-sales2",    "Sales Agent - Ivy",   "vstecs-sales2",  "Ivy Sun",       "pos-ae",    "Account Executive",           "active", 4.4, ["jina-reader","web-search","crm-query"], ["whatsapp"]),
        # Product
        ("agent-pm-pm1",       "PM Agent - Diana",    "vstecs-pm1",     "Diana Wen",     "pos-pm",    "Product Manager",             "active", 4.2, ["jina-reader","deep-research","jira-query"], ["slack"]),
        ("agent-pm-pm2",       "PM Agent - Nina",     "vstecs-pm2",     "Nina Gao",      "pos-pm",    "Product Manager",             "active", 4.5, ["jina-reader","deep-research","jira-query","transcript"], ["slack","discord"]),
        # Finance
        ("agent-fa-fin1",      "Finance Agent - Stella","vstecs-fin1",  "Stella Zhu",    "pos-fa",    "Finance Analyst",             "active", 4.5, ["jina-reader","sap-connector","excel-gen"], ["slack","telegram"]),
        ("agent-fa-fin2",      "Finance Agent - Ray",  "vstecs-fin2",   "Ray Cheng",     "pos-fa",    "Finance Analyst",             "active", 4.2, ["jina-reader","sap-connector"], ["slack"]),
        # HR, CS, Legal
        ("agent-hr-hr1",       "HR Agent - Megan",    "vstecs-hr1",     "Megan Xie",     "pos-hr",    "HR Specialist",               "active", 4.1, ["jina-reader","web-search"], ["slack"]),
        ("agent-csm-csm1",     "CSM Agent - Cathy",   "vstecs-csm1",   "Cathy Bai",     "pos-csm",   "Customer Success Manager",    "active", 4.6, ["jina-reader","web-search","crm-query","slack-bridge"], ["slack","whatsapp"]),
        ("agent-legal-legal1", "Legal Agent - Wendy",  "vstecs-legal1", "Wendy Shen",    "pos-legal", "Legal Counsel",               "active", 4.8, ["jina-reader","deep-research"], ["slack"]),
        # Executive
        ("agent-exec-exec1",   "Executive Agent - Patrick","vstecs-exec1","Patrick Tan", "pos-exec",  "Executive",                   "active", None, ["jina-reader","deep-research","web_search"], ["discord"]),
        # Previously idle employees — now auto-provisioned
        ("agent-sde-dev2",     "SDE Agent - Victor",  "vstecs-dev2",    "Victor Qian",   "pos-sde",   "Software Engineer",           "active", None, ["jina-reader","deep-research","github-pr"], ["slack"]),
        ("agent-ae-sales3",    "Sales Agent - Oscar", "vstecs-sales3",  "Oscar Ye",      "pos-ae",    "Account Executive",           "active", None, ["jina-reader","web-search","crm-query"], ["slack"]),
    ]
    for aid, name, eid, ename, pid, pname, status, qs, skills, chs in agents:
        item = {"PK": ORG, "SK": f"AGENT#{aid}", "GSI1PK": "TYPE#agent", "GSI1SK": f"AGENT#{aid}",
            "id": aid, "name": name, "employeeName": ename, "positionId": pid, "positionName": pname,
            "status": status, "qualityScore": str(qs), "skills": skills, "channels": chs,
            "soulVersions": {"global": 3, "position": 1, "personal": 1 if eid else 0},
            "createdAt": "2026-01-25T00:00:00Z", "updatedAt": "2026-03-20T00:00:00Z"}
        if eid:
            item["employeeId"] = eid
        items.append(item)

    # --- Bindings ---
    # Every employee automatically gets a 1:1 Serverless agent.
    # Admin can upgrade to Always-on (Fargate) for scheduled tasks and instant response.
    agent_name_map = {aid: aname for aid, aname, *_ in agents}
    bindings = []
    for eid, ename, _eno, _pid, _pname, _did, _dname, chs, aid, _ast in employees:
        if not aid:
            continue
        primary_ch = chs[0] if chs else "serverless"
        bid = f"bind-{eid.replace('vstecs-', '')}-auto"
        aname = agent_name_map.get(aid, aid)
        bindings.append((bid, eid, ename, aid, aname, "1:1", primary_ch, "bound"))
    for bid, eid, ename, aid, aname, mode, ch, st in bindings:
        items.append({"PK": ORG, "SK": f"BIND#{bid}", "GSI1PK": f"AGENT#{aid}", "GSI1SK": f"BIND#{bid}",
            "id": bid, "employeeId": eid, "employeeName": ename, "agentId": aid, "agentName": aname,
            "mode": mode, "channel": ch, "status": st, "createdAt": "2026-02-01T00:00:00Z"})

    # --- Write all items ---
    print(f"Writing {len(items)} items to {table_name}...")
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=item)
    print(f"Done! {len(items)} items seeded.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", default=os.environ.get("DYNAMODB_TABLE", "openclaw"))
    parser.add_argument("--region", default=os.environ.get("AWS_REGION", "us-east-1"))
    args = parser.parse_args()
    seed(args.table, args.region)
