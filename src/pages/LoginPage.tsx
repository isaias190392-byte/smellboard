import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/smellgo-logo.png";

const loginEmails: Record<string, string> = {
  Diretoria: "diretoria@smellgo.local",
  Comercial: "comercial@smellgo.local",
};

const LoginPage = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!login || !password) return toast.error("Informe login e senha");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmails[login], password });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    navigate("/", { replace: true });
  };

  return <div className="min-h-screen bg-background flex items-center justify-center px-6">
    <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-card">
      <img src={logo} alt="Smell & Go" className="mx-auto h-12 object-contain mb-6" />
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"><LockKeyhole className="h-5 w-5" /></div>
        <h1 className="font-display text-2xl font-bold text-foreground">Acesso SmellBoard</h1>
        <p className="text-sm text-muted-foreground">Entre com seu perfil autorizado</p>
      </div>
      <div className="space-y-3">
        <Select value={login} onValueChange={setLogin}>
          <SelectTrigger><SelectValue placeholder="Login" /></SelectTrigger>
          <SelectContent><SelectItem value="Diretoria">Diretoria</SelectItem><SelectItem value="Comercial">Comercial</SelectItem></SelectContent>
        </Select>
        <Input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }} />
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">{submitting ? "Entrando..." : "Entrar"}</Button>
      </div>
    </div>
  </div>;
};

export default LoginPage;