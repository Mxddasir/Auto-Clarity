import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Clock, MapPin, Search, LogOut, Car } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();

  const links = [
    { to: '/',         icon: Zap,    label: 'Diagnose'  },
    { to: '/history',  icon: Clock,  label: 'History'   },
    { to: '/vin',      icon: Search, label: 'VIN / Reg' },
    { to: '/mechanic', icon: MapPin, label: 'Mechanics' }
  ];

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: '60px'
      }}>

        {/* Logo */}
        <Link to="/" style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          color: 'var(--orange)', fontFamily: 'Rajdhani',
          fontWeight: 700, fontSize: '1.4rem', textDecoration: 'none'
        }}>
          <Car size={22} />
          Auto Clarity
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {links.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.45rem 0.75rem', borderRadius: '8px',
                color: active ? 'var(--orange)' : 'var(--text-muted)',
                background: active ? 'var(--orange-glow)' : 'transparent',
                fontSize: '0.85rem', fontWeight: 500,
                transition: 'all 0.2s', textDecoration: 'none'
              }}>
                <Icon size={16} />
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="btn btn-ghost"
            style={{ padding: '0.4rem 0.75rem', marginLeft: '0.5rem' }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
