import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SSOLoginPage from "./pages/SSOLoginPage";
import DashboardPage from "./pages/DashboardPage";
import NuevaLegalizacionPage from "./pages/NuevaLegalizacionPage";
import UsuariosPage from "./pages/UsuariosPage";
import ReportePage from "./pages/ReportePage";
import { Loader2 } from "lucide-react";

const Spinner = () => (
  <div style={{ minHeight:"100vh", background:"#ffffff", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#475569" }}>
    <Loader2 style={{ width:28, height:28, marginBottom:10, animation:"spin 1s linear infinite" }} />
    <span style={{ fontSize:13 }}>Cargando...</span>
    <style>{"@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}"}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const SuperadminRoute = ({ children }) => {
  const { token, user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!token) return <Navigate to="/login" replace />;
  if (user && user.rol !== "superadmin") return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<PublicRoute><SSOLoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/nueva" element={<ProtectedRoute><NuevaLegalizacionPage /></ProtectedRoute>} />
          <Route path="/reporte" element={<ProtectedRoute><ReportePage /></ProtectedRoute>} />
          <Route path="/usuarios" element={<SuperadminRoute><UsuariosPage /></SuperadminRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;