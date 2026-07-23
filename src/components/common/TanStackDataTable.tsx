import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table';
import {
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';

interface TanStackDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
  title?: string;
  subtitle?: string;
  pageSize?: number;
  exportFileName?: string;
  actions?: React.ReactNode;
}

export function TanStackDataTable<TData>({
  data,
  columns,
  searchPlaceholder = 'ค้นหาในตาราง...',
  title,
  subtitle,
  pageSize = 10,
  exportFileName = 'export-data.csv',
  actions,
}: TanStackDataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  const handleExportCsv = () => {
    if (!data.length) return;
    const filteredRows = table.getFilteredRowModel().rows;
    if (!filteredRows.length) return;

    // Extract headers
    const visibleColumns = table.getVisibleLeafColumns();
    const headers = visibleColumns.map((col) => col.id || 'Column');

    const csvContent = [
      headers.join(','),
      ...filteredRows.map((row) =>
        visibleColumns
          .map((col) => {
            const val = row.getValue(col.id);
            const strVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
            return `"${strVal.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', exportFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          {title && <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {/* Global Search Input */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-2xs"
            />
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
            title="ดาวน์โหลดข้อมูลตารางเป็นไฟล์ CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
          </button>

          {actions}
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto min-h-[250px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-100/80 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px] tracking-wider">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="py-3 px-4 font-extrabold select-none">
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center space-x-1.5 ${
                          header.column.getCanSort() ? 'cursor-pointer hover:text-slate-900' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4 text-slate-700 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400 font-medium text-xs">
                  ไม่พบข้อมูลที่ตรงกับคำค้นหา "{globalFilter}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center space-x-2">
          <span>แสดง</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            {[5, 10, 20, 50].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} รายการ/หน้า
              </option>
            ))}
          </select>
          <span className="text-slate-400">
            (ทั้งหมด {table.getFilteredRowModel().rows.length} รายการ)
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">
            หน้า {table.getState().pagination.pageIndex + 1} จาก {table.getPageCount() || 1}
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
