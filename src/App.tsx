
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AttendanceForm from './pages/AttendanceForm';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';

const RootRedirect = () => {
  const { profile, loading } = useAuth();
  
  if (loading) return <div>Cargando...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  
  if (profile.role === 'preceptor') {
    return <Navigate to="/asistencia" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<RootRedirect />} />
            
            <Route element={<ProtectedRoute allowedRoles={['admin', 'preceptor']} />}>
              <Route path="/asistencia" element={<AttendanceForm />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin', 'preceptor']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminPanel />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
