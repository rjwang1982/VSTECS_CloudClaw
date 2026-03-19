# OpenClaw Enterprise Admin Console — PRD

日期: 2026-03-20
版本: v1.0
状态: 设计稿

---

## 1. 产品定位

### 一句话

企业 IT 管理员通过 Admin Console 管理所有员工的 AI 助手——
谁能用什么工具、谁能访问什么 skill、花了多少钱、有没有违规。

### 目标用户

| 角色 | 核心诉求 | 使用频率 |
|------|---------|---------|
| IT Admin | 管理租户权限、部署 skills、处理审批 | 每天 |
| CISO / 安全负责人 | 审计日志、安全态势、合规报告 | 每周 |
| 财务 / 管理层 | 成本分析、ROI 对比、预算控制 | 每月 |
| 平台运维 | 服务状态、microVM 健康、故障排查 | 按需 |

### 产品原则

1. AWS 原生体验 — 用 Cloudscape Design System，IT 管理员感觉像 AWS Console 的延伸
2. 数据驱动 — 每个页面都有实时数据，不是静态配置页
3. 零学习成本 — 首次使用有 Onboarding Wizard 引导
4. 安全第一 — 所有操作有审计日志，敏感操作需确认

---

## 2. 技术架构

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Admin Console)                                │
│  React 19 + TypeScript + Vite + Cloudscape              │
│  部署: S3 + CloudFront (静态站) 或 EC2 本地 serve       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / SSM Port Forward
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend API (EC2 Gateway, port 8099)                   │
│  Python FastAPI                                         │
│                                                         │
│  /api/v1/dashboard      → SSM + CloudWatch 聚合         │
│  /api/v1/tenants        → SSM Parameter Store CRUD      │
│  /api/v1/skills         → S3 list + SSM skill-keys      │
│  /api/v1/approvals      → SSM / DynamoDB                │
│  /api/v1/audit          → CloudWatch filter-log-events  │
│  /api/v1/usage          → CloudWatch metrics / Bedrock  │
│  /api/v1/services       → systemctl status + ss         │
│  /api/v1/playground     → Tenant Router /route 转发     │
│  /api/v1/onboarding     → CloudFormation + SSM          │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  AWS Services                                           │
│  SSM · S3 · CloudWatch · Bedrock · AgentCore · ECR      │
└─────────────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 | 理由 |
|---|------|------|
| 前端框架 | React 19 + TypeScript | 生态最大，Cloudscape 原生支持 |
| 构建工具 | Vite 6 | 快速 HMR，零配置 |
| UI 组件库 | Cloudscape Design System | AWS 官方，企业级，Table/Form/Cards/Wizard 齐全 |
| 状态管理 | React Query (TanStack Query) | 服务端状态缓存，自动刷新 |
| 路由 | React Router v7 | 标准选择 |
| 图表 | Recharts | 轻量，React 原生 |
| 主题 | Cloudscape dark mode + 自定义 CSS 变量 | 现代感 |
| 后端 | Python FastAPI | 已有 boto3 生态，EC2 上零依赖 |
| 认证 | Gateway Token (SSM) | 复用现有 OpenClaw Gateway token |

---

## 3. 信息架构 (导航结构)

```
🦞 OpenClaw Enterprise
│
├── 📊 Dashboard                    ← 首页，总览所有关键指标
├── 👥 Tenants                      ← 租户管理 (CRUD + 权限编辑)
│   ├── Tenant List
│   └── Tenant Detail / Edit
├── 🧩 Skills                       ← 三层 Skill 目录
│   ├── Skill Catalog (Layer 1/2/3)
│   ├── Skill Detail / Config
│   └── API Key Management
├── 🔐 Approvals                    ← 审批队列
│   ├── Pending
│   └── History
├── 📋 Audit Log                    ← 审计日志 (实时流)
├── 📈 Usage & Cost                 ← Token 计量 + 成本分析
│   ├── Daily Trend
│   ├── Per-Tenant Breakdown
│   └── Cost Calculator
├── 🛡️ Security                     ← 安全态势
│   ├── Plan A/E Stats
│   ├── Injection Attempts
│   └── Compliance Status
├── ⚡ Playground                    ← Agent 测试沙箱
├── 🔗 Topology                     ← 组织架构树
├── ⚙️ Settings                     ← 平台配置
│   ├── Model Selection
│   ├── Gateway Config
│   └── Service Status
└── 🚀 Onboarding                   ← 首次部署引导 (Wizard)
```

