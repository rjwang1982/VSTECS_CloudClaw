# OpenClaw Enterprise Admin Console — PRD v2

日期: 2026-03-20
版本: v2.0
状态: 设计稿

---

## 0. 产品定位升级

### v1 的问题

v1 PRD 把 Admin Console 定位成"IT 管理工具"——管理权限、看日志、查成本。
这是一个运维视角，不是产品视角。

### v2 的定位

**把"个人 AI 助手"变成"组织级数字员工"。**

OpenClaw 的灵魂是文件驱动的 Agent 身份体系：
- `SOUL.md` — 人格、价值观、行为边界
- `AGENTS.md` — 行为规范、工作流程、决策框架
- `MEMORY.md` — 长期记忆、学习积累
- `TOOLS.md` — 工具配置、API 接入
- `skills/` — 能力扩展

企业版不是重写 OpenClaw，而是在这个文件驱动体系上加**组织级管理层**：
- 三层继承（全局 → 岗位 → 个人）
- 权限引擎（贴合组织树，不是简单 RBAC）
- Agent 生命周期管理（创建 → 测试 → 灰度 → 上线 → 监控 → 优化 → 归档）
- 知识库深度集成（不是通用 RAG，是 Workspace 体系的延伸）

### 核心差异

| 维度 | 个人 OpenClaw | 企业 OpenClaw (本产品) |
|------|-------------|----------------------|
| 身份 | 一个 SOUL.md | 三层继承: 全局 → 岗位 → 个人 |
| 权限 | 无 | 组织树 + 岗位模板 + 细粒度控制 |
| 记忆 | 个人私有 | 个人私有 + 组织知识库注入 |
| 技能 | 手动安装 | 三层 Skill 架构 + 岗位默认配置 |
| 协同 | 单人单 Agent | 1:1 / N:1 / 1:N / Agent→Agent |
| 监控 | 无 | 健康度 + 质量 + 成本 + 合规 |
| 生命周期 | 手动管理 | 模板 → 灰度 → A/B → 回滚 |

---

## 1. 模块一：组织架构 & 权限引擎

### 组织树模型

不是简单的 RBAC，而是贴合企业实际组织结构的四层模型：

```
组织 (Org)
  └── 顶层租户，数据完全隔离
      ├── 部门 (Department)
      │   └── 对应企业实际部门树，可从飞书/钉钉/AD 同步
      │       ├── 岗位/角色 (Position)
      │       │   └── SA、PM、Sales、HR...
      │       │       每个岗位有默认的 Agent 配置模板
      │       │       ├── 员工 (Member)
      │       │       │   └── 绑定到具体岗位，继承岗位的 Agent 配置
      │       │       └── 员工 (Member)
      │       └── 岗位/角色 (Position)
      └── 部门 (Department)
```

### 权限粒度

| 权限类型 | 说明 | 继承规则 |
|---------|------|---------|
| Agent 管理权 | 谁能创建/修改/删除 Agent | 部门管理员 + IT Admin |
| Workspace 文件权 | 谁能编辑 SOUL.md / AGENTS.md | 岗位管理员（SOUL 全局条款不可覆盖） |
| 渠道接入权 | 谁能通过哪个渠道和 Agent 对话 | 岗位默认 + 个人可申请 |
| Knowledge 权 | 谁能访问哪些知识库文档 | 跟随组织架构，离职自动回收 |
| Tool 权 | 谁能使用哪些工具/技能 | 三层继承: 全局 → 岗位 → 个人 |
| 审批权 | 敏感操作的审批链 | 上级 → 部门管理员 → IT Admin |

### Admin Console 页面：组织架构

