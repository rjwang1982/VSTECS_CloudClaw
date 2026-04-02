"""Fix missing bindings for employees with agents."""
import boto3

ddb = boto3.resource("dynamodb", region_name="us-east-2")
t = ddb.Table("openclaw-enterprise")

resp = t.query(
    KeyConditionExpression=boto3.dynamodb.conditions.Key("PK").eq("ORG#acme")
    & boto3.dynamodb.conditions.Key("SK").begins_with("EMP#")
)
emps = [i for i in resp["Items"] if i.get("agentId")]

binds = t.query(
    KeyConditionExpression=boto3.dynamodb.conditions.Key("PK").eq("ORG#acme")
    & boto3.dynamodb.conditions.Key("SK").begins_with("BIND#")
)
bound = {b["employeeId"] for b in binds["Items"]}

c = 0
for e in emps:
    if e["id"] not in bound:
        bid = f"bind-auto-{c}"
        ch = (e.get("channels") or ["slack"])[0]
        t.put_item(Item={
            "PK": "ORG#acme", "SK": f"BIND#{bid}",
            "GSI1PK": f"AGENT#{e['agentId']}", "GSI1SK": f"BIND#{bid}",
            "id": bid, "employeeId": e["id"], "employeeName": e.get("name", ""),
            "agentId": e["agentId"], "agentName": e.get("agentId", ""),
            "mode": "1:1", "channel": ch, "status": "active",
        })
        c += 1
        print(f"Created binding for {e['id']}")

print(f"Done! {c} bindings created.")
