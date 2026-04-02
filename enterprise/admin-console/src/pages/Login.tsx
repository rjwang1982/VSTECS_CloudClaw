import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle } from 'lucide-react';
import VSTECSLogo from '../components/VSTECSLogo';

const DEMO_ACCOUNTS = [
  { id: 'emp-z3', name: 'Zhang San', role: 'Admin', dept: 'Engineering', desc: 'Full platform access' },
  { id: 'emp-lin', name: 'Lin Xiaoyu', role: 'Manager', dept: 'Product', desc: 'Product department view' },
  { id: 'emp-mike', name: 'Mike Johnson', role: 'Manager', dept: 'Sales', desc: 'Sales department view' },
  { id: 'emp-w5', name: 'Wang Wu', role: 'Employee', dept: 'Engineering', desc: 'Portal: chat with SDE Agent' },
  { id: 'emp-carol', name: 'Carol Zhang', role: 'Employee', dept: 'Finance', desc: 'Portal: chat with Finance Agent' },
  { id: 'emp-emma', name: 'Emma Chen', role: 'Employee', dept: 'Customer Success', desc: 'Portal: chat with CSM Agent' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (id: string, pwd?: string) => {
    setLoading(true);
    setError('');
    try {
      await login(id, pwd || password);
      const saved = localStorage.getItem('openclaw_token');
      if (saved) {
        const payload = JSON.parse(atob(saved.split('.')[1]));
        if (payload.role === 'employee') navigate('/portal');
        else navigate('/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4"><VSTECSLogo variant="vertical" size={56} /></div>
          <h1 className="text-2xl font-bold text-text-primary">VSTECS 智能云 Claw 助手</h1>
          <p className="text-sm text-text-muted mt-1">引領數字化亞洲 · Enabling Digital Asia</p>
        </div>

        {/* Login Form */}
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Sign In</h2>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 mb-4">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted mb-1">Employee ID</label>
              <input
                type="text" value={empId} onChange={e => setEmpId(e.target.value)}
                placeholder="emp-z3 or EMP-001"
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-text-muted mb-1">Password</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && empId && password && handleLogin(empId)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={() => empId && password && handleLogin(empId)}
              disabled={!empId || !password || loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <LogIn size={16} /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Copyright & Legal */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-xs text-text-muted">
            © 2025 佳杰科技（上海）有限公司. All rights reserved.
          </p>
          <p className="text-xs text-text-muted">
            <a href="https://www.vstecs.com/" target="_blank" rel="noopener noreferrer" className="text-primary-light hover:underline">vstecs.com</a>
            {' · '}
            <a href="/privacy" className="text-primary-light hover:underline">隐私政策</a>
            {' · '}
            <a href="/terms" className="text-primary-light hover:underline">服务条款</a>
          </p>
        </div>
      </div>
    </div>
  );
}
