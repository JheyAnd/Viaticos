import React from 'react';
import { FileText, X, ChevronUp, ChevronDown, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../../context/AuthContext';

const ColaboradorModal = ({
  selectedColab,
  setSelectedColab,
  expandedLegIds,
  toggleLegExpansion,
  loadedDetails,
  expandingId,
  formatMoney,
  handleUpdateEstado,
  user,
  handleEliminar
}) => {
  if (!selectedColab) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:relative print:bg-white print:p-0">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] print:max-h-full print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Encabezado Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/30 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <div>
              <h3 className="font-bold text-lg text-slate-100">Desglose de Viáticos</h3>
              <p className="text-xs text-slate-500">Colaborador: {selectedColab.usuario.nombre} ({selectedColab.usuario.correo})</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedColab(null)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Imprimible */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible">
          {/* Cabecera Impresión (Oculto en pantalla) */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-300 pb-4 mb-6">
            <div>
              <h1 className="text-xl font-bold">REPORTE CONSOLIDADO DE VIÁTICOS</h1>
              <p className="text-xs text-slate-500 mt-1">Colaborador: {selectedColab.usuario.nombre} ({selectedColab.usuario.correo})</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">Fecha Reporte:</p>
              <p className="text-xs">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Acumulados Globales del Colaborador */}
          <div className="grid grid-cols-3 gap-4 border border-slate-800/80 rounded-2xl p-5 bg-slate-950/20 print:bg-white print:border-slate-300">
            <div className="text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Anticipado</span>
              <p className="text-lg font-bold text-slate-300 font-mono mt-1 print:text-black">{formatMoney(selectedColab.anticipo)}</p>
            </div>
            <div className="text-center border-x border-slate-800/60 print:border-slate-300">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Gastado</span>
              <p className="text-lg font-bold text-slate-300 font-mono mt-1 print:text-black">{formatMoney(selectedColab.total_gastado)}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Saldo Pendiente</span>
              <p className={`text-lg font-extrabold font-mono mt-1 ${selectedColab.saldo >= 0 ? 'text-green-400 print:text-green-700' : 'text-red-400 print:text-red-700'}`}>
                {formatMoney(selectedColab.saldo)}
              </p>
            </div>
          </div>

          {/* Listado de Legalizaciones (Acordeón) */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-400 print:text-black">Historial de Viajes / Legalizaciones</h4>
            {selectedColab.legalizacionesList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No hay solicitudes registradas.</p>
            ) : (
              selectedColab.legalizacionesList.map((leg) => {
                const isExpanded = expandedLegIds.includes(leg.id);
                const detail = loadedDetails[leg.id];
                return (
                  <div key={leg.id} className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/20">
                    {/* Cabecera del Acordeón */}
                    <div 
                      onClick={() => toggleLegExpansion(leg.id)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-800/40 transition-all duration-200 gap-2 border-b border-transparent"
                      style={{ borderBottomColor: isExpanded ? '#1e293b' : 'transparent' }}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-blue-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                        <div>
                          <div className="font-semibold text-sm text-slate-200">{leg.destino_motivo}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            Inició el {leg.fecha_inicio}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <span className="text-[10px] text-slate-500 block uppercase font-mono">Saldo</span>
                          <span className={`text-xs font-bold font-mono ${parseFloat(leg.saldo) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatMoney(leg.saldo)}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          leg.estado === 'Borrador' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          leg.estado === 'Enviado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-green-500/10 text-green-400 border border-green-500/20'
                        }`}>
                          {leg.estado}
                        </span>
                      </div>
                    </div>

                    {/* Cuerpo del Acordeón */}
                    {isExpanded && (
                      <div className="p-5 space-y-4 bg-slate-900/50">
                        {expandingId === leg.id ? (
                          <div className="flex items-center justify-center py-6 text-slate-500 text-xs gap-2">
                            <div className="w-4 h-4 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                            Cargando desglose de gastos...
                          </div>
                        ) : detail ? (
                          <div className="space-y-4">
                            {/* Resumen Financiero Individual */}
                            <div className="grid grid-cols-3 gap-2 py-2.5 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs">
                              <div>
                                <span className="text-slate-500 block">Anticipo recibido:</span>
                                <span className="font-semibold text-slate-300 font-mono">{formatMoney(detail.anticipo)}</span>
                              </div>
                              <div className="border-x border-slate-800/60 px-4">
                                <span className="text-slate-500 block">Total gastado:</span>
                                <span className="font-semibold text-slate-300 font-mono">{formatMoney(detail.total_gastado)}</span>
                              </div>
                              <div className="px-4">
                                <span className="text-slate-500 block">Diferencia:</span>
                                <span className={`font-bold font-mono ${parseFloat(detail.saldo) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {formatMoney(detail.saldo)}
                                </span>
                              </div>
                            </div>

                            {/* Tabla de Gastos In-line */}
                            <div className="border border-slate-800/80 rounded-xl overflow-hidden">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold uppercase text-slate-500">
                                    <th className="py-2.5 px-4">Fecha</th>
                                    <th className="py-2.5 px-4">Descripción</th>
                                    <th className="py-2.5 px-4">Categoría</th>
                                    <th className="py-2.5 px-4 text-right">Monto</th>
                                    <th className="py-2.5 px-4 text-center">Comprobante</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                  {detail.gastos.length === 0 ? (
                                    <tr>
                                      <td colSpan="5" className="py-4 text-center text-slate-500">
                                        No hay gastos asociados a este viaje.
                                      </td>
                                    </tr>
                                  ) : (
                                    detail.gastos.map((gasto) => (
                                      <tr key={gasto.id} className="hover:bg-slate-900/10">
                                        <td className="py-2 px-4 whitespace-nowrap">{gasto.fecha_gasto}</td>
                                        <td className="py-2 px-4 font-medium">{gasto.descripcion}</td>
                                        <td className="py-2 px-4">
                                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                                            {gasto.categoria}
                                          </span>
                                        </td>
                                        <td className="py-2 px-4 text-right font-mono font-semibold">
                                          <div>{formatMoney(gasto.monto)}</div>
                                          {gasto.subtotal !== null && gasto.subtotal !== undefined && gasto.iva !== null && gasto.iva !== undefined && (
                                            <div className="text-[9px] text-slate-500 mt-0.5 font-normal">
                                              Sub: {formatMoney(gasto.subtotal)} | IVA: {formatMoney(gasto.iva)}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2 px-4 text-center">
                                          {gasto.comprobante_url ? (
                                            <a
                                              href={gasto.comprobante_url.startsWith('/static') ? `${API_BASE_URL}${gasto.comprobante_url}` : gasto.comprobante_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 underline"
                                            >
                                              Ver Archivo
                                            </a>
                                          ) : (
                                            <span className="text-slate-600">Ninguno</span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Botones de acción específicos de la solicitud */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/40">
                              {leg.estado === 'Enviado' && (
                                <>
                                  <button
                                    onClick={() => handleUpdateEstado(leg.id, 'Finalizado')}
                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                                  >
                                    Aprobar y Finalizar
                                  </button>
                                  <button
                                    onClick={() => handleUpdateEstado(leg.id, 'Borrador')}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-all duration-200"
                                  >
                                    Rechazar (Borrador)
                                  </button>
                                </>
                              )}
                              {(user?.rol === 'superadmin' || user?.rol === 'admin') && (
                                <button
                                  onClick={() => handleEliminar(leg.id)}
                                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-semibold transition-all duration-200"
                                >
                                  Eliminar Viático
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <button
                              onClick={() => toggleLegExpansion(leg.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 rounded-lg font-semibold"
                            >
                              Cargar desglose de gastos
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Botones de Acción del Modal */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/20 print:hidden">
          <button
            onClick={() => setSelectedColab(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColaboradorModal;
