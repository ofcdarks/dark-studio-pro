import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mic, Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().optional(),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password, fullName: isLogin ? undefined : fullName });
      
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          let message = "Erro ao fazer login";
          if (error.message.includes("Invalid login credentials")) {
            message = "Email ou senha incorretos";
          }
          toast({
            title: "Erro",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          let message = "Erro ao criar conta";
          if (error.message.includes("already registered")) {
            message = "Este email já está cadastrado";
          }
          toast({
            title: "Erro",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Conta criada!",
            description: "Você já pode acessar a plataforma",
          });
          navigate("/");
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
            <Mic className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">La Casa Dark</h1>
          <p className="text-primary font-semibold">CORE</p>
        </div>

        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          {isLogin ? "Entrar na plataforma" : "Criar sua conta"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome completo</label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          )}
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline font-medium"
          >
            {isLogin ? "Criar conta" : "Fazer login"}
          </button>
        </p>
      </Card>
    </div>
  );
};

export default Auth;
