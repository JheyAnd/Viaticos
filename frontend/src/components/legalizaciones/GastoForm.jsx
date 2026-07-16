import React, { useState } from 'react';
import { AlertTriangle, DollarSign, FileUp, Loader2, PlusCircle, Sparkles, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';

const BADGE_CONFIANZA = {
  alta: { label: '✨ IA · Alta confianza', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  media: { label: '✨ IA · Confianza media', cls: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  baja: { label: '✨ IA · Baja confianza — verifica', cls: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
};

const GastoForm = ({
  legId,
  handleAgregarGasto,
  gastoDesc,
  setGastoDesc,
  gastoCat,
  setGastoCat,
  gastoMonto,
  setGastoMonto,
  gastoFecha,
  setGastoFecha,
  gastoFile,
  setGastoFile,
  tieneImpuesto,
  setTieneImpuesto,
  submittingGasto,
  formatMoney
}) => {
  const { token } = useAuth();
  const [analizandoIA, setAnalizandoIA] = useState(false);
  const [iaEstado, setIaEstado] = useState(null);
  const [iaError, setIaError] = useState('');

  if (!legId) {
    return (
      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center text-slate-500">
        <AlertTriangle className="w-12 h-12 text-slate-700 mb-4 animate-bounce" />
        <h3 className="font-bold text-slate-400">Seccion de Gastos Bloqueada</h3>
        <p className="text-xs text-slate-600 max-w-sm mt-1">
          Por politicas estrictas del sistema, primero debe registrar el Destino y Anticipo en el panel izquierdo para habilitar la carga de gastos individuales.
        </p>
      </div>
    );
  }

  const esImagen = gastoFile && gastoFile.type.startsWith('image/');

  const handleAnalizarConIA = async () => {
    if (!gastoFile || !esImagen) return;
    setAnalizandoIA(true);
    setIaEstado(null);
    setIaError('');

    try {
      const formData = new FormData();
      formData.append('imagen', gastoFile);

      const res = await fetch(`${API_BASE_URL}/api/ocr/analizar-recibo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Error al analizar la imagen.');
      }

      const d = data.datos;

      if (d.descripcion) setGastoDesc(d.descripcion);
      if (d.monto)       setGastoMonto(d.monto.toString());
      if (d.fecha)       setGastoFecha(d.fecha);
      if (d.categoria)   setGastoCat(d.categoria);
      if (d.tiene_iva !== undefined) setTieneImpuesto(d.tiene_iva);

      setIaEstado({ confianza: d.confianza || 'media', proveedor: d.proveedor });

    } catch (err) {
      setIaError(err.message);
      setIaEstado('error');
    } finally {
      setAnalizandoIA(false);
    }
  };

  const handleFileChange = (e) => {
    setGastoFile(e.target.files[0]);
    setIaEstado(null);
    setIaError('');
  };

  const handleLimpiarIA = () => {
    setIaEstado(null);
    setIaError('');
  };

  const badgeInfo = iaEstado && iaEstado !== 'error' ? BADGE_CONFIANZA[iaEstado.confianza] || BADGE_CONFIANZA.media : null;

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
        <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-400">2</span>
        <h3 className="font-bold text-slate-200">Agregar Gasto Individual</h3>
      </div>

      {badgeInfo && (
        <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${badgeInfo.cls}`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{badgeInfo.label}</span>
            {iaEstado.proveedor && <span className="opacity-70">· {iaEstado.proveedor}</span>}
          </div>
          <button onClick={handleLimpiarIA} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {iaEstado === 'error' && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{iaError || 'No se pudo analizar la imagen. Complete los campos manualmente.'}</span>
          </div>
          <button onClick={handleLimpiarIA} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleAgregarGasto} className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Adjuntar Comprobante
            <span className="ml-1.5 text-slate-600 normal-case font-normal">(Opcional · sube una imagen para usar IA)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="file"
                id="comprobante-input"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
              />
              <label
                htmlFor="comprobante-input"
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-950/50 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-400 cursor-pointer transition-all duration-200"
              >
                <span className="truncate">{gastoFile ? gastoFile.name : 'Seleccionar archivo (PDF, Imagen)'}</span>
                <FileUp className="w-4 h-4 text-slate-500 shrink-0" />
              </label>
            </div>

            {esImagen && (
              <button
                type="button"
                onClick={handleAnalizarConIA}
                disabled={analizandoIA}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-violet-900/30"
                title="Analizar automaticamente con Gemini Vision"
              >
                {analizandoIA ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Analizar con IA
                  </>
                )}
              </button>
            )}
          </div>
          {esImagen && !iaEstado && (
            <p className="text-xs text-slate-600 pl-1">
              Haz clic en Analizar con IA para rellenar los campos automaticamente desde la imagen.
            </p>
          )}
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Concepto / Descripcion del Gasto
            {badgeInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeInfo.cls}`}>IA</span>}
          </label>
          <input
            type="text"
            value={gastoDesc}
            onChange={(e) => setGastoDesc(e.target.value)}
            placeholder="Ej: Taxi terminal de transportes"
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none transition-colors ${badgeInfo ? 'border-violet-500/40 focus:border-violet-500' : 'border-slate-800 focus:border-blue-500'}`}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Categoria
            {badgeInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeInfo.cls}`}>IA</span>}
          </label>
          <select
            value={gastoCat}
            onChange={(e) => setGastoCat(e.target.value)}
            className={`w-full px-3 py-2.5 bg-slate-950/50 border rounded-xl text-sm text-slate-100 outline-none transition-colors ${badgeInfo ? 'border-violet-500/40 focus:border-violet-500' : 'border-slate-800 focus:border-blue-500'}`}
          >
            <option value="Transporte">Transporte</option>
            <option value="Alimentacion">Alimentacion</option>
            <option value="Hospedaje">Hospedaje</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Monto
            {badgeInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeInfo.cls}`}>IA</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              value={gastoMonto}
              onChange={(e) => setGastoMonto(e.target.value)}
              placeholder="0"
              className={`w-full pl-9 pr-4 py-2.5 bg-slate-950/50 border rounded-xl text-sm text-slate-100 placeholder-slate-600 outline-none font-mono transition-colors ${badgeInfo ? 'border-violet-500/40 focus:border-violet-500' : 'border-slate-800 focus:border-blue-500'}`}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            Fecha Gasto
            {badgeInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeInfo.cls}`}>IA</span>}
          </label>
          <input
            type="date"
            value={gastoFecha}
            onChange={(e) => setGastoFecha(e.target.value)}
            className={`w-full px-4 py-2.5 bg-slate-950/50 border rounded-xl text-sm text-slate-100 outline-none transition-colors ${badgeInfo ? 'border-violet-500/40 focus:border-violet-500' : 'border-slate-800 focus:border-blue-500'}`}
            required
          />
        </div>

        <div className="space-y-1.5 md:col-span-2 flex items-center gap-2 py-2">
          <input
            type="checkbox"
            id="tiene-impuesto-checkbox"
            checked={tieneImpuesto}
            onChange={(e) => setTieneImpuesto(e.target.checked)}
            className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label htmlFor="tiene-impuesto-checkbox" className="text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none flex items-center gap-2">
            La factura tiene impuesto (IVA 14%)
            {badgeInfo && <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${badgeInfo.cls}`}>IA</span>}
          </label>
        </div>

        {tieneImpuesto && gastoMonto && parseFloat(gastoMonto) > 0 && (
          <div className="md:col-span-2 grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Subtotal (Base):</span>
              <span className="font-semibold text-slate-300">{formatMoney(parseFloat(gastoMonto) / 1.14)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Impuesto (IVA 14%):</span>
              <span className="font-semibold text-slate-300">{formatMoney(parseFloat(gastoMonto) - parseFloat(gastoMonto) / 1.14)}</span>
            </div>
          </div>
        )}

        <div className="md:col-span-2 pt-2">
          <button
            type="submit"
            disabled={submittingGasto}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            {submittingGasto ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Subiendo Comprobante a SharePoint...
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Agregar Gasto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GastoForm;
