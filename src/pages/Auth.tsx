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
import authBg from "@/assets/auth-porsche.jpg";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with Porsche */}
      <div className="absolute inset-0">
        <img
          src={authBg}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* Subtle dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-background/60" />
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
      
      {/* Glass Login Card */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Glass card with glossy effect */}
        <div 
          className="relative rounded-3xl p-8 backdrop-blur-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(30, 30, 35, 0.85) 0%, rgba(15, 15, 20, 0.95) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Top glossy shine */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              borderRadius: '1.5rem 1.5rem 0 0',
            }}
          />

          {/* Private Core badge */}
          <div className="flex justify-center mb-6 relative">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">PRIVATE CORE</span>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-5">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              LA CASA DARK
            </h1>
            <span className="text-2xl font-bold text-primary mt-1">CORE</span>
            
            <p className="text-base text-foreground mt-4 text-center">
              Acesso ao Núcleo Privado
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Ferramentas usadas por criadores que operam canais dark em escala
            </p>
          </div>


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

            {/* Recover access link */}
            {isLogin && (
              <div className="text-left">
                <button type="button" className="text-primary text-sm hover:underline">
                  Recuperar acesso ao Core
                </button>
                <p className="text-xs text-muted-foreground mt-1 italic">
                  Sessão vinculada à infraestrutura do operador
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold gradient-button text-primary-foreground mt-4"
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

          {/* Motivational text */}
          <p className="text-xs text-muted-foreground text-center mt-4 italic">
            Canais dark não crescem por sorte. Crescem por sistema.
          </p>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6 pt-5 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Acesso restrito · Validação obrigatória" : "Já tem acesso?"}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-sm font-semibold hover:underline mt-1"
            >
              {isLogin ? "Solicitar acesso ao Core" : "Fazer login"}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-5 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs">Ambiente isolado para operações dark</span>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao continuar, você concorda com nossos{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
            {" "}e{" "}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
          </p>

          {/* Footer taglines */}
          <p className="text-xs text-muted-foreground/60 text-center mt-3 italic">
            Operadores reconhecem operadores.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
