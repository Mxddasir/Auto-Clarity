import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Search, MapPin, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const cards = [
    {
      icon: Zap, primary: true,
      title: 'Diagnose OBD Code',
      desc:  'Enter your fault code and let AI guide you to the root cause step by step',
      cta:   'Start Diagnosis',
      to:    '/diagnose'
    },
    {
      icon: Search,
      title: 'VIN & Reg Lookup',
      desc:  'Decode a VIN number or check UK registration plate vehicle details instantly',
      cta:   'Look Up Vehicle',
      to:    '/vin'
    },
    {
      icon: MapPin,
      title: 'Find a Mechanic',
      desc:  'Locate trusted garages near you when a job needs a professional',
      cta:   'Find Mechanics',
      to:    '/mechanic'
    },
    {
      icon: Clock,
      title: 'Diagnostic History',
      desc:  'Review all your past diagnoses and saved results in one place',
      cta:   'View History',
      to:    '/history'
    }
  ];

  return (
    <div className="page container">
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          fontFamily: 'Rajdhani', fontWeight: 700,
          fontSize: 'clamp(1.6rem, 5vw, 2.4rem)'
        }}>
          Welcome back,{' '}
          <span style={{ color: 'var(--orange)' }}>{firstName}</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          What would you like to do today?
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        {cards.map(({ icon: Icon, title, desc, cta, to, primary }) => (
          <div
            key={title}
            className="card fade-in"
            onClick={() => navigate(to)}
            style={{
              cursor: 'pointer',
              borderColor: primary ? 'var(--orange)' : 'var(--border)'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = primary ? 'var(--orange)' : 'var(--border)'}
          >
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: primary ? 'var(--orange)' : 'var(--orange-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.1rem'
            }}>
              <Icon size={22} color={primary ? '#000' : 'var(--orange)'} />
            </div>

            <h3 style={{ fontFamily: 'Rajdhani', fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.5rem' }}>
              {title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '1.25rem' }}>
              {desc}
            </p>
            <button
              className={`btn ${primary ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.875rem', padding: '0.55rem 1.1rem' }}
              onClick={e => { e.stopPropagation(); navigate(to); }}
            >
              {cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
