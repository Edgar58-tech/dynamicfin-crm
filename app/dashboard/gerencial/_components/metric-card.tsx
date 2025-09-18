
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  description?: string;
  unit?: string;
  alert?: boolean;
  loading?: boolean;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  description,
  unit = '',
  alert = false,
  loading = false
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (changeType) {
      case 'positive':
        return TrendingUp;
      case 'negative':
        return TrendingDown;
      default:
        return Minus;
    }
  };

  const getTrendColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-slate-500';
    }
  };

  const getIconBackgroundColor = () => {
    if (alert) return 'bg-red-100';
    switch (changeType) {
      case 'positive':
        return 'bg-green-100';
      case 'negative':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getIconColor = () => {
    if (alert) return 'text-red-600';
    switch (changeType) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const TrendIcon = getTrendIcon();

  if (loading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-2"></div>
            <div className="h-8 bg-slate-200 rounded mb-4"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`relative overflow-hidden border transition-all duration-200 hover:shadow-lg ${
        alert ? 'border-red-200 bg-red-50' : 'border-slate-200 hover:border-slate-300'
      }`}>
        {alert && (
          <div className="absolute top-2 right-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
        )}
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-1 ${
                alert ? 'text-red-700' : 'text-slate-600'
              }`}>
                {title}
              </p>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-baseline gap-1"
              >
                <span className={`text-2xl font-bold ${
                  alert ? 'text-red-800' : 'text-slate-800'
                }`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
                {unit && (
                  <span className={`text-sm ${
                    alert ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {unit}
                  </span>
                )}
              </motion.div>
              
              {description && (
                <p className={`text-xs mt-1 ${
                  alert ? 'text-red-600' : 'text-slate-500'
                }`}>
                  {description}
                </p>
              )}
            </div>
            
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getIconBackgroundColor()}`}>
              <Icon className={`w-6 h-6 ${getIconColor()}`} />
            </div>
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center mt-4 text-sm ${getTrendColor()}`}>
              <TrendIcon className="w-4 h-4 mr-1" />
              <span className="font-medium">
                {change > 0 ? '+' : ''}{change}%
              </span>
              <span className="text-slate-500 ml-2">vs período anterior</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
