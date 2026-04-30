'use client';

import { CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OracleStatus = 'active' | 'resolved' | 'pending' | 'processing' | 'verified' | 'disputed';

interface OracleStatusBadgeProps {
  status: OracleStatus | string;
  className?: string;
}

const statusConfig: Record<string, any> = {
  active: {
    label: 'Abierto',
    icon: Clock,
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  resolved: {
    label: 'Resuelto por Gemini 2.5 Flash',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-zinc-100 text-zinc-600',
  },
  processing: {
    label: 'Procesando IA',
    icon: AlertCircle,
    className: 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse',
  },
  verified: {
    label: 'Verificado',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  },
  disputed: {
    label: 'En Disputa',
    icon: ShieldAlert,
    className: 'bg-red-50 text-red-600 border border-red-100',
  },
};

export function OracleStatusBadge({ status, className }: OracleStatusBadgeProps) {
  // Fallback para estados desconocidos o nulos
  const config = statusConfig[status] || statusConfig.active;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all',
        config.className,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{config.label}</span>
    </div>
  );
}