```
┌─────────────────────────────────────────────────────────┐
│  Organization Structure                                  │
│                                                         │
│  ┌─ ACME Corp (Org)                                     │
│  │  ├─ Engineering                                      │
│  │  │  ├─ SA (Solutions Architect)     3 members        │
│  │  │  │  ├── 张三  [WhatsApp] [Active] [7 skills]     │
│  │  │  │  ├── 李四  [Telegram] [Active] [7 skills]     │
│  │  │  │  └── 王五  [Slack]    [Idle]   [7 skills]     │
│  │  │  ├─ SDE (Software Engineer)      8 members        │
│  │  │  └─ PM (Product Manager)         2 members        │
│  │  ├─ Finance                                          │
│  │  │  ├─ Analyst                      4 members        │
│  │  │  └─ Controller                   1 member         │
│  │  ├─ Sales                                            │
│  │  │  ├─ AE (Account Executive)       5 members        │
│  │  │  └─ SDR                          3 members        │
│  │  └─ HR                                               │
│  │     └─ Recruiter                    2 members        │
│  └─ [+ Add Department]                                  │
│                                                         │
│  [Import from 飞书/钉钉/AD]  [Export]  [Sync]           │
└─────────────────────────────────────────────────────────┘
```

点击岗位 → 进入岗位模板编辑器（模块二）。
点击员工 → 进入员工 Agent 详情（模块三）。

---

## 2. 模块二：岗位模板管理（SOUL/AGENTS/Memory/Skill）

### 三层继承模型

这是企业版最核心的差异化。OpenClaw 的文件驱动体系天然支持 overlay：

```
组织模板层 (全局基线)
├── SOUL.md       → 企业统一人格基线（品牌调性、合规底线、价值观）
├── AGENTS.md     → 企业统一行为规范（安全红线、数据处理规则、审批流程）
├── TOOLS.md      → 企业级工具配置（内部 API endpoint、SSO、VPN）
└── skills/       → 全员共享 skills（web_search、S3 files、内部文档搜索）

岗位模板层 (继承 + 覆盖)
├── SA 岗位/
│   ├── SOUL.md       → 技术导向人格，深度架构思维，客户沟通能力
│   ├── AGENTS.md     → Well-Architected 审查流程、成本优化 checklist、迁移评估
│   ├── skills/       → AWS 架构图生成、成本计算器、迁移评估工具
│   └── knowledge/    → 绑定 SA 专用文档库（白皮书、案例库、定价表）
│
├── Sales 岗位/
│   ├── SOUL.md       → 商务导向、客户关系敏感、积极主动
│   ├── AGENTS.md     → CRM 更新规范、报价审批流程、竞品分析框架
│   ├── skills/       → 报价生成、竞品分析、客户画像、邮件撰写
│   └── knowledge/    → 绑定定价文档、案例库、竞品情报
│
├── HR 岗位/
│   ├── SOUL.md       → 温暖专业、合规优先、保密意识
│   ├── skills/       → 简历筛选、面试安排、入职 checklist、薪酬计算
│   └── knowledge/    → 绑定 HR 政策库、劳动法规、福利手册
│
└── Finance 岗位/
    ├── SOUL.md       → 严谨精确、数据驱动、合规第一
    ├── AGENTS.md     → 财务审批流程、报表生成规范
    ├── skills/       → SAP 查询、报表生成、预算分析
    └── knowledge/    → 绑定财务制度、税务法规

个人层 (继承岗位 + 个性化)
└── 员工张三/
    ├── USER.md       → 个人偏好（语言、沟通风格、时区）
    ├── MEMORY.md     → 个人长期记忆（严格私有，组织不可见）
    └── memory/       → 个人日志（每日自动生成）
```

### 合并策略

| 文件 | 合并规则 | 说明 |
|------|---------|------|
| SOUL.md | 岗位层追加，不允许覆盖全局合规条款 | 全局定义的安全红线不可被岗位或个人覆盖 |
| AGENTS.md | 岗位层追加行为规范，全局规范始终生效 | 岗位可以加流程，不能删全局规则 |
| TOOLS.md | 合并（全局 + 岗位），岗位可限制但不能扩展全局禁止的工具 | install_skill 全局禁止 = 所有岗位禁止 |
| skills/ | 合并（全局 + 岗位 + 个人） | 三层 skill 都可用 |
| knowledge/ | 合并（全局 + 岗位），个人不能自行挂载组织知识库 | 知识库访问权跟随组织架构 |
| MEMORY.md | 严格私有，只有本人和 Agent 可读 | 组织管理员不可查看个人记忆 |
| USER.md | 个人完全控制 | 偏好、习惯、个性化设置 |

### Admin Console 页面：岗位模板编辑器

