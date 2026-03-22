import { useState, useEffect } from 'react';
import { Send, User, Bot, Shield, Eye, Terminal, Loader } from 'lucide-react';
import { Card, Badge, Button, PageHeader, Select } from '../components/ui';
import { usePlaygroundProfiles, usePlaygroundSend } from '../hooks/useApi';

interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string; timestamp: string; }

const TENANT_OPTIONS = [
  { label: 'Sarah Chen — Intern (WhatsApp)', value: 'wa__intern_sarah' },
  { label: 'Alex Wang — Senior Engineer (Telegram)', value: 'tg__engineer_alex' },
  { label: 'Jordan Lee — IT Admin (Discord)', value: 'dc__admin_jordan' },
  { label: 'Carol Zhang — Finance Analyst (Slack)', value: 'sl__finance_carol' },
];

export default function Playground() {
  const { data: profiles } = usePlaygroundProfiles();
  const sendMut = usePlaygroundSend();
  const [tenantId, setTenantId] = useState(TENANT_OPTIONS[0].value);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [lastPlanE, setLastPlanE] = useState('No messages processed yet');
  const [mode, setMode] = useState<'simulate' | 'live'>('simulate');

  const profile = profiles?.[tenantId] || { role: 'loading', tools: [], planA: '', planE: '' };
  const profileLoaded = !!profiles?.[tenantId];

  useEffect(() => {
    if (!profileLoaded) return;
    setMessages([{ role: 'system', content: `🔒 Tenant context loaded: ${profile.role} role, ${profile.tools.length} tools`, timestamp: '' }]);
    setLastPlanE('No messages processed yet');
  }, [tenantId, profileLoaded]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    const now = new Date().toLocaleTimeString();
    const msg = inputValue.trim();
    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: now };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    sendMut.mutate({ tenant_id: tenantId, message: msg, mode }, {
      onSuccess: (data) => {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.response, timestamp: new Date().toLocaleTimeString() };
        setMessages(prev => [...prev, assistantMsg]);
        setLastPlanE(data.plan_e);
      },
      onError: (err) => {
        const errMsg = mode === 'live'
          ? '⏳ Agent is warming up (cold start ~25s). Retrying...'
          : '⚠️ Error communicating with agent';
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg, timestamp: new Date().toLocaleTimeString() }]);
        // Auto-retry once for live mode (cold start)
        if (mode === 'live') {
          setTimeout(() => {
            sendMut.mutate({ tenant_id: tenantId, message: msg, mode }, {
              onSuccess: (data) => {
                const retryMsg: ChatMessage = { role: 'assistant', content: data.response, timestamp: new Date().toLocaleTimeString() };
                setMessages(prev => [...prev, retryMsg]);
                setLastPlanE(data.plan_e);
              },
              onError: () => {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Agent is still starting up. Please try again in ~30 seconds.', timestamp: new Date().toLocaleTimeString() }]);
              },
            });
          }, 3000);
        }
      },
    });
  };

  return (
    <div>
      <PageHeader title="Agent Playground" description="Test agent behavior with different tenant contexts and permission profiles" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 space-y-3">
            <Select label="Tenant Context" value={tenantId} onChange={v => setTenantId(v)} options={TENANT_OPTIONS} />
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted">Mode:</span>
              <button onClick={() => setMode('simulate')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'simulate' ? 'bg-primary/10 text-primary-light' : 'text-text-muted hover:bg-dark-hover'}`}>Simulate</button>
              <button onClick={() => setMode('live')} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'live' ? 'bg-success/10 text-success' : 'text-text-muted hover:bg-dark-hover'}`}>🔴 Live (AgentCore)</button>
            </div>
          </div>

          <div className="min-h-[350px] max-h-[450px] overflow-y-auto rounded-lg bg-dark-bg border border-dark-border p-4 mb-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                  msg.role === 'user' ? 'bg-primary/15 text-text-primary'
                  : msg.role === 'system' ? 'bg-dark-hover text-text-muted text-xs'
                  : 'bg-dark-card border border-dark-border text-text-primary'
                }`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === 'system' ? <Terminal size={12} /> : msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    <span className="text-xs text-text-muted">
                      {msg.role === 'system' ? 'System' : msg.role === 'user' ? 'You' : 'Agent'}
                      {msg.timestamp && ` · ${msg.timestamp}`}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {sendMut.isPending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-dark-card border border-dark-border px-3 py-2">
                  <Loader size={14} className="animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !sendMut.isPending) handleSend(); }}
              placeholder="Type a message (try 'run shell command')..."
              className="flex-1 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none" />
            <Button variant="primary" onClick={handleSend} disabled={sendMut.isPending}><Send size={16} /></Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Eye size={18} className="text-text-muted" />
            <h3 className="text-lg font-semibold text-text-primary">Pipeline Inspector</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-1">Tenant ID</p>
              <code className="text-sm text-primary-light bg-primary/5 px-2 py-1 rounded">{tenantId}</code>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">Permission Profile</p>
              <div className="flex flex-wrap gap-1.5">
                <Badge color="primary">{profile.role}</Badge>
                {profile.tools.map(t => <Badge key={t} color="success">{t}</Badge>)}
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">Plan A — Pre-Execution</p>
              <pre className="rounded-lg bg-dark-bg border border-dark-border p-3 text-xs text-text-secondary whitespace-pre-wrap font-mono">{profile.planA || 'Loading...'}</pre>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">Plan E — Post-Execution</p>
              <pre className="rounded-lg bg-dark-bg border border-dark-border p-3 text-xs text-text-secondary whitespace-pre-wrap font-mono">{profile.planE || 'Loading...'}</pre>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-1">Last Plan E Result</p>
              <div className={`rounded-lg px-3 py-2 text-sm ${
                lastPlanE.includes('PASS') ? 'bg-success/10 text-success' : lastPlanE.includes('BLOCKED') ? 'bg-danger/10 text-danger' : 'bg-dark-bg text-text-muted'
              }`}>{lastPlanE}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
