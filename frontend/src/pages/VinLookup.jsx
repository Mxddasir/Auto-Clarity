import { useState } from 'react';
import { vehicleAPI } from '../api';
import { Search, Car, AlertCircle } from 'lucide-react';

export default function VinLookup() {
  const [mode,    setMode]    = useState('reg');
  const [input,   setInput]   = useState('');
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const r = mode === 'reg'
        ? await vehicleAPI.lookupReg(input)
        : await vehicleAPI.decodeVin(input);
      setResult(r.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Lookup failed. Please check your input.');
    } finally { setLoading(false); }
  };

  const switchMode = (m) => {
    setMode(m); setInput(''); setResult(null); setError('');
  };

  const regFields = result ? [
    ['Make',         result.make],
    ['Colour',       result.colour],
    ['Year',         result.year],
    ['Fuel Type',    result.fuelType],
    ['Engine',       result.engineCapacity ? `${result.engineCapacity}cc` : null],
    ['MOT Status',   result.motStatus],
    ['MOT Expiry',   result.motExpiry],
    ['Tax Status',   result.taxStatus],
    ['Tax Due',      result.taxDueDate],
    ['CO2',          result.co2Emissions ? `${result.co2Emissions}g/km` : null],
  ].filter(([,v]) => v) : [];

  const vinFields = result ? [
    ['Make',         result.make],
    ['Model',        result.model],
    ['Year',         result.year],
    ['Trim',         result.trim],
    ['Engine',       result.engine],
    ['Cylinders',    result.cylinders],
    ['Fuel Type',    result.fuelType],
    ['Body',         result.bodyClass],
    ['Drive',        result.driveType],
    ['Transmission', result.transmission],
    ['Built In',     result.country],
  ].filter(([,v]) => v) : [];

  const fields = mode === 'reg' ? regFields : vinFields;

  return (
    <div className="page container" style={{ maxWidth:600 }}>
      <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.8rem', marginBottom:'0.4rem' }}>
        Vehicle Lookup
      </h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'2rem' }}>
        Check UK reg plate details via DVLA, or decode any VIN number
      </p>

      {/* Mode toggle */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
        {[['reg','🇬🇧 UK Reg Plate'],['vin','VIN Number']].map(([m, label]) => (
          <button key={m} className={`btn ${mode === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => switchMode(m)}>
            {label}
          </button>
        ))}
      </div>

      {/* VIN warning */}
      {mode === 'vin' && (
        <div className="info-box" style={{ marginBottom:'1.25rem' }}>
          ⚠️ VIN lookup uses your Vehicle Databases API quota.
          You have <strong style={{ color:'var(--orange)' }}>15 free decodes</strong> — use them wisely.
          For UK vehicles, <strong>reg plate lookup</strong> is recommended instead.
        </div>
      )}

      {/* Search */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <form onSubmit={handleSubmit} style={{ display:'flex', gap:'0.5rem' }}>
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            placeholder={mode === 'reg' ? 'e.g. AB12 CDE' : 'e.g. WBA3A5C50CF256551'}
            style={{ letterSpacing: mode === 'reg' ? '2px' : '0.5px', fontWeight:600 }}
            required
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ flexShrink:0 }}
          >
            {loading ? <span className="spinner" style={{width:18,height:18}} /> : <Search size={18} />}
          </button>
        </form>

        {error && (
          <div className="error-box" style={{ marginTop:'0.875rem' }}>
            <AlertCircle size={15} style={{ flexShrink:0, marginTop:1 }} />
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="card fade-in">
          <div style={{ display:'flex', gap:'0.875rem', alignItems:'center', marginBottom:'1.25rem', paddingBottom:'1.25rem', borderBottom:'1px solid var(--border)' }}>
            <div style={{ width:48, height:48, background:'var(--orange)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Car size={24} color="#000" />
            </div>
            <div>
              <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.5rem' }}>
                {mode === 'reg' ? result.make : `${result.make} ${result.model}`}
              </div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.82rem' }}>
                {mode === 'reg' ? result.reg : result.vin} • Source: {result.source}
              </div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            {fields.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.25rem' }}>
                  {label}
                </div>
                <div style={{ fontWeight:500, fontSize:'0.925rem' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