```
┌─────────────────────────────────────────────────────────┐
│  Position Template: Solutions Architect (SA)              │
│  Department: Engineering · Members: 3                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tabs: [SOUL.md] [AGENTS.md] [Skills] [Knowledge] [Members]
│                                                         │
│  ┌─ SOUL.md Editor ─────────────────────────────────┐   │
│  │                                                   │   │
│  │  🔒 Global (read-only, inherited):                │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ You are an AI assistant for ACME Corp.       │ │   │
│  │  │ You MUST follow company data policies.       │ │   │
│  │  │ You MUST NOT share confidential information. │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                   │   │
│  │  ✏️ Position (editable):                          │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │ You are a Solutions Architect specializing    │ │   │
│  │  │ in AWS cloud architecture. You think deeply  │ │   │
│  │  │ about system design, cost optimization, and  │ │   │
│  │  │ Well-Architected principles.                 │ │   │
│  │  │                                              │ │   │
│  │  │ When reviewing architectures, always check:  │ │   │
│  │  │ - Security (IAM, encryption, network)        │ │   │
│  │  │ - Reliability (multi-AZ, backup, DR)         │ │   │
│  │  │ - Cost (right-sizing, reserved, spot)        │ │   │
│  │  └──────────────────────────────────────────────┘ │   │
│  │                                                   │   │
│  │  Preview (merged):                                │   │
│  │  [Show merged SOUL.md that Agent will see]        │   │
│  └───────────────────────────────────────────────────┘   │
│                                                         │
│  Version History: v3 (current) | v2 (Mar 18) | v1       │
│  [Save Draft] [Publish] [A/B Test] [Rollback to v2]    │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 模块三：员工-Agent 协同管理

### Agent 分配模式

不是"一个人一个 Agent"这么简单：

| 模式 | 说明 | 场景 |
|------|------|------|
| 1:1 私人助手 | 每个员工有专属 Agent 实例，绑定个人 Workspace | 日常工作助手 |
| N:1 团队 Agent | 一个 Agent 服务整个团队，共享 Memory | IT Help Desk、前台接待 |
| 1:N 多 Agent | 一个员工可调用多个专业 Agent | 写作 Agent + 代码 Agent + 数据 Agent |
| Agent→Agent | Agent 之间可委派任务（sessions_spawn） | SA Agent 调用成本计算 Agent |

### Admin Console 页面：协同面板

```
┌─────────────────────────────────────────────────────────┐
│  Agent Collaboration Map                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │   [张三] ──── [SA Agent] ──── [成本计算 Agent]  │    │
│  │      │                              │           │    │
│  │   [李四] ──── [SA Agent]            │           │    │
│  │                                     │           │    │
│  │   [王五] ──── [Sales Agent] ────────┘           │    │
│  │      │                                          │    │
│  │      └─────── [IT Help Desk Agent] ← 共享       │    │
│  │                     ↑                           │    │
│  │   [全部门] ─────────┘                           │    │
│  │                                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  Active Sessions: 8                                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 张三 ↔ SA Agent        Active  12min  Telegram   │   │
│  │ 李四 ↔ SA Agent        Active   3min  WhatsApp   │   │
│  │ 王五 ↔ Sales Agent     Idle    45min  Slack      │   │
│  │ IT Desk ↔ 5 users      Active   8min  Discord    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Cross-Agent Task Chains (last 24h):                    │
│  SA Agent → 成本计算 Agent → 报告生成 Agent (3 hops)    │
│  Sales Agent → CRM Agent → 邮件 Agent (2 hops)         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 模块四：Agent 运行状态 & 健康监控

不是简单的 UP/DOWN，要深入到 OpenClaw 的运行语义。

### 健康度仪表盘

