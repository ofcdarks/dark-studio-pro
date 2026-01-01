import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.gif";
import authBg from "@/assets/auth-bg.jpg";
import FloatingParticles from "@/components/auth/FloatingParticles";

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
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Trigger entrance animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

      {/* Floating Particles */}
      <FloatingParticles />

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
        className={`relative z-10 w-full max-w-2xl transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
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
          className="relative bg-background/90 backdrop-blur-md rounded-2xl px-16 py-16 border border-border/30 shadow-2xl overflow-hidden"
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
          <div className="flex justify-center mb-8 relative">
            <span className="bg-primary/20 text-primary text-base font-semibold px-5 py-2.5 rounded-full flex items-center gap-2">
              <Lock className="w-4 h-4" />
              PRIVATE CORE
            </span>
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-10 relative">
            <div className="w-40 h-40 rounded-full ring-4 ring-primary/80 overflow-hidden bg-background shadow-lg shadow-primary/30">
              <img 
                src={logo} 
                alt="Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold text-foreground text-center tracking-wide relative">
            LA CASA DARK
          </h1>
          <p className="text-primary text-2xl font-bold text-center tracking-[0.3em] mb-4">
            CORE
          </p>

          {/* Subtitle */}
          <h2 className="text-xl font-semibold text-foreground text-center mb-3">
            {isLogin ? "Acesso ao Núcleo Privado" : "Criar Acesso ao Núcleo"}
          </h2>
          <p className="text-base text-muted-foreground text-center mb-10">
            Ferramentas usadas por criadores que operam canais dark em escala
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 relative">
            {!isLogin && (
              <div>
                <label className="text-base text-muted-foreground mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Nome completo
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50 border-border/30 h-16 text-lg"
                />
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="text-base text-muted-foreground mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                E-mail
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50 border-border/30 h-16 text-lg"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-base text-muted-foreground mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Senha
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 border-border/30 h-16 text-lg pr-14"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Remember password & Recover access */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="rememberPassword"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                    className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor="rememberPassword" 
                    className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    Lembrar senha
                  </label>
                </div>
                <button
                  type="button"
                  className="text-primary text-sm hover:underline"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button with animated gradient */}
            <div className="relative mt-4 group">
              <div 
                className="absolute -inset-0.5 rounded-xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(38, 92%, 60%), hsl(var(--primary)), hsl(38, 92%, 60%))',
                  backgroundSize: '300% 100%',
                  animation: 'gradient-shift 3s ease infinite',
                }}
              />
              <Button
                type="submit"
                className="relative w-full h-16 text-xl font-semibold hover:scale-[1.02] transition-transform overflow-hidden"
                style={{
                  background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(38, 92%, 55%), hsl(var(--primary)))',
                  backgroundSize: '200% 100%',
                  animation: 'gradient-shift 3s ease infinite',
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-7 h-7 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-7 h-7 mr-2" />
                )}
                {isLogin ? "Acessar o Core" : "Criar Acesso"}
              </Button>
            </div>
          </form>

          {/* Info text */}
          <p className="text-sm text-muted-foreground text-center mt-6">
            Canais dark não crescem por sorte. Crescem por sistema.
          </p>

          {/* Restricted access */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Acesso restrito · Validação obrigatória
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-base font-semibold hover:underline mt-2"
            >
              {isLogin ? "Solicitar acesso ao Core" : "Já tenho acesso"}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Ambiente isolado para operações dark</span>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-6">
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
