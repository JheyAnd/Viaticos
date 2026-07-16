import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { FileText, Plus, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';

// Subcomponentes
import StatsSummary from '../components/dashboard/StatsSummary';
import ColaboradoresTable from '../components/dashboard/ColaboradoresTable';
import LegalizacionesTable from '../components/dashboard/LegalizacionesTable';
import DetailModal from '../components/dashboard/DetailModal';
import ColaboradorModal from '../components/dashboard/ColaboradorModal';

const DashboardPage = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [legalizaciones, setLegalizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Detalle Modal state
  const [selectedLeg, setSelectedLeg] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Estados para agrupación por colaborador y acordeón de desglose
  const [selectedColab, setSelectedColab] = useState(null);
  const [loadedDetails, setLoadedDetails] = useState({});
  const [expandingId, setExpandingId] = useState(null);
  const [expandedLegIds, setExpandedLegIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar historial
  const fetchHistorial = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar historial.');
      }

      const data = await response.json();
      setLegalizaciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHistorial();
    }
  }, [token]);

  // Cargar detalles de una legalización para modal
  const handleVerDetalles = async (id) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo cargar el detalle.');
      }

      const data = await response.json();
      setSelectedLeg(data);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Eliminar legalización
  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta legalización? Se borrarán todos sus gastos.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la legalización.');
      }

      // Filtrar de la lista principal
      setLegalizaciones(prev => prev.filter(item => item.id !== id));

      // Si hay un colaborador seleccionado en el modal, actualizar el estado de su lista
      if (selectedColab) {
        setSelectedColab(prev => {
          if (!prev) return null;
          const newList = prev.legalizacionesList.filter(item => item.id !== id);
          if (newList.length === 0) {
            return null; // Cerrar modal si ya no hay legalizaciones
          }
          const totalAnticipo = newList.reduce((sum, item) => sum + parseFloat(item.anticipo || 0), 0);
          const totalGastado = newList.reduce((sum, item) => sum + parseFloat(item.total_gastado || 0), 0);
          const totalSaldo = totalAnticipo - totalGastado;
          return {
            ...prev,
            legalizacionesList: newList,
            anticipo: totalAnticipo,
            total_gastado: totalGastado,
            saldo: totalSaldo
          };
        });
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Aprobar o Rechazar legalización (Superadmin / Admin)
  const handleUpdateEstado = async (id, nuevoEstado) => {
    const accion = nuevoEstado === 'Finalizado' ? 'APROBAR y FINALIZAR' : 'RECHAZAR y devolver a BORRADOR';
    const confirmacion = window.confirm(`¿Está seguro de que desea ${accion} esta legalización?`);
    if (!confirmacion) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al actualizar el estado de la legalización.');
      }

      const updatedLeg = await response.json();
      
      // Actualizar en el estado local
      setLegalizaciones(legalizaciones.map(item => item.id === id ? updatedLeg : item));
      
      // Actualizar en el cache de detalles
      setLoadedDetails(prev => {
        if (prev[id]) {
          return { ...prev, [id]: { ...prev[id], estado: nuevoEstado } };
        }
        return prev;
      });

      // Si hay un colaborador seleccionado, actualizar el estado de su lista
      if (selectedColab) {
        setSelectedColab(prev => ({
          ...prev,
          legalizacionesList: prev.legalizacionesList.map(item => 
            item.id === id ? { ...item, estado: nuevoEstado } : item
          )
        }));
      }

      setSelectedLeg(null);
      alert(`La legalización ha sido marcada como '${nuevoEstado}' con éxito.`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Formatear dinero
  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  // Cargar detalle de una legalización de forma diferida (para el acordeón)
  const fetchLegalizacionDetail = async (id) => {
    if (loadedDetails[id]) return;
    setExpandingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('No se pudo cargar el detalle del gasto.');
      }
      const data = await response.json();
      setLoadedDetails(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      alert(err.message);
    } finally {
      setExpandingId(null);
    }
  };

  // Alternar el estado de acordeón
  const toggleLegExpansion = (id) => {
    if (expandedLegIds.includes(id)) {
      setExpandedLegIds(expandedLegIds.filter(x => x !== id));
    } else {
      setExpandedLegIds([...expandedLegIds, id]);
      fetchLegalizacionDetail(id);
    }
  };

  const isAdminView = user?.rol === 'superadmin' || user?.rol === 'admin';

  // Agrupar legalizaciones por colaborador para la vista de Admin/Superadmin
  const groupedByColaborador = React.useMemo(() => {
    if (!isAdminView) return [];
    
    const groups = {};
    legalizaciones.forEach((leg) => {
      const userId = leg.usuario?.id || 0;
      if (!groups[userId]) {
        groups[userId] = {
          usuario: leg.usuario || { nombre: 'Usuario Eliminado', correo: 'usuario.eliminado@pcmejia.com.co' },
          anticipo: 0,
          total_gastado: 0,
          saldo: 0,
          legalizacionesList: []
        };
      }
      groups[userId].anticipo += parseFloat(leg.anticipo || 0);
      groups[userId].total_gastado += parseFloat(leg.total_gastado || 0);
      groups[userId].saldo += parseFloat(leg.saldo || 0);
      groups[userId].legalizacionesList.push(leg);
    });
    
    return Object.values(groups);
  }, [legalizaciones, isAdminView]);

  // Filtrar colaboradores por búsqueda
  const filteredColaboradores = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedByColaborador;
    const query = searchQuery.toLowerCase().trim();
    return groupedByColaborador.filter(colab => 
      colab.usuario.nombre.toLowerCase().includes(query) ||
      colab.usuario.correo.toLowerCase().includes(query)
    );
  }, [groupedByColaborador, searchQuery]);

  // Calcular estadísticas generales
  const totalAnticipos = legalizaciones.reduce((acc, curr) => acc + parseFloat(curr.anticipo || 0), 0);
  const totalGastos = legalizaciones.reduce((acc, curr) => acc + parseFloat(curr.total_gastado || 0), 0);
  const totalSaldos = totalAnticipos - totalGastos;

  // Imprimir reporte resumido
  const handlePrint = () => {
    window.print();
  };

  return (
    <Layout>
      <div className="space-y-8 print:bg-white print:text-black">
        {/* ENCABEZADO Y ACCIÓN PRINCIPAL */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {isAdminView ? 'Control y Aprobación de Viáticos' : 'Historial de Legalizaciones'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isAdminView 
                ? 'Supervisa, aprueba o devuelve a borrador los comprobantes de viaje de los colaboradores.'
                : 'Supervisa y controla tus fondos y comprobantes de viaje.'}
            </p>
          </div>
          {!isAdminView && (
            <button
              onClick={() => navigate('/nueva')}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/15"
            >
              <Plus className="w-4 h-4" />
              Nueva Legalización
            </button>
          )}
        </div>

        {/* CONTENEDOR DE INDICADORES DE CÁLCULO GENERAL */}
        <StatsSummary
          isAdminView={isAdminView}
          totalAnticipos={totalAnticipos}
          totalGastos={totalGastos}
          totalSaldos={totalSaldos}
          formatMoney={formatMoney}
        />

        {/* TABLA DEL HISTORIAL */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl print:border-none print:shadow-none">
          {error && (
            <div className="m-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <span>Cargando historial...</span>
            </div>
          ) : legalizaciones.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-center px-4">
              <FileText className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="font-semibold text-slate-400">No hay legalizaciones</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                {isAdminView 
                  ? 'Aún ningún colaborador ha registrado legalizaciones en el sistema.' 
                  : 'Aún no has registrado ninguna legalización. Comienza creando una nueva.'}
              </p>
            </div>
          ) : isAdminView ? (
            <ColaboradoresTable
              filteredColaboradores={filteredColaboradores}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              formatMoney={formatMoney}
              setSelectedColab={setSelectedColab}
              setExpandedLegIds={setExpandedLegIds}
            />
          ) : (
            <LegalizacionesTable
              legalizaciones={legalizaciones}
              formatMoney={formatMoney}
              handleVerDetalles={handleVerDetalles}
              navigate={navigate}
              user={user}
              handleEliminar={handleEliminar}
            />
          )}
        </div>

        {/* MODAL DE DETALLE / REPORTE RESUMIDO */}
        <DetailModal
          selectedLeg={selectedLeg}
          setSelectedLeg={setSelectedLeg}
          isAdminView={isAdminView}
          formatMoney={formatMoney}
          handleUpdateEstado={handleUpdateEstado}
          navigate={navigate}
          handlePrint={handlePrint}
        />

        {/* MODAL DE DESGLOSE POR COLABORADOR (SOLO ADMIN VIEW) */}
        <ColaboradorModal
          selectedColab={selectedColab}
          setSelectedColab={setSelectedColab}
          expandedLegIds={expandedLegIds}
          toggleLegExpansion={toggleLegExpansion}
          loadedDetails={loadedDetails}
          expandingId={expandingId}
          formatMoney={formatMoney}
          handleUpdateEstado={handleUpdateEstado}
          user={user}
          handleEliminar={handleEliminar}
        />
      </div>
    </Layout>
  );
};

export default DashboardPage;
