import React, { useState, useMemo, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../../context/AuthContext';

const GastosTable = ({ gastos, handleEliminarGasto, formatMoney }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(gastos.length / itemsPerPage);

  const paginatedGastos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return gastos.slice(start, start + itemsPerPage);
  }, [gastos, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [gastos.length, totalPages, currentPage]);

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-6 border-b border-slate-800/80">
        <h3 className="font-bold text-sm text-slate-200">Desglose de Gastos Registrados</h3>
      </div>

      {gastos.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <span>No se han cargado gastos en esta legalización.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/30 text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-6">Fecha</th>
                <th className="py-3 px-6">Descripción</th>
                <th className="py-3 px-6">Categoría</th>
                <th className="py-3 px-6 text-right">Monto</th>
                <th className="py-3 px-6 text-center">Comprobante</th>
                <th className="py-3 px-6 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {paginatedGastos.map((g) => (
                <tr key={g.id} className="hover:bg-slate-900/10">
                  <td className="py-3 px-6 whitespace-nowrap">{g.fecha_gasto}</td>
                  <td className="py-3 px-6 font-medium">{g.descripcion}</td>
                  <td className="py-3 px-6">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px]">
                      {g.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-semibold">
                    <div>{formatMoney(g.monto)}</div>
                    {g.subtotal !== null && g.subtotal !== undefined && g.iva !== null && g.iva !== undefined && (
                      <div className="text-[9px] text-slate-500 mt-0.5 font-normal">
                        Sub: {formatMoney(g.subtotal)} | IVA: {formatMoney(g.iva)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {g.comprobante_url ? (
                      <a
                        href={g.comprobante_url.startsWith('/static') ? `${API_BASE_URL}${g.comprobante_url}` : g.comprobante_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                      >
                        Ver Archivo
                      </a>
                    ) : (
                      <span className="text-slate-600">Ninguno</span>
                    )}
                  </td>
                  <td className="py-3 px-6 text-center">
                    <button
                      onClick={() => handleEliminarGasto(g.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200"
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {gastos.length > itemsPerPage && (
        <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-950/20">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-all duration-200"
          >
            Anterior
          </button>
          <span className="text-xs text-slate-500">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-slate-300 transition-all duration-200"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default GastosTable;
