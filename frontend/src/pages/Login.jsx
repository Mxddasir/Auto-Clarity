import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your details.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(255,107,0,0.07) 0%, transparent 65%)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            color: 'var(--orange)', fontFamily: 'Rajdhani',
            fontWeight: 700, fontSize: '2rem'
          }}>
            <Car size={32} /> Auto Clarity
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            AI-powered OBD diagnostics for UK drivers
          </p>
        </div>

        <div className="card slide-up">
          <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Sign In
          </h2>

          {error && (
            <div className="error-box" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="label">Email</label>
              <input
                className="input" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
              />
            </div>
            <button
              type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {loading
                ? <><span className="spinner" style={{ width:18, height:18 }} /> Signing in...</>
                : 'Sign In'
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--orange)', fontWeight: 500 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
