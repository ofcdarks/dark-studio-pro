import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft } from "lucide-react";
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
          navigate("/dashboard");
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
          navigate("/dashboard");
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url(${authBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Gloss overlay with blur effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-sm" />
      
      {/* Gloss shine effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary/10 via-transparent to-transparent rotate-12 animate-pulse" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent -rotate-12" />
      </div>

      {/* Back to Landing Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar</span>
      </Link>
      
      {/* Login Card with Mirror/Glass Effect */}
      <div 
        className="relative z-10 w-full max-w-sm"
        style={{
          perspective: '1000px',
        }}
      >
        {/* Mirror reflection effect */}
        <div 
          className="absolute inset-0 bg-gradient-to-b from-foreground/5 via-transparent to-transparent rounded-2xl pointer-events-none"
          style={{
            transform: 'rotateX(180deg) translateY(100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 50%)',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent 50%)',
          }}
        />
        
        <div 
          className="relative bg-background/90 backdrop-blur-md rounded-2xl p-6 border border-border/30 shadow-2xl overflow-hidden"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.05) inset,
              0 25px 50px -12px rgba(0,0,0,0.5),
              0 0 60px rgba(245,158,11,0.1)
            `,
          }}
        >
          {/* Glass shine overlay */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.05) 100%)',
            }}
          />

          {/* Private Core Badge */}
          <div className="flex justify-center mb-3 relative">
            <span className="bg-primary/20 text-primary text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              PRIVATE CORE
            </span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-3 relative">
            <div className="w-16 h-16 rounded-full ring-2 ring-primary/80 overflow-hidden bg-background shadow-lg shadow-primary/20">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground text-center tracking-wide relative">
            LA CASA DARK
          </h1>
          <p className="text-primary text-base font-bold text-center tracking-[0.25em] mb-1.5">
            CORE
          </p>

          {/* Subtitle */}
          <h2 className="text-sm font-semibold text-foreground text-center mb-0.5">
            {isLogin ? "Acesso ao Núcleo Privado" : "Criar Acesso ao Núcleo"}
          </h2>
          <p className="text-[10px] text-muted-foreground text-center mb-4">
            Ferramentas usadas por criadores que operam canais dark em escala
          </p>

          <form onSubmit={handleSubmit} className="space-y-3 relative">
            {!isLogin && (
              <div>
                <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-2.5 h-2.5 text-primary" />
                  Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50 border-border/30 h-9 text-sm"
                />
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <Mail className="w-2.5 h-2.5 text-primary" />
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50 border-border/30 h-9 text-sm"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-primary" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border/30 h-9 text-sm pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Recover access */}
            {isLogin && (
              <div className="text-left">
                <button
                  type="button"
                  className="text-primary text-[10px] hover:underline"
                >
                  Recuperar acesso ao Core
                </button>
                <p className="text-[9px] text-muted-foreground mt-0.5">
                  Sessão vinculada à infraestrutura do operador
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 text-sm font-semibold hover:scale-[1.02] transition-transform"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              {isLogin ? "Acessar o Core" : "Criar Acesso"}
            </Button>
          </form>

          {/* Info text */}
          <p className="text-[9px] text-muted-foreground text-center mt-2.5">
            Canais dark não crescem por sorte. Crescem por sistema.
          </p>

          {/* Restricted access */}
          <div className="text-center mt-3">
            <p className="text-[10px] text-muted-foreground">
              Acesso restrito · Validação obrigatória
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-xs font-semibold hover:underline mt-0.5"
            >
              {isLogin ? "Solicitar acesso ao Core" : "Já tenho acesso"}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-1 mt-4 text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-[9px]">Ambiente isolado para operações dark</span>
          </div>

          {/* Terms */}
          <p className="text-[8px] text-muted-foreground text-center mt-3">
            Ao continuar, você concorda com nossos{" "}
            <span className="text-primary hover:underline cursor-pointer">Termos de Uso</span>
            {" "}e{" "}
            <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>
          </p>
        </div>
        
        {/* Mirror reflection below card */}
        <div 
          className="absolute left-0 right-0 h-20 -bottom-1 rounded-2xl overflow-hidden pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(17,17,24,0.3), transparent)',
            transform: 'rotateX(180deg) scaleY(0.3)',
            transformOrigin: 'top',
            filter: 'blur(2px)',
            opacity: 0.4,
          }}
        />
      </div>
    </div>
  );
};

export default Auth;
