import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/smellgo-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  return (
    <header className="border-b border-border bg-card/80 glass sticky top-0 z-50">
      <div className="mx-auto max-w-7xl flex items-center gap-4 px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <img src={logo} alt="Smell & Go" className="h-8 object-contain" />
        <div className="ml-2">
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline">{profile?.displayName}</span>
          <Button variant="outline" size="sm" onClick={() => signOut().then(() => navigate("/login"))}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
