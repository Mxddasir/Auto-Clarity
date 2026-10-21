import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8)
      return setError('Password must be at least 8 characters');
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            color: 'var(--orange)', fontFamily: 'Rajdhani', fontWeight: 700, fontSize: '2rem'
          }}>
            <Car size={32} /> Auto Clarity
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Create your free account
          </p>
        </div>

        <div className="card slide-up">
          <h2 style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            Create Account
          </h2>

          {error && (
            <div className="error-box" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              ['name',     'text',     'Full Name', 'John Smith'],
              ['email',    'email',    'Email',     'your@email.com'],
              ['password', 'password', 'Password',  'Min 8 characters']
            ].map(([field, type, label, placeholder]) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input
                  className="input" type={type}
                  value={form[field]} onChange={set(field)}
                  placeholder={placeholder} required
                />
              </div>
            ))}

            <button
              type="submit" className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}
            >
              {loading
                ? <><span className="spinner" style={{ width:18, height:18 }} /> Creating account...</>
                : 'Create Account'
              }
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--orange)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
