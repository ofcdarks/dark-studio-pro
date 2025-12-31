import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, ArrowRight } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.gif";
import authBg from "@/assets/auth-bg.jpg";

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
  const [showPassword, setShowPassword] = useState(false);
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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `url(${authBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-background/95 backdrop-blur-sm rounded-2xl p-8 border border-border/50">
        {/* Private Core Badge */}
        <div className="flex justify-center mb-4">
          <span className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            PRIVATE CORE
          </span>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full ring-4 ring-primary overflow-hidden bg-background">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground text-center font-playfair tracking-wide">
          LA CASA DARK
        </h1>
        <p className="text-primary text-xl font-bold text-center tracking-[0.3em] mb-2">
          CORE
        </p>

        {/* Subtitle */}
        <h2 className="text-lg font-semibold text-foreground text-center mb-1">
          {isLogin ? "Acesso ao Núcleo Privado" : "Criar Acesso ao Núcleo"}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-6">
          Ferramentas usadas por criadores que operam canais dark em escala
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-primary" />
                Nome completo
              </label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-secondary/50 border-border/50 h-11"
              />
            </div>
          )}
          
          {/* Email */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3 h-3 text-primary" />
              E-mail
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary/50 border-border/50 h-11"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-primary" />
              Senha
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/50 border-border/50 h-11 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Recover access */}
          {isLogin && (
            <div className="text-left">
              <button
                type="button"
                className="text-primary text-xs hover:underline"
              >
                Recuperar acesso ao Core
              </button>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Resete sua senha e infra (Sutura da operação)
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            {isLogin ? "Acessar o Core" : "Criar Acesso"}
          </Button>
        </form>

        {/* Info text */}
        <p className="text-[10px] text-muted-foreground text-center mt-3">
          Canais dark não crescem por sorte. Crescem por processo.
        </p>

        {/* Restricted access */}
        <div className="text-center mt-4">
          <p className="text-xs text-muted-foreground">
            Acesso restrito · Validação obrigatória
          </p>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary text-sm font-semibold hover:underline mt-1"
          >
            {isLogin ? "Solicitar acesso ao Core" : "Já tenho acesso"}
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px]">Ambiente isolado para operações dark</span>
        </div>

        {/* Terms */}
        <p className="text-[9px] text-muted-foreground text-center mt-4">
          Ao continuar, você concorda com nossos{" "}
          <span className="text-primary hover:underline cursor-pointer">Termos de Uso</span>
          {" "}e{" "}
          <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>
        </p>

        {/* Encrypted text */}
        <p className="text-[8px] text-muted-foreground/50 text-center mt-3 font-mono">
          Operações de alta escala em sigilo absoluto
        </p>
      </div>
    </div>
  );
};

export default Auth;