```
Agent 健康度
├── 实例状态
│   ├── Gateway 进程状态 (running / crashed / restarting)
│   ├── 各 Channel 连接状态 (飞书 connected / WhatsApp auth_expired)
│   ├── Heartbeat 执行状态 (last_run / success_rate / avg_duration)
│   └── Session 活跃数 (active / idle / zombie)
│
├── 性能指标
│   ├── 平均响应延迟 (首字时间 / 完整回复时间)
│   ├── Tool 调用成功率 (按 tool 类型分)
│   ├── Sub-agent spawn 成功率 & 超时率
│   ├── Memory 文件大小趋势 (防膨胀)
│   └── Context window 利用率 (接近上限告警)
│
├── 质量指标
│   ├── 对话轮次 / 满意度 (用户显式反馈 or 隐式信号)
│   ├── Hallucination 检测率 (基于 fact-check)
│   ├── 敏感信息泄露检测
│   └── AGENTS.md 规范遵守度 (通过采样审计)
│
└── 成本指标
    ├── Token 消耗 (input / output / cache，按 Agent / 员工 / 部门)
    ├── 模型调用次数 (按 model 分)
    ├── Tool 调用次数 (外部 API 成本)
    └── 预算消耗进度 & 预测
```

### Admin Console 页面：Agent 监控

```
┌─────────────────────────────────────────────────────────┐
│  Agent Health Dashboard                                  │
├─────────┬─────────┬─────────┬─────────┬─────────┬──────┤
│ Agents  │Sessions │ Avg     │ Tool    │ Quality │Budget│
│ 28/30   │  12     │ 3.2s   │ 94.2%   │ 4.2/5   │ 62%  │
│ healthy │ active  │ latency │ success │ score   │ used │
├─────────┴─────────┴─────────┴─────────┴─────────┴──────┤
│                                                         │
│  ┌─ Performance (24h) ──────────────────────────────┐   │
│  │ [Line chart: response latency P50/P95/P99]       │   │
│  │ [Stacked area: token usage by department]        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Alerts ─────────────┐ ┌─ Top Consumers ─────────┐  │
│  │ ⚠ WhatsApp auth      │ │ 1. Engineering  45k tok  │  │
│  │   expires in 2 days  │ │ 2. Sales        28k tok  │  │
│  │ ⚠ Memory 张三 >50MB  │ │ 3. Finance      12k tok  │  │
│  │ 🔴 IT Desk Agent     │ │ 4. HR            4k tok  │  │
│  │   crash loop (3x)    │ │                          │  │
│  └──────────────────────┘ └──────────────────────────┘  │
│                                                         │
│  ┌─ Context Window Utilization ─────────────────────┐   │
│  │ SA Agent (张三):  ████████████░░░░  78% (156k/200k)│  │
│  │ Sales Agent:      ██████░░░░░░░░░░  42% (84k/200k) │  │
│  │ IT Desk:          ████████████████  95% ⚠ NEAR LIMIT│  │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 模块五：知识库 & 企业上下文注入

不是通用 RAG，而是和 OpenClaw 的 Workspace 体系深度集成。

### 知识库层级

| 层级 | 注入方式 | 权限 |
|------|---------|------|
| 组织知识库 | 自动注入到全局 AGENTS.md 的 context | 全员可读 |
| 部门知识库 | 注入到岗位模板的 knowledge/ 目录 | 部门内可读 |
| 项目知识库 | 按需挂载到特定 Agent 的 skills/ 目录 | 项目成员可读 |
| 个人知识库 | 员工自行上传到个人 Workspace | 仅本人可读 |

### 知识库管理

```
┌─────────────────────────────────────────────────────────┐
│  Knowledge Base Management                               │
│                                                         │
│  ┌─ Organization (全员) ────────────────────────────┐   │
│  │ 📋 Company Policies        12 docs   Updated 3d  │   │
│  │ 📖 Product Documentation   45 docs   Updated 1d  │   │
│  │ 🔒 Security Procedures      8 docs   Updated 7d  │   │
│  │ 🎓 Onboarding Guide         6 docs   Updated 14d │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Department ─────────────────────────────────────┐   │
│  │ Engineering/                                      │   │
│  │   📐 Architecture Standards    8 docs             │   │
│  │   🔧 Runbooks & Playbooks    15 docs             │   │
│  │ Finance/                                          │   │
│  │   💰 Financial Policies        5 docs             │   │
│  │   📊 Reporting Templates       3 docs             │   │
│  │ Sales/                                            │   │
│  │   🏷️ Pricing & Packaging      4 docs             │   │
│  │   📈 Case Studies             12 docs             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Access Control:                                        │
│  ✅ 权限继承跟随组织架构                                │
│  ✅ 离职自动回收知识库访问权                            │
│  ✅ 跨部门访问需审批                                    │
│  ✅ 所有访问记录审计日志                                │
│                                                         │
│  [+ Upload Documents]  [Sync from Confluence/Notion]    │
└─────────────────────────────────────────────────────────┘
```

---

## 6. 模块六：审计 & 合规

### 审计范围

| 审计项 | 数据源 | 保留策略 |
|--------|--------|---------|
| 全量对话日志 | CloudWatch (加密存储) | 90 天热存 + S3 Glacier 冷存 |
| 敏感操作审批流 | SSM + DynamoDB | 永久保留 |
| 数据流向追踪 | CloudTrail + 自定义日志 | 哪些数据被发到了哪个 LLM Provider |
| 权限变更记录 | SSM 版本历史 | 永久保留 |
| Agent 配置变更 | S3 版本控制 (SOUL.md/AGENTS.md) | 永久保留 |

### 合规报告

```
┌─────────────────────────────────────────────────────────┐
│  Compliance Center                                       │
│                                                         │
│  ┌─ Compliance Status ──────────────────────────────┐   │
│  │ SOC 2 Type II    ✅ Ready   Last audit: Mar 15   │   │
│  │ 等保 2.0         ✅ Ready   Last audit: Mar 10   │   │
│  │ GDPR             ⚠ Review  Data residency check  │   │
│  │ HIPAA            ❌ N/A     Not applicable        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  Data Flow Map:                                         │
│  员工消息 → EC2 Gateway (us-east-1)                     │
│    → Bedrock (us-east-1, 数据不出区域)                  │
│    → S3 (us-east-1, SSE-KMS 加密)                      │
│    → CloudWatch (us-east-1, 加密)                       │
│  ✅ 所有数据在同一 Region，不跨境                       │
│                                                         │
│  [Export SOC2 Report]  [Export 等保 Report]              │
│  [Data Residency Map]  [Retention Policy Config]        │
└─────────────────────────────────────────────────────────┘
```

---

## 7. 模块七：Agent 生命周期管理

### 生命周期流程

```
创建 → 配置 → 测试 → 上线 → 监控 → 优化 → 归档
  ↑                                    |
  └──── A/B 测试 ←────────────────────┘
