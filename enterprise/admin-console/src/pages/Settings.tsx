import { useState } from 'react';
import { Settings as SettingsIcon, Cpu, Server, Globe, Key, Zap, Shield, HardDrive, Database, Cloud, AlertTriangle, Lock } from 'lucide-react';
import { Card, Badge, Button, PageHeader, Toggle, StatusDot, Table, Tabs } from '../components/ui';
import { useModelConfig, useSecurityConfig, useServiceStatus, usePositions, useUpdateSecurityConfig } from '../hooks/useApi';

export default function Settings() {
  const { data: modelConfig } = useModelConfig();
  const { data: securityConfig } = useSecurityConfig();
  const updateSecurity = useUpdateSecurityConfig();
  const { data: services } = useServiceStatus();
  const { data: positions = [] } = usePositions();
  const [activeTab, setActiveTab] = useState('model');

  const mc = modelConfig || { default: { modelId: '', modelName: 'Loading...', inputRate: 0, outputRate: 0 }, fallback: { modelId: '', modelName: '', inputRate: 0, outputRate: 0 }, positionOverrides: {}, availableModels: [] };
  const sc = securityConfig || { alwaysBlocked: [], piiDetection: { enabled: true, mode: 'redact' }, dataSovereignty: { enabled: true, region: '' }, conversationRetention: { days: 180 }, dockerSandbox: true, fastPathRouting: true, verboseAudit: false };
  const svc = services || { gateway: { status: 'unknown', port: 0, uptime: '', requestsToday: 0 }, auth_agent: { status: 'unknown', uptime: '', approvalsProcessed: 0 }, bedrock: { status: 'unknown', region: '', latencyMs: 0, vpcEndpoint: false }, dynamodb: { status: 'unknown', table: '', itemCount: 0 }, s3: { status: 'unknown', bucket: '' } };

  return (
    <div>
      <div className="flex items-center justify-between">
        <PageHeader title="Settings" description="Platform configuration, model selection, security policies, and service health" />
        <Badge color="info">v1.0.0</Badge>
      </div>

      <Tabs
        tabs={[
          { id: 'model', label: 'LLM Provider' },
          { id: 'security', label: 'Security Policy' },
          { id: 'services', label: 'Service Status' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="mt-6">
        {activeTab === 'model' && (
          <div className="space-y-6">
            {/* Default + Fallback */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Cpu size={18} className="text-primary" /><h3 className="text-sm font-semibold">Default Model</h3></div>
                  <Button variant="default" size="sm" disabled>Change</Button>
                </div>
                <div className="rounded-lg bg-dark-bg p-4 space-y-2">
                  <p className="text-lg font-semibold text-text-primary">{mc.default.modelName}</p>
                  <p className="text-xs text-text-muted font-mono">{mc.default.modelId}</p>
                  <div className="flex gap-3 mt-2">
                    <Badge color="success">Input: ${mc.default.inputRate}/1M</Badge>
                    <Badge color="success">Output: ${mc.default.outputRate}/1M</Badge>
                  </div>
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2"><Zap size={18} className="text-warning" /><h3 className="text-sm font-semibold">Fallback Model</h3></div>
                  <Button variant="default" size="sm" disabled>Change</Button>
                </div>
                <div className="rounded-lg bg-dark-bg p-4 space-y-2">
                  <p className="text-lg font-semibold text-text-primary">{mc.fallback.modelName}</p>
                  <p className="text-xs text-text-muted font-mono">{mc.fallback.modelId}</p>
                  <div className="flex gap-3 mt-2">
                    <Badge color="info">Input: ${mc.fallback.inputRate}/1M</Badge>
                    <Badge color="info">Output: ${mc.fallback.outputRate}/1M</Badge>
                  </div>
                </div>
              </Card>
            </div>

            {/* Per-Position Overrides */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Per-Position Model Overrides</h3>
                  <p className="text-xs text-text-muted">Override the default model for specific positions that need different capabilities</p>
                </div>
                <Button variant="default" size="sm" disabled>Add Override</Button>
              </div>
              <Table
                columns={[
                  { key: 'position', label: 'Position', render: (item: { posId: string; posName: string; modelName: string; modelId: string; inputRate: number; outputRate: number; reason: string }) => (
                    <span className="font-medium">{item.posName}</span>
                  )},
                  { key: 'model', label: 'Model', render: (item: { posId: string; posName: string; modelName: string; modelId: string; inputRate: number; outputRate: number; reason: string }) => (
                    <div><p className="text-sm">{item.modelName}</p><p className="text-xs text-text-muted font-mono">{item.modelId}</p></div>
                  )},
                  { key: 'pricing', label: 'Pricing', render: (item: { posId: string; posName: string; modelName: string; modelId: string; inputRate: number; outputRate: number; reason: string }) => (
                    <span className="text-xs">${item.inputRate} / ${item.outputRate}</span>
                  )},
                  { key: 'reason', label: 'Reason', render: (item: { posId: string; posName: string; modelName: string; modelId: string; inputRate: number; outputRate: number; reason: string }) => (
                    <span className="text-xs text-text-secondary">{item.reason}</span>
                  )},
                  { key: 'actions', label: '', render: () => <Button variant="ghost" size="sm" disabled>Remove</Button> },
                ]}
                data={Object.entries(mc.positionOverrides).map(([posId, override]) => ({
                  posId,
                  posName: positions.find(p => p.id === posId)?.name || posId,
                  ...override,
                }))}
              />
            </Card>

            {/* Available Models */}
            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Available Models</h3>
              <Table
                columns={[
                  { key: 'name', label: 'Model', render: (m: typeof mc.availableModels[0]) => (
                    <div><p className="font-medium">{m.modelName}</p><p className="text-xs text-text-muted font-mono">{m.modelId}</p></div>
                  )},
                  { key: 'input', label: 'Input Rate', render: (m: typeof mc.availableModels[0]) => `$${m.inputRate}/1M tokens` },
                  { key: 'output', label: 'Output Rate', render: (m: typeof mc.availableModels[0]) => `$${m.outputRate}/1M tokens` },
                  { key: 'status', label: 'Status', render: (m: typeof mc.availableModels[0]) => (
                    <Badge color={m.enabled ? 'success' : 'default'} dot>{m.enabled ? 'Enabled' : 'Disabled'}</Badge>
                  )},
                  { key: 'actions', label: '', render: (m: typeof mc.availableModels[0]) => (
                    <span className="text-xs text-text-muted">{m.enabled ? 'Active' : 'Inactive'}</span>
                  )},
                ]}
                data={mc.availableModels}
              />
            </Card>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center gap-2 mb-4"><Shield size={18} className="text-danger" /><h3 className="text-sm font-semibold">Always Blocked Tools</h3></div>
              <div className="flex flex-wrap gap-2">
                {sc.alwaysBlocked.map(t => <Badge key={t} color="danger">{t}</Badge>)}
              </div>
              <p className="mt-2 text-xs text-text-muted">These tools/patterns are blocked for ALL roles regardless of permissions</p>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Security Policies</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">PII Detection</p>
                    <p className="text-xs text-text-muted">Detect and handle personally identifiable information in agent responses</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={sc.piiDetection.enabled ? 'success' : 'default'}>{sc.piiDetection.enabled ? 'Enabled' : 'Disabled'}</Badge>
                    <Badge color="info">Mode: {sc.piiDetection.mode}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Data Sovereignty</p>
                    <p className="text-xs text-text-muted">Ensure all data stays within the configured AWS region</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={sc.dataSovereignty.enabled ? 'success' : 'default'}>{sc.dataSovereignty.enabled ? 'Enabled' : 'Disabled'}</Badge>
                    <Badge color="info">Region: {sc.dataSovereignty.region}</Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Conversation Retention</p>
                    <p className="text-xs text-text-muted">How long conversation logs are retained before automatic deletion</p>
                  </div>
                  <Badge color="info">{sc.conversationRetention.days} days</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Docker Sandbox</p>
                    <p className="text-xs text-text-muted">Isolate code_execution tool calls in Docker containers</p>
                  </div>
                  <button onClick={() => updateSecurity.mutate({ dockerSandbox: !sc.dockerSandbox })} className="cursor-pointer">
                    <Badge color={sc.dockerSandbox ? 'success' : 'warning'}>{sc.dockerSandbox ? 'Enabled' : 'Disabled'}</Badge>
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Fast-Path Routing</p>
                    <p className="text-xs text-text-muted">Skip Plan A evaluation for pre-approved tool+role combinations</p>
                  </div>
                  <button onClick={() => updateSecurity.mutate({ fastPathRouting: !sc.fastPathRouting })} className="cursor-pointer">
                    <Badge color={sc.fastPathRouting ? 'success' : 'default'}>{sc.fastPathRouting ? 'Enabled' : 'Disabled'}</Badge>
                  </button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-dark-bg p-4">
                  <div>
                    <p className="text-sm font-medium">Verbose Audit Logging</p>
                    <p className="text-xs text-text-muted">Log full request/response payloads (increases storage cost)</p>
                  </div>
                  <button onClick={() => updateSecurity.mutate({ verboseAudit: !sc.verboseAudit })} className="cursor-pointer">
                    <Badge color={sc.verboseAudit ? 'warning' : 'default'}>{sc.verboseAudit ? 'Enabled' : 'Disabled'}</Badge>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'Gateway Proxy', icon: <Globe size={18} />, status: svc.gateway.status, details: [`Port: ${svc.gateway.port}`, `Uptime: ${svc.gateway.uptime}`, `Requests today: ${svc.gateway.requestsToday}`] },
                { name: 'Auth Agent', icon: <Shield size={18} />, status: svc.auth_agent.status, details: [`Uptime: ${svc.auth_agent.uptime}`, `Approvals: ${svc.auth_agent.approvalsProcessed}`] },
                { name: 'Bedrock', icon: <Cpu size={18} />, status: svc.bedrock.status, details: [`Region: ${svc.bedrock.region}`, `Latency: ${svc.bedrock.latencyMs}ms`, `VPC Endpoint: ${svc.bedrock.vpcEndpoint ? 'Yes' : 'No'}`] },
                { name: 'DynamoDB', icon: <Database size={18} />, status: svc.dynamodb.status, details: [`Table: ${svc.dynamodb.table}`, `Items: ${svc.dynamodb.itemCount}`] },
                { name: 'S3', icon: <Cloud size={18} />, status: svc.s3.status, details: [`Bucket: ${svc.s3.bucket}`] },
              ].map(s => (
                <Card key={s.name}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">{s.icon}<h3 className="text-sm font-semibold">{s.name}</h3></div>
                    <div className={`h-2.5 w-2.5 rounded-full ${s.status === 'running' || s.status === 'healthy' || s.status === 'connected' || s.status === 'active' ? 'bg-success animate-pulse' : 'bg-warning'}`} />
                  </div>
                  <div className="space-y-1">
                    {s.details.map((d, i) => <p key={i} className="text-xs text-text-muted">{d}</p>)}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
