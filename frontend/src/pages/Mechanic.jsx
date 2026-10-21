import { useState } from 'react';
import { mechanicAPI } from '../api';
import { MapPin, Star, Navigation, AlertCircle, RefreshCw } from 'lucide-react';

export default function Mechanic() {
  const [mechanics, setMechanics] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [located,   setLocated]   = useState(false);
  const [radius,    setRadius]    = useState(5000);
  const [status,    setStatus]    = useState('');

  const search = async (lat, lng) => {
    setLoading(true);
    setError('');
    setStatus(`📍 Location found: ${lat.toFixed(4)}, ${lng.toFixed(4)} — searching...`);

    try {
      console.log('Searching at:', lat, lng, 'radius:', radius);
      const r = await mechanicAPI.findNearby(lat, lng, radius);
      console.log('Results:', r.data);

      setMechanics(r.data.mechanics || []);
      setLocated(true);
      setStatus('');
    } catch (err) {
      console.error('Full error:', err);
      const msg = err.response?.data?.details
        || err.response?.data?.error
        || err.message
        || 'Unknown error';
      setError(`Search failed: ${msg}`);
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  const locate = () => {
    setError('');
    setStatus('Requesting location...');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setStatus('');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log('Got location:', latitude, longitude);
        search(latitude, longitude);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setStatus('');
        switch (err.code) {
          case 1:
            setError('Location access denied. Please allow location access in your browser and try again.');
            break;
          case 2:
            setError('Location unavailable. Please check your device location settings.');
            break;
          case 3:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('Could not get your location. Please try again.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const directions = (m) => {
    if (m.mapsUrl) {
      window.open(m.mapsUrl, '_blank');
    } else if (m.location?.lat && m.location?.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${m.location.lat},${m.location.lng}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/${encodeURIComponent(m.name + ' ' + m.address)}`,
        '_blank'
      );
    }
  };

  return (
    <div className="page container" style={{ maxWidth: 700 }}>
      <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.8rem', marginBottom:'0.4rem' }}>
        Find a Mechanic
      </h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'2rem' }}>
        Locate trusted garages and repair shops near you
      </p>

      {!located ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem 2rem' }}>
          <div style={{
            width:64, height:64, background:'var(--orange-glow)',
            borderRadius:'50%', display:'flex', alignItems:'center',
            justifyContent:'center', margin:'0 auto 1.5rem'
          }}>
            <MapPin size={30} color="var(--orange)" />
          </div>

          <h2 style={{ fontFamily:'Rajdhani', fontWeight:600, fontSize:'1.4rem', marginBottom:'0.75rem' }}>
            Find Garages Near You
          </h2>
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'1.5rem' }}>
            We'll use your location to find the nearest car repair shops
          </p>

          {/* Radius selector */}
          <div style={{ marginBottom:'1.5rem' }}>
            <label className="label" style={{ textAlign:'left', display:'block', maxWidth:200, margin:'0 auto 0.4rem' }}>
              Search Radius
            </label>
            <select
              className="input"
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ maxWidth:200 }}
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
          </div>

          {/* Status message */}
          {status && (
            <div style={{
              background:'var(--bg-elevated)', border:'1px solid var(--border)',
              borderRadius:'8px', padding:'0.75rem 1rem',
              color:'var(--text-muted)', fontSize:'0.875rem',
              marginBottom:'1rem', maxWidth:360, margin:'0 auto 1rem'
            }}>
              {status}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-box" style={{
              marginBottom:'1rem', textAlign:'left',
              maxWidth:400, margin:'0 auto 1rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink:0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={locate}
            disabled={loading}
            style={{ fontSize:'1rem', padding:'0.875rem 2rem' }}
          >
            {loading
              ? <><span className="spinner" style={{width:18,height:18}} /> {status || 'Searching...'}</>
              : <><Navigation size={18} /> Use My Location</>
            }
          </button>

          {/* Manual fallback */}
          <p style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'1.25rem' }}>
            Not working?{' '}
            <a
              href="https://www.google.com/maps/search/car+garage+near+me"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color:'var(--orange)' }}
            >
              Search on Google Maps instead
            </a>
          </p>
        </div>

      ) : (
        <div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>
              {mechanics.length} garage{mechanics.length !== 1 ? 's' : ''} found nearby
            </p>
            <button
              className="btn btn-ghost"
              onClick={() => { setLocated(false); setMechanics([]); setError(''); }}
              style={{ fontSize:'0.8rem', padding:'0.4rem 0.75rem' }}
            >
              <RefreshCw size={14} /> Search Again
            </button>
          </div>

          {mechanics.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'2.5rem' }}>
              <p style={{ color:'var(--text-muted)', marginBottom:'1rem' }}>
                No garages found in this area.
              </p>
              <button
                className="btn btn-outline"
                onClick={() => { setLocated(false); setRadius(20000); }}
              >
                Try Larger Radius
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {mechanics.map(m => (
                <div key={m.id} className="card fade-in">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem', marginBottom:'0.875rem' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'1rem' }}>{m.name}</div>
                      <div style={{ color:'var(--text-muted)', fontSize:'0.82rem', marginTop:'0.25rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
                        <MapPin size={12} /> {m.address}
                      </div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      {m.rating && (
                        <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', justifyContent:'flex-end' }}>
                          <Star size={13} color="#eab308" fill="#eab308" />
                          <span style={{ fontWeight:600 }}>{m.rating}</span>
                          <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>({m.totalRatings})</span>
                        </div>
                      )}
                      {m.openNow !== undefined && (
                        <div style={{ fontSize:'0.75rem', color: m.openNow ? 'var(--green)' : 'var(--red)', marginTop:'0.25rem' }}>
                          {m.openNow ? '● Open now' : '● Closed'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => directions(m)}
                      style={{ flex:1, justifyContent:'center', fontSize:'0.875rem', padding:'0.6rem' }}
                    >
                      <Navigation size={14} /> Directions
                    </button>
                    <a
                      href={`https://www.google.com/maps/search/${encodeURIComponent(m.name + ' ' + m.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ flex:1, justifyContent:'center', fontSize:'0.875rem', padding:'0.6rem' }}
                    >
                      View on Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}