---

## 4. 页面设计

### 4.1 Dashboard (首页)

**目标**: 30 秒内了解平台全貌。

**布局**:
```
┌─────────────────────────────────────────────────────────┐
│  Header: "OpenClaw Enterprise · All systems operational" │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────┤
│ Tenants │ Active  │Requests │ Tokens  │  Cost   │Alerts│
│   12    │   8     │  1,247  │  156k   │ $0.42   │  2   │
├─────────┴─────────┴─────────┴─────────┴─────────┴──────┤
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │ Token Usage (7 day) │  │ Top Tenants by Usage     │  │
│  │ [Area Chart]        │  │ 1. Alex (Eng)   45k      │  │
│  │                     │  │ 2. Jordan (IT)  15k      │  │
│  │                     │  │ 3. Carol (Fin)   4k      │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │ Recent Activity     │  │ Pending Approvals        │  │
│  │ [Audit Log Stream]  │  │ Sarah → shell (HIGH)     │  │
│  │                     │  │ Carol → /data/* (MED)    │  │
│  └─────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**数据源**:
- Stat cards: SSM tenant count + CloudWatch metrics
- Token chart: CloudWatch custom metric `BedrockTokens` by day
- Top tenants: CloudWatch metric by tenant_id dimension
- Recent activity: CloudWatch filter-log-events (last 10)
- Pending approvals: SSM `/openclaw/{stack}/approvals/*`

**刷新策略**: 每 30 秒自动刷新 stat cards，图表每 5 分钟

---

### 4.2 Tenants (租户管理)

**Tenant List 页面**:

Cloudscape Table 组件，支持搜索、排序、分页。

| 列 | 数据源 |
|---|--------|
| Name | SSM tenant profile `.name` |
| Role | SSM tenant profile `.role` |
| Department | SSM tenant profile `.dept` |
| Channel | SSM tenant profile `.channel` |
| Tools (badges) | SSM tenant profile `.tools[]` |
| Skills Available | skill_loader 计算 |
| Status | 最近活跃时间推算 |
| Last Active | CloudWatch 最近日志时间 |
| Tokens Today | CloudWatch metric |

**Tenant Detail / Edit 页面**:

Cloudscape Form + Container 布局。

```
┌─────────────────────────────────────────────────────────┐
│  Sarah Chen · Intern · Engineering · WhatsApp            │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Permission Profile                                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │ ✅ web_search  ☐ shell  ☐ browser  ☐ file      │    │
│  │ ☐ file_write  ☐ code_execution                  │    │
│  │ 🚫 install_skill  🚫 load_extension  🚫 eval   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  SOUL Template: [intern ▼]  [Edit SOUL.md]              │
│                                                         │
│  Roles: [intern] [+ Add Role]                           │
│                                                         │
│  Skills Available (filtered by roles):                  │
│  ✅ web-search  ✅ jina-reader  ✅ weather-lookup       │
│  ❌ jira-query (blocked: intern)                        │
│  ❌ sap-connector (not in allowedRoles)                 │
│                                                         │
│  Recent Activity (last 10 events from CloudWatch)       │
│  [Table: timestamp, event, tool, status, latency]       │
│                                                         │
│  [Save Changes]  [Reset to Template]                    │
└─────────────────────────────────────────────────────────┘
```

**API**:
- `GET /api/v1/tenants` → list all tenants from SSM
- `GET /api/v1/tenants/{id}` → tenant detail + recent activity
- `PUT /api/v1/tenants/{id}` → update tools, roles, soul template
- `POST /api/v1/tenants` → create new tenant (onboarding)
- `DELETE /api/v1/tenants/{id}` → deactivate tenant

---

### 4.3 Skills (Skill 目录)

**Skill Catalog 页面**:

Cloudscape Cards 布局，按 Layer 分组，支持搜索和过滤。

```
┌─────────────────────────────────────────────────────────┐
│  Skills Catalog                                         │
│  [Filter: All ▼] [Search: ________]                     │
├─────────┬─────────┬─────────────────────────────────────┤
│ Layer 1 │ Layer 2 │ Layer 3                             │
│ Docker  │ S3 Load │ Pre-built                           │
│  3      │  3      │  2                                  │
├─────────┴─────────┴─────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ 📖 Jina      │ │ 🎫 Jira     │ │ 💬 Slack     │    │
│  │ Reader       │ │ Query        │ │ Bridge       │    │
│  │ Layer 1      │ │ Layer 2      │ │ Layer 3      │    │
│  │ All users    │ │ Engineering  │ │ All users    │    │
│  │ ✅ Installed │ │ 🔑 2 keys   │ │ ✅ Installed │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  [+ Add Skill]                                          │
└─────────────────────────────────────────────────────────┘
```

**Skill Detail 页面**:

```
┌─────────────────────────────────────────────────────────┐
│  🎫 Jira Query · Layer 2 · S3 Hot-Load                  │
├─────────────────────────────────────────────────────────┤
│  Description: Query Jira issues by ID or search          │
│  Author: IT Team · Version: 1.0.0                        │
│                                                         │
│  Permissions:                                           │
│  Allowed Roles: [engineering] [product] [management]    │
│  Blocked Roles: [intern]                                │
│  [Edit Permissions]                                     │
│                                                         │
│  API Keys (SSM SecureString):                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │ JIRA_API_TOKEN    ●●●●●●●●●●  [Rotate] [Revoke]│   │
│  │ JIRA_BASE_URL     https://acme.atlassian.net     │   │
│  └──────────────────────────────────────────────────┘   │
│  [+ Add Key]                                            │
│                                                         │
│  Authorized Tenants: 3 / 12                             │
│  [View Tenant List]                                     │
│                                                         │
│  [Uninstall]  [Update]                                  │
└─────────────────────────────────────────────────────────┘
```

**API**:
- `GET /api/v1/skills` → list all skills (S3 + SSM catalog)
- `GET /api/v1/skills/{id}` → skill detail + manifest + keys
- `POST /api/v1/skills` → install new skill (upload to S3 or trigger build)
- `PUT /api/v1/skills/{id}` → update permissions, keys
- `DELETE /api/v1/skills/{id}` → uninstall
- `GET /api/v1/skills/{id}/keys` → list API keys (masked)
- `PUT /api/v1/skills/{id}/keys/{key}` → rotate key
- `DELETE /api/v1/skills/{id}/keys/{key}` → revoke key

---

### 4.4 Approvals (审批队列)

**布局**: Cloudscape Split Panel — 左侧列表，右侧详情。

**Pending 卡片**:
```
┌─────────────────────────────────────────────────────────┐
│  🔐 Sarah Chen requests: shell                          │
│  Risk: 🔴 HIGH · Type: tool · 8 min ago                │
│                                                         │
│  Reason: "Need to check server logs for P-1234"         │
│                                                         │
│  Auto-reject in: 22 min                                 │
│                                                         │
│  [✅ Approve (2h)] [✅ Approve (Permanent)] [❌ Reject] │
└─────────────────────────────────────────────────────────┘
```

**API**:
- `GET /api/v1/approvals?status=pending` → pending list
- `GET /api/v1/approvals?status=resolved` → history
- `POST /api/v1/approvals/{id}/approve` → approve (body: duration)
- `POST /api/v1/approvals/{id}/reject` → reject (body: reason)

---

### 4.5 Audit Log (审计日志)

**布局**: Cloudscape Table，实时流模式。

**列**: Timestamp, Event Type, Tenant, Tool/Resource, Status, Latency, Details

**过滤器**: Event Type (invocation/denied/approval), Tenant, Date Range

**数据源**: `CloudWatch filter-log-events` with structured JSON filter

**API**:
- `GET /api/v1/audit?tenant={id}&event={type}&from={ts}&to={ts}&limit=50`

---

### 4.6 Usage & Cost (Token 计量)

**布局**:

```
┌─────────────────────────────────────────────────────────┐
│  Usage & Cost                                           │
├─────────┬─────────┬─────────┬───────────────────────────┤
│ Input   │ Output  │ Today   │ ChatGPT Plus Equivalent   │
│ 78.5k   │ 17.9k   │ $0.07   │ $160/mo (8 users × $20)  │
├─────────┴─────────┴─────────┴───────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Daily Token Usage (30 days)                     │    │
│  │ [Stacked Area: input + output]                  │    │
│  │ [Overlay: cost line]                            │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────┐ ┌────────────────────────┐    │
│  │ By Tenant            │ │ Cost Calculator        │    │
│  │ [Bar chart + table]  │ │ Users: [50]            │    │
│  │                      │ │ Msgs/day: [100]        │    │
│  │                      │ │ Model: [Nova 2 Lite ▼] │    │
│  │                      │ │ ─────────────────────  │    │
│  │                      │ │ Monthly: $45           │    │
│  │                      │ │ vs ChatGPT: $1,000     │    │
│  │                      │ │ Savings: 95%           │    │
│  └──────────────────────┘ └────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**API**:
- `GET /api/v1/usage/daily?days=30` → daily token + cost
- `GET /api/v1/usage/tenants` → per-tenant breakdown
- `GET /api/v1/usage/calculate?users=50&msgs=100&model=nova-lite` → cost projection

---

### 4.7 Security Center (安全态势)

**目标**: 给 CISO 一个安全总览页。

```
┌─────────────────────────────────────────────────────────┐
│  Security Center                                        │
├─────────┬─────────┬─────────┬───────────────────────────┤
│ Plan A  │ Plan E  │Injection│ Compliance                │
│ Blocks  │ Catches │Attempts │ Status                    │
│  47     │   3     │   12    │ ✅ SOC2 Ready             │
├─────────┴─────────┴─────────┴───────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Security Events (30 days)                       │    │
│  │ [Stacked bar: Plan A blocks + Plan E catches    │    │
│  │  + injection attempts]                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌──────────────────────┐ ┌────────────────────────┐    │
│  │ Top Blocked Tools    │ │ Always Blocked          │    │
│  │ 1. shell (23)        │ │ 🚫 install_skill       │    │
│  │ 2. code_execution(12)│ │ 🚫 load_extension      │    │
│  │ 3. file_write (8)    │ │ 🚫 eval                │    │
│  │ 4. browser (4)       │ │ Supply-chain protection │    │
│  └──────────────────────┘ └────────────────────────┘    │
│                                                         │
│  Isolation Model:                                       │
│  ✅ Firecracker microVM per tenant                      │
│  ✅ SSM encrypted permission profiles                   │
│  ✅ CloudTrail audit on all Bedrock calls               │
│  ✅ S3 workspace isolation per tenant                   │
└─────────────────────────────────────────────────────────┘
```

**API**:
- `GET /api/v1/security/summary` → aggregated stats
- `GET /api/v1/security/events?days=30` → security event trend

---

### 4.8 Playground (Agent 测试沙箱)

**目标**: 管理员以任意租户身份测试对话，实时看到权限执行过程。

**布局**: 左右分栏 — 左侧聊天，右侧 Pipeline 详情。

```
┌──────────────────────────┬──────────────────────────────┐
│  Chat                    │  Pipeline Inspector          │
│                          │                              │
│  Tenant: [Sarah ▼]      │  ① Tenant ID                 │
│                          │  wa__intern_sarah__abc123    │
│  Sarah: "Run ls -la"    │                              │
│                          │  ② Permission Profile        │
│  🦞: "I don't have      │  tools: [web_search]         │
│  permission to execute   │  role: intern                │
│  shell commands."        │                              │
│                          │  ③ Plan A (System Prompt)    │
│  Sarah: "What's the     │  "Allowed: web_search.       │
│  weather in Tokyo?"     │   Blocked: shell, browser..."│
│                          │                              │
│  🦞: "Tokyo is 18°C,   │  ④ Plan E (Audit)            │
│  partly cloudy."        │  Status: PASS ✅             │
│                          │  Violations: none            │
│                          │                              │
│                          │  ⑤ Skills Available          │
│                          │  ✅ weather-lookup           │
│                          │  ❌ jira-query (blocked)     │
│                          │                              │
│                          │  ⑥ Tokens Used               │
│  [________________] Send │  Input: 245 · Output: 89    │
└──────────────────────────┴──────────────────────────────┘
```

**API**:
- `POST /api/v1/playground/send` → body: {tenant_id, message}
  - 转发到 Tenant Router /route
  - 返回: response + pipeline details (profile, plan_a, plan_e, skills, tokens)

---

### 4.9 Topology (组织架构)

**布局**: Cloudscape 树形图 + Canvas 可视化。

Org → Department → Team → Individual，每个节点显示：
- 名称、角色、渠道
- 权限摘要（tools 数量）
- 活跃状态（绿/灰点）

点击节点 → 跳转到 Tenant Detail 页面。

**API**:
- `GET /api/v1/topology` → 组织架构树 (从 SSM tenant profiles 聚合)

---

### 4.10 Settings (平台配置)

**子页面**:

Model Selection:
- 当前模型: Nova 2 Lite
- 可选模型列表 (从 Bedrock 查询)
- 切换模型 → 更新 SSM → 下次 microVM 生效

Gateway Config:
- Gateway Token (masked, 可 rotate)
- Proxy 配置 (fast-path 开关, warming timeout)
- IM 渠道状态 (WhatsApp/Telegram/Discord/Slack)

Service Status:
- openclaw-gateway: active/inactive + uptime
- openclaw-proxy: active/inactive + fast-path enabled
- openclaw-router: active/inactive + runtime_id
- AgentCore Runtime: READY/UPDATING + microVM count

**API**:
- `GET /api/v1/settings/model` → current model + available models
- `PUT /api/v1/settings/model` → switch model
- `GET /api/v1/settings/services` → systemctl status for all 3 services
- `GET /api/v1/settings/gateway` → gateway config

---

### 4.11 Onboarding Wizard (首次部署引导)

**触发条件**: 首次访问 Admin Console 且无租户数据时自动显示。

**步骤** (Cloudscape Wizard 组件):

```
Step 1: Welcome
  "Welcome to OpenClaw Enterprise. Let's set up your AI platform."

Step 2: Choose Model
  [Nova 2 Lite ▼] — $0.30/$2.50 per 1M tokens (recommended)
  [Claude Sonnet 4.5 ▼] — $3/$15, most capable
  ...

Step 3: Connect Channel
  "How will your employees talk to their AI assistants?"
  [WhatsApp] [Telegram] [Discord] [Slack] [Web UI only]

Step 4: Create First Tenant
  Name: [________]
  Role: [intern ▼ / engineer / admin]
  Channel: [auto-detected]
  → Creates SSM profile + SOUL.md from template

Step 5: Send Test Message
  "Send a test message to verify everything works."
  [Send "Hello" as {tenant_name}]
  → Shows response + pipeline details

Step 6: Done!
  "Your platform is ready. Next steps:"
  → Add more tenants
  → Install skills
  → Configure permissions
```

**API**:
- `POST /api/v1/onboarding/model` → set model
- `POST /api/v1/onboarding/channel` → configure channel
- `POST /api/v1/onboarding/tenant` → create first tenant
- `POST /api/v1/onboarding/test` → send test message

---

## 5. API 契约总览

### 认证

所有 API 请求需要 `Authorization: Bearer {gateway_token}` header。
Token 从 SSM `/openclaw/{stack}/gateway-token` 获取。

### 基础路径

`http://localhost:8099/api/v1/`（通过 SSM port forward 访问）

### 端点清单

| Method | Path | 描述 |
|--------|------|------|
| GET | /dashboard | 总览统计 |
| GET | /tenants | 租户列表 |
| GET | /tenants/{id} | 租户详情 |
| POST | /tenants | 创建租户 |
| PUT | /tenants/{id} | 更新租户 |
| DELETE | /tenants/{id} | 停用租户 |
| GET | /skills | Skill 目录 |
| GET | /skills/{id} | Skill 详情 |
| POST | /skills | 安装 Skill |
| PUT | /skills/{id} | 更新 Skill 配置 |
| DELETE | /skills/{id} | 卸载 Skill |
| GET | /skills/{id}/keys | Skill API Keys |
| PUT | /skills/{id}/keys/{key} | 轮换 Key |
| DELETE | /skills/{id}/keys/{key} | 撤销 Key |
| GET | /approvals | 审批列表 |
| POST | /approvals/{id}/approve | 批准 |
| POST | /approvals/{id}/reject | 拒绝 |
| GET | /audit | 审计日志 |
| GET | /usage/daily | 每日用量 |
| GET | /usage/tenants | 按租户用量 |
| GET | /usage/calculate | 成本计算器 |
| GET | /security/summary | 安全总览 |
| GET | /security/events | 安全事件趋势 |
| POST | /playground/send | 测试消息 |
| GET | /topology | 组织架构 |
| GET | /settings/model | 模型配置 |
| PUT | /settings/model | 切换模型 |
| GET | /settings/services | 服务状态 |
| GET | /settings/gateway | 网关配置 |
| POST | /onboarding/* | 引导流程 |

---

## 6. 项目结构

```
admin-console/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx                    # 入口
│   ├── App.tsx                     # 路由 + 布局
│   ├── api/                        # API 客户端
│   │   ├── client.ts               # axios/fetch 封装 + auth
│   │   ├── tenants.ts              # tenant CRUD
│   │   ├── skills.ts               # skill CRUD
│   │   ├── approvals.ts            # approval actions
│   │   ├── audit.ts                # audit log queries
│   │   ├── usage.ts                # usage + cost
│   │   ├── security.ts             # security stats
│   │   └── settings.ts             # platform config
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Tenants/
│   │   │   ├── TenantList.tsx
│   │   │   └── TenantDetail.tsx
│   │   ├── Skills/
│   │   │   ├── SkillCatalog.tsx
│   │   │   └── SkillDetail.tsx
│   │   ├── Approvals.tsx
│   │   ├── AuditLog.tsx
│   │   ├── Usage.tsx
│   │   ├── Security.tsx
│   │   ├── Playground.tsx
│   │   ├── Topology.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   ├── components/
│   │   ├── Layout.tsx              # Cloudscape AppLayout
│   │   ├── Navigation.tsx          # Side navigation
│   │   ├── StatCard.tsx            # Dashboard stat card
│   │   ├── ToolBadges.tsx          # Permission tool badges
│   │   ├── SkillCard.tsx           # Skill catalog card
│   │   ├── ApprovalCard.tsx        # Approval queue card
│   │   ├── CostCalculator.tsx      # Interactive calculator
│   │   └── PipelineInspector.tsx   # Playground right panel
│   ├── hooks/
│   │   ├── useTenants.ts           # React Query hooks
│   │   ├── useSkills.ts
│   │   ├── useUsage.ts
│   │   └── useAudit.ts
│   └── theme/
│       └── dark.css                # Cloudscape dark mode overrides
└── README.md
```

---

## 7. 实施计划

### Phase 1: 骨架 + Dashboard (3 天)

- Vite + React + TypeScript + Cloudscape 项目初始化
- AppLayout + Side Navigation + 路由
- Dashboard 页面 (stat cards + 图表)
- FastAPI 后端骨架 + /dashboard API

### Phase 2: Tenants + Skills (4 天)

- Tenant List (Cloudscape Table)
- Tenant Detail / Edit (Form + permission toggles)
- Skill Catalog (Cards + Layer badges)
- Skill Detail (API Key management)
- FastAPI: /tenants + /skills CRUD → SSM + S3

### Phase 3: Approvals + Audit + Usage (3 天)

- Approval Queue (Split Panel)
- Audit Log (Table + filters)
- Usage & Cost (Charts + Calculator)
- FastAPI: /approvals + /audit + /usage → SSM + CloudWatch

### Phase 4: Security + Playground + Settings (3 天)

- Security Center (stats + trends)
- Playground (chat + pipeline inspector)
- Settings (model, services, gateway)
- Onboarding Wizard

### Phase 5: 部署 + 集成测试 (2 天)

- 前端 build → S3 + CloudFront 或 EC2 本地 serve
- FastAPI 部署到 EC2 (systemd service)
- 端到端测试: 真实 SSM/S3/CloudWatch 数据
- 文档更新

---

## 8. 不做的事情 (v1.0)

| 功能 | 原因 | 计划 |
|------|------|------|
| 多语言 (i18n) | 首版英文，后续加中文 | v1.1 |
| 移动端适配 | Admin Console 主要在桌面使用 | v2.0 |
| 实时 WebSocket 推送 | 轮询足够，复杂度低 | v1.1 |
| 用户认证 (Cognito) | 首版用 Gateway Token，后续加 Cognito | v1.1 |
| 多集群管理 | 首版单集群 | v2.0 |
| 自定义仪表盘 | 首版固定布局 | v2.0 |