```

### 关键能力

| 能力 | 说明 |
|------|------|
| 模板市场 | 从岗位模板一键创建 Agent，预配置 SOUL/AGENTS/Skills |
| 灰度发布 | 新 SOUL.md 先给 10% 用户，观察质量指标后全量推送 |
| 版本管理 | 每次 SOUL.md / AGENTS.md 变更自动 git commit (S3 版本控制) |
| A/B 测试 | 两个版本的 SOUL.md 同时运行，对比质量/满意度/成本 |
| 回滚 | 质量下降时一键回退到上一版本 |
| 归档 | 员工离职 → Agent 归档 → Memory 加密封存 → 知识库权限回收 |

### Admin Console 页面：Agent 生命周期

```
┌─────────────────────────────────────────────────────────┐
│  Agent Lifecycle: SA Agent (张三)                        │
│                                                         │
│  Status: 🟢 Production · Version: v3 · Created: Mar 1   │
│                                                         │
│  Timeline:                                              │
│  ──●── v1 Created (Mar 1) ── from SA template           │
│    │                                                    │
│  ──●── v2 SOUL.md updated (Mar 10) ── added cost focus  │
│    │   Quality: 4.1/5 → 4.3/5 ✅                       │
│    │                                                    │
│  ──●── v3 A/B test started (Mar 15)                     │
│    │   A: v2 (50%) vs B: v3-experimental (50%)          │
│    │   B shows +12% satisfaction, -8% cost              │
│    │                                                    │
│  ──●── v3 Promoted to 100% (Mar 18)                     │
│    │                                                    │
│  ──○── Now                                              │
│                                                         │
│  [Edit SOUL.md]  [Start A/B Test]  [Rollback to v2]    │
│  [View Metrics]  [Archive Agent]                        │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 信息架构 (导航结构 v2)

