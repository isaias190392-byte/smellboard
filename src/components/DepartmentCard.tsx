import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DepartmentCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  metric?: string;
  metricLabel?: string;
}

const DepartmentCard = ({ title, description, icon: Icon, path, metric, metricLabel }: DepartmentCardProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 text-left transition-all duration-300 hover:shadow-elevated hover:-translate-y-1 hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 gradient-primary" style={{ opacity: 0 }} />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-5 gradient-primary" />
      
      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-6 w-6 transition-colors duration-300" />
        </div>
        
        <h3 className="font-display text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        {metric && (
          <div className="pt-3 border-t border-border">
            <p className="text-2xl font-bold font-display text-primary">{metric}</p>
            <p className="text-xs text-muted-foreground">{metricLabel}</p>
          </div>
        )}
      </div>
    </button>
  );
};

export default DepartmentCard;
