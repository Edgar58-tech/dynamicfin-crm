
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  CheckCircle,
  XCircle,
  Database
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface Column {
  key: string;
  title: string;
  type: 'text' | 'number' | 'percentage' | 'boolean' | 'currency';
  sortable?: boolean;
}

interface DataTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: Column[];
  searchable?: boolean;
  itemsPerPage?: number;
}

export default function DataTable({ 
  title, 
  description, 
  data, 
  columns,
  searchable = true,
  itemsPerPage = 10
}: DataTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginación
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        return current.direction === 'asc' 
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const formatValue = (value: any, type: Column['type']) => {
    if (value === null || value === undefined) return '-';

    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'percentage':
        return typeof value === 'number' ? `${value.toFixed(1)}%` : `${value}%`;
      case 'currency':
        return typeof value === 'number' ? 
          value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }) : 
          value;
      case 'boolean':
        return value ? (
          <Badge variant="outline" className="gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            Sí
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-red-600">
            <XCircle className="w-3 h-3" />
            No
          </Badge>
        );
      default:
        return value?.toString() || '-';
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return ArrowUpDown;
    return sortConfig.direction === 'asc' ? ArrowUp : ArrowDown;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            {title}
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No hay datos disponibles
            </h3>
            <p className="text-slate-500">
              Los datos se mostrarán aquí cuando estén disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              {title}
            </CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {sortedData.length} {sortedData.length === 1 ? 'elemento' : 'elementos'}
            </Badge>
          </div>
        </div>
        
        {searchable && (
          <div className="flex items-center gap-2 mt-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar en la tabla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`text-left py-3 px-4 font-medium text-slate-600 ${
                      column.sortable !== false ? 'cursor-pointer hover:text-slate-800' : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.title}
                      {column.sortable !== false && (
                        <motion.div
                          animate={{ rotate: sortConfig?.key === column.key ? 0 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {React.createElement(getSortIcon(column.key), { 
                            className: `w-4 h-4 ${
                              sortConfig?.key === column.key ? 'text-blue-600' : 'text-slate-400'
                            }` 
                          })}
                        </motion.div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={column.key} className="py-3 px-4 text-slate-700">
                      {formatValue(item[column.key], column.type)}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-slate-500">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, sortedData.length)} de {sortedData.length} elementos
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
