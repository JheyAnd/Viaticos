import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, History, PlusCircle, User, Award, Users } from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generar navItems dinámicamente según el rol
  const navItems = [];
  
  if (user?.rol === 'superadmin' || user?.rol === 'admin') {
    navItems.push({
      label: 'Control de Viáticos',
      icon: <History className="w-5 h-5" />,
      path: '/dashboard'
    });
  } else {
    // colaborador por defecto
    navItems.push(
      {
        label: 'Historial',
        icon: <History className="w-5 h-5" />,
        path: '/dashboard'
      },
      {
        label: 'Nueva Legalización',
        icon: <PlusCircle className="w-5 h-5" />,
        path: '/nueva'
      }
    );
  }

  if (user?.rol === 'superadmin') {
    navItems.push({
      label: 'Gestión de Usuarios',
      icon: <Users className="w-5 h-5" />,
      path: '/usuarios'
    });
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 h-screen sticky top-0 overflow-y-auto border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
            <Award className="w-6 h-6 text-blue-500 animate-pulse" />
            <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              VIÁTICOS PCM
            </span>
          </div>

          {/* Menú de Navegación */}
          <nav className="mt-6 px-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Perfil del Usuario y Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
              {user?.nombre?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-200">{user?.nombre}</p>
              <p className="text-xs truncate text-slate-500">{user?.correo}</p>
              <span className={`inline-block mt-1 text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                user?.rol === 'superadmin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                user?.rol === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {user?.rol || 'colaborador'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* NAVBAR */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-8">
          <h1 className="text-sm font-semibold text-slate-400 tracking-wide uppercase">
            {location.pathname === '/nueva' ? 'Nueva Legalización de Gastos' :
             location.pathname === '/usuarios' ? 'Gestión de Usuarios y Roles' :
             (user?.rol === 'superadmin' || user?.rol === 'admin') ? 'Control y Aprobación de Viáticos' : 'Historial de Legalizaciones'}
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-500 hidden sm:block">
              Servicio de Identidad: <span className="text-slate-400 font-medium">Pandora SSO (Local)</span>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

