import { useState, useEffect } from 'react';
import { historyAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, Zap } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    historyAPI.getAll()
      .then(r => setHistory(r.data.diagnostics))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this diagnostic record?')) return;
    await historyAPI.delete(id);
    setHistory(h => h.filter(x => x.id !== id));
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );

  return (
    <div className="page container" style={{ maxWidth:700 }}>
      <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.8rem', marginBottom:'0.4rem' }}>
        Diagnostic History
      </h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'2rem' }}>
        {history.length} saved {history.length === 1 ? 'diagnosis' : 'diagnoses'}
      </p>

      {history.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3.5rem 2rem' }}>
          <Clock size={42} color="var(--text-dim)" style={{ marginBottom:'1rem' }} />
          <p style={{ color:'var(--text-muted)', marginBottom:'1.25rem' }}>
            No diagnostic history yet
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/diagnose')}>
            <Zap size={16} /> Run First Diagnosis
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {history.map(d => (
            <div key={d.id} className="card fade-in" style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              {/* Code badge */}
              <div style={{
                width:52, height:52, background:'var(--orange-glow)',
                border:'1px solid var(--orange)', borderRadius:10,
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0
              }}>
                <span style={{ fontFamily:'Rajdhani', fontWeight:700, color:'var(--orange)', fontSize:'0.78rem', textAlign:'center' }}>
                  {d.obdCode}
                </span>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:500, fontSize:'0.95rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {d.codeTitle}
                </div>
                <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'0.2rem' }}>
                  {d.vehicleReg && <span style={{ marginRight:'0.75rem' }}>🚗 {d.vehicleReg}</span>}
                  {new Date(d.createdAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                </div>
                {d.diagnosis?.rootCause?.name && (
                  <div style={{ color:'var(--orange)', fontSize:'0.8rem', marginTop:'0.2rem' }}>
                    → {d.diagnosis.rootCause.name}
                  </div>
                )}
              </div>

              {/* Right side */}
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.4rem', flexShrink:0 }}>
                <span className={`badge badge-${d.severity || 'unknown'}`}>
                  {d.severity || 'N/A'}
                </span>
                <button
                  onClick={() => handleDelete(d.id)}
                  style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-dim)', padding:'0.25rem' }}
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
