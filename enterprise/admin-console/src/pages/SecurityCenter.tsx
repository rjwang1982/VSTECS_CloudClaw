import { useState, useEffect } from 'react';
import {
  Shield, Cpu, Zap, Clock, Edit3, Save, X, Plus, ChevronRight,
  Package, Key, Network, Globe2, CheckCircle, AlertTriangle,
  FileText, Wrench, RefreshCw, ExternalLink, Lock, Unlock,
} from 'lucide-react';
import { Card, Badge, Button, PageHeader, Tabs, Modal } from '../components/ui';
import {
  usePositions, useSecurityRuntimes, useUpdateRuntimeLifecycle,
  useGlobalSoul, useUpdateGlobalSoul,
  usePositionSoul, useUpdatePositionSoul,
  usePositionTools, useUpdatePositionTools,
  useInfrastructure,
  useModelConfig,
} from '../hooks/useApi';

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtTime(sec: number) {
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  return `${Math.round(sec / 3600)} hr`;
}

function fmtBytes(b: number) {
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(0)} MB`;
  return `${b} B`;
}

const ALL_TOOLS = ['web_search', 'shell', 'browser', 'file', 'file_write', 'code_execution'];
const TOOL_LABELS: Record<string, string> = {
  web_search: 'Web Search', shell: 'Shell', browser: 'Browser',
  file: 'File Read', file_write: 'File Write', code_execution: 'Code Execution',
};

// ─── Time Slider ─────────────────────────────────────────────────────────────

function TimeSlider({ label, value, onChange, min = 60, max = 28800 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-xs font-semibold text-text-primary">{fmtTime(value)}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-primary" />
      <div className="flex justify-between text-[10px] text-text-muted mt-0.5">
        <span>1 min</span><span>15 min</span><span>1 hr</span><span>4 hr</span><span>8 hr</span>
      </div>
    </div>
  );
}

// ─── Runtime Card ─────────────────────────────────────────────────────────────

function RuntimeCard({ rt, models }: { rt: any; models: any[] }) {
  const [editing, setEditing] = useState(false);
  const [idle, setIdle] = useState(rt.idleTimeoutSec || 900);
  const [maxLife, setMaxLife] = useState(rt.maxLifetimeSec || 28800);
  const [saving, setSaving] = useState(false);
  const updateLifecycle = useUpdateRuntimeLifecycle();

  const isExec = rt.name?.toLowerCase().includes('exec') || rt.containerUri?.includes('exec');
  const imageTag = rt.containerUri?.split('/').pop() || 'unknown';
  const roleName = rt.roleArn?.split('/').pop() || rt.roleArn || '—';
  const modelName = models.find(m => m.modelId === rt.model)?.modelName || rt.model || '—';
  const isFullAccess = isExec;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateLifecycle.mutateAsync({ runtimeId: rt.id, idleTimeoutSec: idle, maxLifetimeSec: maxLife });
      setEditing(false);
    } catch {}
    setSaving(false);
  };

  return (
    <Card className={`${isExec ? 'border-warning/30' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isExec ? 'bg-warning/10' : 'bg-primary/10'}`}>
            {isExec ? <Zap size={20} className="text-warning" /> : <Cpu size={20} className="text-primary" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary">{rt.name}</h3>
            <p className="text-xs text-text-muted">v{rt.version || '1'} · {rt.id?.slice(-8)}</p>
          </div>
        </div>
        <Badge color={rt.status === 'READY' ? 'success' : 'warning'} dot>{rt.status || 'UNKNOWN'}</Badge>
      </div>

      <div className="space-y-2 mb-4">
        {[
          { label: 'Container', value: imageTag },
          { label: 'Default Model', value: modelName,
            extra: isExec ? <Badge color="warning">Executive</Badge> : null },
          { label: 'IAM Role', value: roleName,
            extra: <Badge color={isFullAccess ? 'danger' : 'info'}>{isFullAccess ? 'Full Access' : 'Scoped'}</Badge> },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between rounded-xl bg-surface-dim px-3 py-2">
            <span className="text-xs text-text-muted">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-secondary">{row.value}</span>
              {row.extra}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-dark-border/30 pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
            <Clock size={12} /> Lifecycle Settings
          </span>
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}><X size={12} /></Button>
              <Button size="sm" variant="primary" disabled={saving} onClick={handleSave}>
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? 'Saving' : 'Save'}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <Edit3 size={12} /> Edit
            </Button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <TimeSlider label="Idle timeout" value={idle} onChange={setIdle} />
            <TimeSlider label="Max lifetime" value={maxLife} onChange={setMaxLife} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Idle timeout', value: fmtTime(rt.idleTimeoutSec || 900), sub: 'No msg → microVM released' },
              { label: 'Max lifetime', value: fmtTime(rt.maxLifetimeSec || 28800), sub: 'Force restart ceiling' },
            ].map(s => (
              <div key={s.label} className="rounded-xl bg-surface-dim px-3 py-2.5">
                <p className="text-[10px] text-text-muted">{s.label}</p>
                <p className="text-base font-bold text-text-primary">{s.value}</p>
                <p className="text-[10px] text-text-muted">{s.sub}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Position Policy Row ──────────────────────────────────────────────────────

function PositionPolicyRow({ pos, onEditSoul, onEditTools }: {
  pos: any;
  onEditSoul: (pos: any) => void;
  onEditTools: (pos: any) => void;
}) {
  const { data: tools } = usePositionTools(pos.id);
  const allowedCount = tools?.tools?.length || 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-dark-hover/30 transition-colors rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{pos.name}</p>
        <p className="text-xs text-text-muted">{pos.departmentName}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge color={allowedCount > 3 ? 'warning' : 'info'}>{allowedCount} tools</Badge>
        <Button size="sm" variant="ghost" onClick={() => onEditSoul(pos)}>
          <FileText size={12} /> SOUL
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEditTools(pos)}>
          <Wrench size={12} /> Tools
        </Button>
      </div>
    </div>
  );
}

// ─── SOUL Edit Modal ──────────────────────────────────────────────────────────

function SoulEditModal({ pos, onClose }: { pos: any | null; onClose: () => void }) {
  const isGlobal = !pos;
  const { data: globalSoul } = useGlobalSoul();
  const { data: posSoul } = usePositionSoul(pos?.id || '');
  const updateGlobal = useUpdateGlobalSoul();
  const updatePos = useUpdatePositionSoul();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const soul = isGlobal ? globalSoul : posSoul;
  useEffect(() => { if (soul?.content !== undefined) setContent(soul.content); }, [soul?.content]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isGlobal) await updateGlobal.mutateAsync(content);
      else await updatePos.mutateAsync({ posId: pos.id, content });
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <Modal open={true} onClose={onClose}
      title={isGlobal ? 'Global SOUL.md — All Agents' : `SOUL.md — ${pos?.name}`}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={saving} onClick={handleSave}>
            {saving ? 'Saving…' : 'Save to S3'}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-text-muted mb-3">
        {isGlobal
          ? 'This SOUL.md applies to ALL agents as the base layer. Position and personal SOUL layers are merged on top.'
          : `This SOUL.md applies to all agents with position "${pos?.name}". Merged above the global layer.`}
      </p>
      <div className="text-[10px] font-mono text-text-muted mb-1">{soul?.key}</div>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={18}
        className="w-full rounded-xl border border-dark-border/60 bg-dark-bg px-4 py-3 text-sm font-mono text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none resize-y"
        placeholder="# ACME Corp — Digital Employee Policy&#10;&#10;You are a digital employee of ACME Corp..."
      />
    </Modal>
  );
}

// ─── Tools Edit Modal ─────────────────────────────────────────────────────────

function ToolsEditModal({ pos, onClose }: { pos: any; onClose: () => void }) {
  const { data: current } = usePositionTools(pos.id);
  const updateTools = useUpdatePositionTools();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (current?.tools) setSelected(current.tools);
  }, [current?.tools]);

  const toggle = (t: string) => setSelected(s => s.includes(t) ? s.filter(x => x !== t) : [...s, t]);

  const profile = selected.length === ALL_TOOLS.length ? 'exec'
    : selected.includes('shell') ? 'advanced' : 'basic';

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTools.mutateAsync({ posId: pos.id, profile, tools: selected });
      onClose();
    } catch {}
    setSaving(false);
  };

  return (
    <Modal open={true} onClose={onClose} title={`Tool Permissions — ${pos.name}`}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">Propagates to all employees in this position</span>
          <div className="flex gap-3">
            <Button variant="default" onClick={onClose}>Cancel</Button>
            <Button variant="primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save & Propagate'}
            </Button>
          </div>
        </div>
      }
    >
      <p className="text-xs text-text-muted mb-4">
        Select which tools agents in <strong className="text-text-primary">{pos.name}</strong> may use.
        Writing saves to SSM for every employee in this position.
      </p>
      <div className="space-y-2">
        {ALL_TOOLS.map(t => {
          const on = selected.includes(t);
          const alwaysOn = t === 'web_search';
          return (
            <label key={t}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors ${on ? 'bg-primary/10 border border-primary/30' : 'bg-surface-dim border border-transparent hover:border-dark-border/50'} ${alwaysOn ? 'opacity-70 cursor-not-allowed' : ''}`}>
              <input type="checkbox" checked={on} disabled={alwaysOn}
                onChange={() => !alwaysOn && toggle(t)} className="accent-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium text-text-primary">{TOOL_LABELS[t]}</p>
                <p className="text-xs text-text-muted">
                  {t === 'web_search' && 'Always enabled — required for basic functionality'}
                  {t === 'shell' && 'Execute shell commands on the agent microVM'}
                  {t === 'browser' && 'Headless browser for web scraping and form interaction'}
                  {t === 'file' && 'Read files from agent workspace'}
                  {t === 'file_write' && 'Create and write files in agent workspace'}
                  {t === 'code_execution' && 'Run Python/Node.js code in sandboxed environment'}
                </p>
              </div>
              {on ? <CheckCircle size={16} className="text-primary shrink-0" /> : <div className="w-4 h-4 rounded-full border border-dark-border shrink-0" />}
            </label>
          );
        })}
      </div>
      <div className="mt-3 rounded-xl bg-surface-dim px-3 py-2 flex items-center gap-2">
        <span className="text-xs text-text-muted">Effective profile:</span>
        <Badge color={profile === 'exec' ? 'warning' : profile === 'advanced' ? 'primary' : 'default'}>{profile}</Badge>
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SecurityCenter() {
  const [tab, setTab] = useState('runtimes');
  const { data: runtimesData, isLoading: rtLoading } = useSecurityRuntimes();
  const { data: positions = [] } = usePositions();
  const { data: modelConfig } = useModelConfig();
  const { data: infra } = useInfrastructure();

  const [soulTarget, setSoulTarget] = useState<any | null | undefined>(undefined); // undefined=closed, null=global
  const [toolsTarget, setToolsTarget] = useState<any | null>(null);

  const runtimes = runtimesData?.runtimes || [];
  const models = modelConfig?.availableModels || [];

  return (
    <div>
      <PageHeader
        title="Security Center"
        description="Configure agent runtimes, security policies, and AWS infrastructure for the entire platform"
      />

      <Tabs
        tabs={[
          { id: 'runtimes', label: 'Agent Runtimes' },
          { id: 'policies', label: 'Security Policies' },
          { id: 'infrastructure', label: 'Infrastructure' },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      <div className="mt-6">

        {/* ── Runtimes ── */}
        {tab === 'runtimes' && (
          <div className="space-y-6">
            <div className="rounded-xl bg-info/5 border border-info/20 px-4 py-3 text-xs text-info">
              Each Runtime has its own Docker image, IAM role, and lifecycle settings.
              Employees route to runtimes based on their position.
              Infrastructure-level isolation — IAM constraints cannot be bypassed by prompt injection.
            </div>

            {rtLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw size={24} className="animate-spin text-text-muted" />
              </div>
            ) : runtimes.length === 0 ? (
              <Card>
                <div className="text-center py-8 text-text-muted">
                  <Cpu size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No runtimes found</p>
                  <p className="text-xs mt-1">{runtimesData?.error || 'Check AWS credentials and region'}</p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {runtimes.map(rt => (
                  <RuntimeCard key={rt.id} rt={rt} models={models} />
                ))}
              </div>
            )}

            {/* Defense Layers */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Shield size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Defense in Depth — Access Control Layers</h3>
              </div>
              <div className="space-y-2">
                {[
                  { layer: 'L1', name: 'Prompt', color: 'warning', desc: 'SOUL.md rules ("never access finance data")', note: 'Prompt-level · Can be bypassed by injection', strong: false },
                  { layer: 'L2', name: 'Application', color: 'warning', desc: 'Skills manifest allowedRoles / blockedRoles', note: 'App-level · Code bug risk', strong: false },
                  { layer: 'L3', name: 'IAM Role', color: 'success', desc: 'Runtime execution role has no permission on target resource', note: 'Infrastructure · Cannot be bypassed', strong: true },
                  { layer: 'L4', name: 'Network', color: 'success', desc: 'VPC isolation between Runtimes', note: 'Infrastructure · Cannot be bypassed', strong: true },
                ].map(l => (
                  <div key={l.layer} className={`flex items-center gap-4 rounded-xl px-4 py-3 ${l.strong ? 'bg-success/5 border border-success/20' : 'bg-surface-dim border border-transparent'}`}>
                    <div className={`w-2 h-2 rounded-full ${l.strong ? 'bg-success' : 'bg-warning'} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${l.strong ? 'text-success' : 'text-text-primary'}`}>{l.layer} — {l.name}</span>
                      <span className="text-xs text-text-muted ml-2">{l.desc}</span>
                    </div>
                    <span className={`text-xs shrink-0 ${l.strong ? 'text-success' : 'text-text-muted'}`}>{l.note}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── Policies ── */}
        {tab === 'policies' && (
          <div className="space-y-6">
            {/* Global SOUL */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe2 size={18} className="text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">Global SOUL.md</h3>
                    <p className="text-xs text-text-muted">Applies to every agent as the base layer · S3: _shared/soul/global/SOUL.md</p>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => setSoulTarget(null)}>
                  <Edit3 size={13} /> Edit Global SOUL
                </Button>
              </div>
              <div className="rounded-xl bg-surface-dim px-4 py-3 text-xs text-text-muted">
                Layer 1 of 3: Global → Position → Personal. All employees inherit the global SOUL.
                Override per-position below for role-specific policies.
              </div>
            </Card>

            {/* Per-Position Policies */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Per-Position Security Policies</h3>
                  <p className="text-xs text-text-muted">Configure SOUL layer and tool permissions for each position</p>
                </div>
              </div>
              <div className="divide-y divide-dark-border/30">
                {positions.map(pos => (
                  <PositionPolicyRow key={pos.id} pos={pos}
                    onEditSoul={p => setSoulTarget(p)}
                    onEditTools={p => setToolsTarget(p)}
                  />
                ))}
              </div>
            </Card>

            {/* Always-Blocked */}
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <Lock size={16} className="text-danger" />
                <h3 className="text-sm font-semibold text-text-primary">Always Blocked — Hard Limits</h3>
              </div>
              <p className="text-xs text-text-muted mb-3">
                These tools are blocked in code for ALL roles. They cannot be unlocked via SOUL, permissions, or Admin approval.
              </p>
              <div className="flex flex-wrap gap-2">
                {['install_skill', 'load_extension', 'eval'].map(t => (
                  <div key={t} className="flex items-center gap-2 rounded-full bg-danger/10 border border-danger/20 px-3 py-1">
                    <Lock size={11} className="text-danger" />
                    <span className="text-xs font-mono text-danger">{t}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── Infrastructure ── */}
        {tab === 'infrastructure' && (
          <div className="space-y-6">
            {/* IAM Roles */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Key size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">IAM Roles</h3>
              </div>
              {!infra ? (
                <div className="flex items-center justify-center py-6"><RefreshCw size={18} className="animate-spin text-text-muted" /></div>
              ) : infra.iamRoles[0]?.error ? (
                <p className="text-xs text-danger">{infra.iamRoles[0].error}</p>
              ) : infra.iamRoles.length === 0 ? (
                <p className="text-xs text-text-muted">No matching IAM roles found</p>
              ) : (
                <div className="space-y-2">
                  {infra.iamRoles.map((r: any) => (
                    <div key={r.arn} className="flex items-center justify-between rounded-xl bg-surface-dim px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{r.name}</p>
                        <p className="text-xs text-text-muted font-mono truncate max-w-xs">{r.arn}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge color={r.name.includes('exec') ? 'danger' : 'info'}>
                          {r.name.includes('exec') ? 'Full Access' : 'Scoped'}
                        </Badge>
                        <a href={`https://console.aws.amazon.com/iam/home#/roles/${r.name}`} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="ghost"><ExternalLink size={12} /></Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* ECR Images */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Package size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">Docker Images (ECR)</h3>
              </div>
              {!infra ? (
                <div className="flex items-center justify-center py-6"><RefreshCw size={18} className="animate-spin text-text-muted" /></div>
              ) : infra.ecrImages[0]?.error ? (
                <p className="text-xs text-danger">{infra.ecrImages[0].error}</p>
              ) : infra.ecrImages.length === 0 ? (
                <p className="text-xs text-text-muted">No ECR images found in openclaw repositories</p>
              ) : (
                <div className="space-y-2">
                  {infra.ecrImages.map((img: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-surface-dim px-4 py-3">
                      <div>
                        <p className="text-sm font-mono text-text-primary">{img.repo}:{img.tag}</p>
                        <p className="text-xs text-text-muted">{img.digest} · {fmtBytes(img.sizeBytes)} · pushed {img.pushedAt?.slice(0, 10)}</p>
                      </div>
                      <Badge color="success">Available</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* VPC Security Groups */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Network size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-text-primary">VPC Security Groups</h3>
              </div>
              {!infra ? (
                <div className="flex items-center justify-center py-6"><RefreshCw size={18} className="animate-spin text-text-muted" /></div>
              ) : infra.securityGroups[0]?.error ? (
                <p className="text-xs text-danger">{infra.securityGroups[0].error}</p>
              ) : infra.securityGroups.length === 0 ? (
                <div className="text-center py-6">
                  <Network size={28} className="mx-auto mb-2 text-text-muted opacity-30" />
                  <p className="text-xs text-text-muted">No matching security groups found.</p>
                  <p className="text-xs text-text-muted mt-1">AgentCore PUBLIC mode runtimes do not use custom security groups.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {infra.securityGroups.map((sg: any) => (
                    <div key={sg.id} className="flex items-center justify-between rounded-xl bg-surface-dim px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{sg.name}</p>
                        <p className="text-xs text-text-muted">{sg.id} · {sg.vpcId} · {sg.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* SOUL Edit Modal */}
      {soulTarget !== undefined && (
        <SoulEditModal pos={soulTarget} onClose={() => setSoulTarget(undefined)} />
      )}

      {/* Tools Edit Modal */}
      {toolsTarget && (
        <ToolsEditModal pos={toolsTarget} onClose={() => setToolsTarget(null)} />
      )}
    </div>
  );
}
