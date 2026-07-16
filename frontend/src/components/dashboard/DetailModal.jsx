import React, { useState, useEffect } from 'react';
import { FileText, X, Download, Printer } from 'lucide-react';
import { API_BASE_URL } from '../../context/AuthContext';

const DetailModal = ({
  selectedLeg,
  setSelectedLeg,
  isAdminView,
  formatMoney,
  handleUpdateEstado,
  navigate,
  handlePrint
}) => {
  const [detailPage, setDetailPage] = useState(1);
  const detailItemsPerPage = 3;
  const totalDetailPages = selectedLeg ? Math.ceil(selectedLeg.gastos.length / detailItemsPerPage) : 0;

  useEffect(() => {
    setDetailPage(1);
  }, [selectedLeg?.id]);

  if (!selectedLeg) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:relative print:bg-white print:p-0">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] print:max-h-full print:border-none print:shadow-none print:bg-white print:text-black">
        
        {/* Encabezado Modal */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/30 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-lg text-slate-100">Resumen y Detalle de Legalización</h3>
          </div>
          <button
            onClick={() => setSelectedLeg(null)}
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
              <h1 className="text-xl font-bold">REPORTE RESUMIDO DE VIÁTICOS</h1>
              <p className="text-xs text-slate-500 mt-1">Ecosistema Corporativo PCM S.A.S.</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold">Fecha Reporte:</p>
              <p className="text-xs">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Metadatos Generales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-950/50 border border-slate-800/60 print:bg-slate-100 print:text-black print:border-slate-300">
            {isAdminView && (
              <div>
                <span className="text-xs text-slate-500 block">Colaborador</span>
                <span className="text-sm font-semibold text-slate-200 print:text-black">
                  {selectedLeg.usuario ? selectedLeg.usuario.nombre : 'Usuario Eliminado'}
                </span>
              </div>
            )}
            <div>
              <span className="text-xs text-slate-500 block">Destino/Motivo</span>
              <span className="text-sm font-semibold text-slate-200 print:text-black">{selectedLeg.destino_motivo}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Fecha Inicio</span>
              <span className="text-sm font-semibold text-slate-200 print:text-black">{selectedLeg.fecha_inicio}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Estado</span>
              <span className="text-sm font-semibold text-slate-200 print:text-black">{selectedLeg.estado}</span>
            </div>
          </div>

          {/* Liquidación Matemática */}
          <div className="grid grid-cols-3 gap-4 border border-slate-800/80 rounded-2xl p-5 bg-slate-950/20 print:bg-white print:border-slate-300">
            <div className="text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Valor Inicial (Anticipo)</span>
              <p className="text-lg font-bold text-slate-300 font-mono mt-1 print:text-black">{formatMoney(selectedLeg.anticipo)}</p>
            </div>
            <div className="text-center border-x border-slate-800/60 print:border-slate-300">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Gastado</span>
              <p className="text-lg font-bold text-slate-300 font-mono mt-1 print:text-black">{formatMoney(selectedLeg.total_gastado)}</p>
            </div>
            <div className="text-center">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Saldo Liquidación</span>
              <p className={`text-lg font-extrabold font-mono mt-1 ${parseFloat(selectedLeg.saldo) >= 0 ? 'text-green-400 print:text-green-700' : 'text-red-400 print:text-red-700'}`}>
                {formatMoney(selectedLeg.saldo)}
              </p>
            </div>
          </div>

          {/* Lista de Gastos */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-slate-400 print:text-black">Desglose de Gastos Registrados</h4>
            <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-[10px] font-bold uppercase text-slate-500 print:bg-slate-200 print:text-black print:border-slate-300">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Descripción</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4 text-right">Monto</th>
                    <th className="py-3 px-4 text-center print:hidden">Comprobante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300 print:text-black print:divide-slate-300">
                  {selectedLeg.gastos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No hay gastos asociados.
                      </td>
                    </tr>
                  ) : (
                    selectedLeg.gastos.slice((detailPage - 1) * detailItemsPerPage, detailPage * detailItemsPerPage).map((gasto) => (
                      <tr key={gasto.id}>
                        <td className="py-3 px-4 whitespace-nowrap">{gasto.fecha_gasto}</td>
                        <td className="py-3 px-4 font-medium">{gasto.descripcion}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 print:bg-slate-100 print:text-black">
                            {gasto.categoria}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">
                          <div>{formatMoney(gasto.monto)}</div>
                          {gasto.subtotal !== null && gasto.subtotal !== undefined && gasto.iva !== null && gasto.iva !== undefined && (
                            <div className="text-[9px] text-slate-500 mt-0.5 font-normal">
                              Sub: {formatMoney(gasto.subtotal)} | IVA: {formatMoney(gasto.iva)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden">
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
            
            {/* Paginación */}
            {selectedLeg.gastos.length > detailItemsPerPage && (
              <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/20 print:hidden">
                <button
                  onClick={() => setDetailPage(prev => Math.max(prev - 1, 1))}
                  disabled={detailPage === 1}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-all duration-200"
                >
                  Anterior
                </button>
                <span className="text-xs text-slate-500">
                  Página {detailPage} de {totalDetailPages}
                </span>
                <button
                  onClick={() => setDetailPage(prev => Math.min(prev + 1, totalDetailPages))}
                  disabled={detailPage === totalDetailPages}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-all duration-200"
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Botones de Acción del Modal */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800 bg-slate-950/20 print:hidden">
          {isAdminView && selectedLeg.estado === 'Enviado' && (
            <>
              <button
                onClick={() => handleUpdateEstado(selectedLeg.id, 'Finalizado')}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-green-600/10"
              >
                Aprobar y Finalizar
              </button>
              <button
                onClick={() => handleUpdateEstado(selectedLeg.id, 'Borrador')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-amber-600/10"
              >
                Rechazar (Borrador)
              </button>
            </>
          )}
          <button
            onClick={() => navigate(`/reporte?id=${selectedLeg.id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-xs font-semibold transition-all duration-200 shadow-md shadow-blue-700/10"
          >
            <Download className="w-4 h-4" />
            Ver Reporte PCM
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all duration-200"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte
          </button>
          <button
            onClick={() => setSelectedLeg(null)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all duration-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
