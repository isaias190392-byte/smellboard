import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-accent border-primary/20",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
};

const iconStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
};

const KpiCard = ({ label, value, icon: Icon, trend, variant = "default" }: KpiCardProps) => (
  <div className={`rounded-lg border p-5 transition-all duration-200 hover:shadow-card ${variantStyles[variant]}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold font-display text-foreground">{value}</p>
        {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
      </div>
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconStyles[variant]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

export default KpiCard;
