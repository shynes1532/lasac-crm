import { Users, TrendingUp, Calendar, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  totalLeads: number;
  leadsToday: number;
  leadsThisWeek: number;
  conversionRate: number;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export function DashboardStats({
  totalLeads,
  leadsToday,
  leadsThisWeek,
  conversionRate,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total de Leads"
        value={totalLeads}
        subtitle="Todos los tiempos"
        icon={Users}
        color="bg-blue-50 text-blue-600"
      />
      <StatCard
        title="Leads Hoy"
        value={leadsToday}
        subtitle="Últimas 24 horas"
        icon={Calendar}
        color="bg-green-50 text-green-600"
      />
      <StatCard
        title="Esta Semana"
        value={leadsThisWeek}
        subtitle="Últimos 7 días"
        icon={TrendingUp}
        color="bg-purple-50 text-purple-600"
      />
      <StatCard
        title="Tasa de Cierre"
        value={`${conversionRate}%`}
        subtitle="Leads → Ventas"
        icon={Target}
        color="bg-brand-50 text-brand-700"
      />
    </div>
  );
}