```
🦞 OpenClaw Enterprise
│
├── 📊 Dashboard                    ← 组织级总览
│
├── 🏢 Organization                 ← 模块一
│   ├── Org Tree (部门/岗位/员工)
│   ├── Position Templates          ← 模块二
│   └── Permission Engine
│
├── 🤖 Agents                       ← 模块三 + 七
│   ├── Agent List (所有 Agent 实例)
│   ├── Agent Detail (配置/版本/A-B)
│   ├── Collaboration Map (协同关系图)
│   └── Lifecycle (创建/灰度/回滚/归档)
│
├── 🧩 Skills                       ← 三层 Skill 目录
│   ├── Skill Catalog (Layer 1/2/3)
│   ├── Skill Detail / Config
│   └── API Key Management
│
├── 📚 Knowledge                    ← 模块五
│   ├── Organization KB
│   ├── Department KB
│   └── Access Control
│
├── 📈 Monitoring                   ← 模块四
│   ├── Health Dashboard
│   ├── Performance Metrics
│   ├── Quality Metrics
│   └── Cost & Budget
│
├── 🔐 Security & Compliance        ← 模块六
│   ├── Audit Log
│   ├── Approvals
│   ├── Compliance Reports
│   └── Data Flow Map
│
├── ⚡ Playground                    ← Agent 测试沙箱
│
└── ⚙️ Settings
    ├── Model Selection
    ├── Gateway Config
    ├── Service Status
    └── Onboarding Wizard
```

---

## 9. 技术架构 (不变)

```
Frontend: React 19 + TypeScript + Vite + Cloudscape Design System
Backend:  Python FastAPI + boto3
Storage:  SSM (config) + S3 (workspace/skills/KB) + CloudWatch (logs/metrics)
Auth:     Gateway Token → 后续 Cognito
Deploy:   EC2 本地 serve 或 S3 + CloudFront
```

---

## 10. 实施计划 (修订)

### Phase 1: 组织架构 + 岗位模板 (Week 1)

- 组织树 CRUD (Org → Dept → Position → Member)
- 岗位模板编辑器 (SOUL.md 三层继承 + 预览)
- SSM 数据模型设计 (组织树存储结构)
- 后端 API: /org, /positions, /members

### Phase 2: Agent 管理 + 协同 (Week 2)

- Agent 列表 + 详情页
- 1:1 / N:1 / 1:N 分配模式
- 协同关系图 (Canvas 可视化)
- Agent 版本管理 (S3 版本控制)
- 后端 API: /agents, /sessions

### Phase 3: 监控 + 知识库 (Week 3)

- 健康度仪表盘 (实例/性能/质量/成本)
- 知识库管理 (上传/分类/权限)
- Context window 利用率监控
- 后端 API: /monitoring, /knowledge

### Phase 4: 审计合规 + 生命周期 (Week 4)

- 全量审计日志 + 合规报告
- A/B 测试框架
- 灰度发布 + 回滚
- 归档流程
- 后端 API: /compliance, /lifecycle

### Phase 5: 集成测试 + 部署 (Week 5)

- 前后端联调 (真实 AWS 数据)
- EC2 部署 (systemd)
- 端到端测试
- 文档更新

---

## 11. v1 PRD 保留的模块

以下模块从 v1 PRD 保留，整合到 v2 的新结构中：

| v1 模块 | v2 归属 |
|---------|--------|
| Dashboard | Dashboard (升级为组织级总览) |
| Tenants | Organization → Members |
| Skills | Skills (不变) |
| Approvals | Security & Compliance → Approvals |
| Audit Log | Security & Compliance → Audit Log |
| Usage & Cost | Monitoring → Cost & Budget |
| Security | Security & Compliance |
| Playground | Playground (不变) |
| Settings | Settings (不变) |
| Onboarding | Settings → Onboarding Wizard |

---

## 12. 不做的事情 (v1.0)

| 功能 | 原因 | 计划 |
|------|------|------|
| 飞书/钉钉/AD 自动同步 | 需要 OAuth 集成 | v1.1 |
| Hallucination 检测 | 需要 fact-check 模型 | v2.0 |
| 多语言 (i18n) | 首版英文+中文 | v1.1 |
| 移动端适配 | Admin Console 主要桌面使用 | v2.0 |
| Agent→Agent 委派 | 需要 AgentCore sessions_spawn | v1.1 |
| A/B 测试自动化 | 首版手动对比 | v1.1 |
| 预算自动限流 | 首版告警，不自动限流 | v1.1 |
