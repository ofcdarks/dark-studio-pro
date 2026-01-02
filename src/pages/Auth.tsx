import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.gif";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background with Porsche - same as landing */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/hero-porsche.jpg"
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-40"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-background/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/80" />
      </div>

      {/* Subtle floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back to Landing Button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar</span>
      </Link>
      
      {/* Compact Login Card */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div 
          className="relative bg-card/95 backdrop-blur-xl rounded-2xl p-8 border border-border/50 shadow-2xl"
          style={{
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.03) inset,
              0 25px 50px -12px rgba(0,0,0,0.5),
              0 0 40px rgba(245,158,11,0.08)
            `,
          }}
        >
          {/* Glass shine */}
          <div 
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)',
            }}
          />

          {/* Logo and Title */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-60 blur-sm" />
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary relative z-10">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground">
              La Casa Dark <span className="text-primary">CORE</span>
            </h1>
            
            <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">PRIVATE ACCESS</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center mb-6">
            {isLogin ? "Acesse o núcleo de operações" : "Solicite acesso ao núcleo"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 relative">
            {!isLogin && (
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
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
              <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
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
              <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
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

            {/* Remember & Forgot */}
            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberPassword"
                    checked={rememberPassword}
                    onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-4 h-4"
                  />
                  <label htmlFor="rememberPassword" className="text-muted-foreground cursor-pointer">
                    Lembrar
                  </label>
                </div>
                <button type="button" className="text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold gradient-button text-primary-foreground mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2" />
              )}
              {isLogin ? "Acessar Core" : "Criar Acesso"}
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-5 pt-5 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Ainda não tem acesso?" : "Já tem acesso?"}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-sm font-semibold hover:underline mt-1"
            >
              {isLogin ? "Solicitar acesso" : "Fazer login"}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-5 text-muted-foreground">
            <Shield className="w-3 h-3 text-primary" />
            <span className="text-xs">Ambiente seguro e criptografado</span>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao continuar, você concorda com os{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos</Link>
            {" "}e{" "}
            <Link to="/privacy" className="text-primary hover:underline">Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
