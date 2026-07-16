import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';

// Subcomponentes
import ViajeForm from '../components/legalizaciones/ViajeForm';
import GastoForm from '../components/legalizaciones/GastoForm';
import GastosTable from '../components/legalizaciones/GastosTable';

const NuevaLegalizacionPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlId = searchParams.get('id');

  // Estados generales
  const [legId, setLegId] = useState(urlId || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Paso 1: Datos de la legalización
  const [destino, setDestino] = useState('');
  const [anticipo, setAnticipo] = useState('0');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [legEstado, setLegEstado] = useState('Borrador');

  // Paso 2: Datos del nuevo gasto
  const [gastoDesc, setGastoDesc] = useState('');
  const [gastoCat, setGastoCat] = useState('Alimentacion');
  const [gastoMonto, setGastoMonto] = useState('');
  const [gastoFecha, setGastoFecha] = useState(new Date().toISOString().split('T')[0]);
  const [gastoFile, setGastoFile] = useState(null);
  const [tieneImpuesto, setTieneImpuesto] = useState(false);

  // Lista de gastos agregados
  const [gastos, setGastos] = useState([]);
  const [submittingGasto, setSubmittingGasto] = useState(false);

  // Cargar datos si hay un ID en la URL (modo edición/continuación)
  useEffect(() => {
    if (urlId) {
      const loadLegalizacion = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${urlId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('No se pudo cargar la legalización especificada.');
          }

          const data = await response.json();
          
          if (data.estado !== 'Borrador') {
            alert('Esta legalización ya ha sido enviada o finalizada y no puede editarse.');
            navigate('/dashboard');
            return;
          }

          setLegId(data.id);
          setDestino(data.destino_motivo);
          setAnticipo(data.anticipo.toString());
          setFechaInicio(data.fecha_inicio);
          setLegEstado(data.estado);
          setGastos(data.gastos || []);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadLegalizacion();
    }
  }, [urlId, token]);

  // Guardar Paso 1: Crear la legalización e ingresar el Anticipo
  const handleGuardarPaso1 = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!destino) {
      setError('Por favor ingrese el destino o motivo.');
      return;
    }

    const valorAnticipo = parseFloat(anticipo);
    if (isNaN(valorAnticipo) || valorAnticipo < 0) {
      setError('El valor inicial del anticipo debe ser mayor o igual a 0.');
      return;
    }

    setLoading(true);
    try {
      // Si ya existe la legalización, podemos actualizarla (o dejarla bloqueada)
      // En este flujo, una vez creado el anticipo, habilitamos la sección.
      const payload = {
        destino_motivo: destino,
        anticipo: valorAnticipo,
        fecha_inicio: fechaInicio
      };

      const url = legId ? `${API_BASE_URL}/api/legalizaciones/${legId}` : `${API_BASE_URL}/api/legalizaciones`;
      const method = legId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Fallo al guardar la legalización.');
      }

      setLegId(data.id);
      setSearchParams({ id: data.id });
      setSuccessMsg('Anticipo e información de viaje registrados con éxito. Ahora puede agregar los gastos.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Agregar un Gasto individual (Paso 2)
  const handleAgregarGasto = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!gastoDesc || !gastoMonto || !gastoFecha) {
      setError('Por favor complete todos los campos del gasto.');
      return;
    }

    const montoNum = parseFloat(gastoMonto);
    if (isNaN(montoNum) || montoNum <= 0) {
      setError('El monto del gasto debe ser un valor positivo mayor a 0.');
      return;
    }

    setSubmittingGasto(true);
    try {
      // Creamos un FormData para manejar la subida del archivo comprobante
      const formData = new FormData();
      formData.append('descripcion', gastoDesc);
      formData.append('categoria', gastoCat);
      formData.append('monto', montoNum.toString());
      formData.append('fecha_gasto', gastoFecha);
      
      if (gastoFile) {
        formData.append('comprobante', gastoFile);
      }

      if (tieneImpuesto) {
        const subtotalVal = montoNum / 1.14;
        const ivaVal = montoNum - subtotalVal;
        formData.append('subtotal', subtotalVal.toFixed(2));
        formData.append('iva', ivaVal.toFixed(2));
      }

      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${legId}/gastos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Error al agregar el gasto.');
      }

      // Añadir gasto al estado
      setGastos([...gastos, data]);
      
      // Limpiar campos del gasto
      setGastoDesc('');
      setGastoMonto('');
      setGastoFile(null);
      setTieneImpuesto(false);
      
      // Reset input de archivos
      const fileInput = document.getElementById('comprobante-input');
      if (fileInput) fileInput.value = '';

      setSuccessMsg('Gasto registrado y comprobante subido correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingGasto(false);
    }
  };

  // Eliminar un gasto
  const handleEliminarGasto = async (gastoId) => {
    setError('');
    setSuccessMsg('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/gastos/${gastoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Fallo al eliminar el gasto.');
      }

      setGastos(gastos.filter(g => g.id !== gastoId));
      setSuccessMsg('Gasto eliminado con éxito.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Enviar / Finalizar Legalización completa
  const handleEnviarLegalizacion = async () => {
    setError('');
    setSuccessMsg('');

    if (!window.confirm('¿Está seguro de enviar esta legalización? No se podrán realizar modificaciones adicionales.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/legalizaciones/${legId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: 'Enviado' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Error al enviar la legalización.');
      }

      alert('Legalización enviada con éxito.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- CÁLCULOS EN CALIENTE (LIQUIDACIÓN MATEMÁTICA) ---
  const liquidacionMatematica = useMemo(() => {
    const vAnticipo = parseFloat(anticipo) || 0;
    const vTotalGastado = gastos.reduce((acc, curr) => acc + parseFloat(curr.monto), 0);
    const vSaldo = vAnticipo - vTotalGastado;
    
    return {
      anticipo: vAnticipo,
      totalGastado: vTotalGastado,
      saldo: vSaldo
    };
  }, [anticipo, gastos]);

  // Formatear dinero
  const formatMoney = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
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
            <h2 className="text-2xl font-bold tracking-tight">
              {legId ? 'Registrar Gastos e Información' : 'Iniciar Nueva Legalización'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Siga el flujo secuencial obligatorio.</p>
          </div>
        </div>

        {/* Alertas de Mensaje */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PANEL IZQUIERDO: PASO 1 (DATOS Y ANTICIPO) */}
          <ViajeForm
            destino={destino}
            setDestino={setDestino}
            fechaInicio={fechaInicio}
            setFechaInicio={setFechaInicio}
            anticipo={anticipo}
            setAnticipo={setAnticipo}
            legId={legId}
            handleGuardarPaso1={handleGuardarPaso1}
            loading={loading}
            liquidacionMatematica={liquidacionMatematica}
            formatMoney={formatMoney}
            handleEnviarLegalizacion={handleEnviarLegalizacion}
          />

          {/* PANEL DERECHO: PASO 2 Y LISTA DE GASTOS */}
          <div className="lg:col-span-2 space-y-6">
            <GastoForm
              legId={legId}
              handleAgregarGasto={handleAgregarGasto}
              gastoDesc={gastoDesc}
              setGastoDesc={setGastoDesc}
              gastoCat={gastoCat}
              setGastoCat={setGastoCat}
              gastoMonto={gastoMonto}
              setGastoMonto={setGastoMonto}
              gastoFecha={gastoFecha}
              setGastoFecha={setGastoFecha}
              gastoFile={gastoFile}
              setGastoFile={setGastoFile}
              tieneImpuesto={tieneImpuesto}
              setTieneImpuesto={setTieneImpuesto}
              submittingGasto={submittingGasto}
              formatMoney={formatMoney}
            />

            {legId && (
              <GastosTable
                gastos={gastos}
                handleEliminarGasto={handleEliminarGasto}
                formatMoney={formatMoney}
                API_BASE_URL={API_BASE_URL}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NuevaLegalizacionPage;
