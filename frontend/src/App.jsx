import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar     from './components/Navbar';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Dashboard  from './pages/Dashboard';
import Diagnose   from './pages/Diagnose';
import History    from './pages/History';
import Mechanic   from './pages/Mechanic';
import VinLookup  from './pages/VinLookup';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>
      <div className="spinner" style={{ width:32, height:32 }} />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/"         element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
          <Route path="/diagnose" element={<PrivateRoute><Layout><Diagnose /></Layout></PrivateRoute>} />
          <Route path="/history"  element={<PrivateRoute><Layout><History /></Layout></PrivateRoute>} />
          <Route path="/mechanic" element={<PrivateRoute><Layout><Mechanic /></Layout></PrivateRoute>} />
          <Route path="/vin"      element={<PrivateRoute><Layout><VinLookup /></Layout></PrivateRoute>} />
          <Route path="*"         element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
