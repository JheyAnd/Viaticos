import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ArrowLeft, Users, Shield, User, AlertCircle, Loader2, Award, CheckCircle, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';

const UsuariosPage = () => {
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  // Cargar lista de usuarios
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('No tiene permisos para ver esta sección.');
        }
        throw new Error('Error al cargar la lista de usuarios.');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Redirigir si no es superadmin
    if (currentUser && currentUser.rol !== 'superadmin') {
      alert('Sección reservada únicamente para el rol Superadmin.');
      navigate('/dashboard');
      return;
    }
    fetchUsers();
  }, [token, currentUser]);

  // Cambiar rol de usuario
  const handleRoleChange = async (userId, newRole) => {
    setError('');
    setSuccessMsg('');
    setUpdatingUserId(userId);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Fallo al actualizar el rol.');
      }

      // Actualizar estado local
      setUsers(users.map(u => u.id === userId ? { ...u, rol: newRole } : u));
      setSuccessMsg(`Rol de ${data.nombre} actualizado a ${newRole} con éxito.`);
      
      // Limpiar mensaje tras unos segundos
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (userId, nombre) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar al usuario ${nombre}? Esta acción eliminará permanentemente al usuario y todas sus legalizaciones/gastos asociados.`)) {
      return;
    }
    
    setError('');
    setSuccessMsg('');
    setDeletingUserId(userId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Fallo al eliminar el usuario.');
      }
      
      setUsers(users.filter(u => u.id !== userId));
      setSuccessMsg(`Usuario ${nombre} eliminado con éxito.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Encabezado y Retorno */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Gestión de Usuarios</h2>
            <p className="text-sm text-slate-500 mt-0.5">Asigna roles y administra privilegios del ecosistema.</p>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Listado de Usuarios */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
              <span>Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center">
              <Users className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="font-semibold text-slate-400">No se encontraron usuarios</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/30 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    <th className="py-4 px-6">Usuario</th>
                    <th className="py-4 px-6">Correo Electrónico</th>
                    <th className="py-4 px-6">Fecha Registro</th>
                    <th className="py-4 px-6">Rol Actual</th>
                    <th className="py-4 px-6 text-center">Cambiar Rol</th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-900/20 transition-all duration-150">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center justify-center font-bold text-slate-300">
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="font-medium text-slate-200">
                              {u.nombre} {isSelf && <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full ml-2">Tú</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          {u.correo}
                        </td>
                        <td className="py-4 px-6 text-slate-400">
                          {new Date(u.fecha_creacion).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.rol === 'superadmin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            u.rol === 'admin' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-slate-800'
                          }`}>
                            {u.rol === 'superadmin' ? <Shield className="w-3.5 h-3.5" /> : u.rol === 'admin' ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                            {u.rol}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <select
                              value={u.rol}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={isSelf || updatingUserId === u.id || currentUser?.rol !== 'superadmin'}
                              className="px-2 py-1.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg text-xs text-slate-300 outline-none disabled:opacity-50 transition-all duration-200 cursor-pointer"
                            >
                              <option value="colaborador">Colaborador</option>
                              <option value="admin">Administrador (Admin)</option>
                              <option value="superadmin">Super Administrador (Super)</option>
                            </select>
                            {updatingUserId === u.id && (
                              <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDeleteUser(u.id, u.nombre)}
                              disabled={isSelf || deletingUserId === u.id}
                              className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg disabled:opacity-40 transition-all duration-200"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {deletingUserId === u.id && (
                              <Loader2 className="w-4 h-4 text-red-500 animate-spin shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UsuariosPage;
