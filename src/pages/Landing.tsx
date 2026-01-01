import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Zap, 
  Clock, 
  TrendingUp,
  Users,
  AlertTriangle,
  Sparkles,
  BarChart3,
  Image,
  FileText,
  Layers,
  ImagePlus,
  FileType,
  Video,
  Bot,
  Palette,
  Mic,
  Search,
  Key,
  Youtube,
  Check,
  Mail,
  ArrowRight,
  Star,
  Crown,
  ChevronDown
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSection, AnimatedItem } from "@/components/landing/AnimatedSection";
import { ParallaxLayer } from "@/components/landing/ParallaxSection";
import { PurchaseNotifications } from "@/components/landing/PurchaseNotifications";
import { AutoChat } from "@/components/landing/AutoChat";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { OperatorsOnline } from "@/components/landing/OperatorsOnline";
import { ParticleBackground } from "@/components/landing/ParticleBackground";
import { GlassCard } from "@/components/landing/GlassCard";
import logo from "@/assets/logo.gif";

// Dream images
import creditCardImg from "@/assets/dreams/credit-card.jpg";
import firstClassImg from "@/assets/dreams/first-class.jpg";
import luxuryCarImg from "@/assets/dreams/luxury-car.jpg";
import luxuryMansionImg from "@/assets/dreams/luxury-mansion.jpg";
import luxuryWatchImg from "@/assets/dreams/luxury-watch.jpg";
import freedomBeachImg from "@/assets/dreams/freedom-beach.jpg";

const Landing = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    { icon: Zap, title: "Inteligente", desc: "Automação com IA", color: "bg-green-500" },
    { icon: Clock, title: "24/7", desc: "Suporte Premium", color: "bg-purple-500" },
    { icon: TrendingUp, title: "Otimizada", desc: "Performance Alta", color: "bg-orange-500" },
    { icon: Users, title: "Exclusiva", desc: "Comunidade VIP", color: "bg-cyan-500" },
    { icon: Play, title: "Constantes", desc: "Updates Semanais", color: "bg-pink-500" },
  ];

  const tools = [
    { icon: BarChart3, title: "Analisador de Títulos Virais", desc: "Análise de títulos com métricas de viralidade e sugestões de otimização.", badge: "POPULAR", color: "bg-green-500" },
    { icon: Image, title: "Gerador de Thumbnails 4x", desc: "Crie 4 variações de thumbnails otimizadas para CTR máximo.", badge: "NOVO", color: "bg-orange-500" },
    { icon: FileText, title: "Gerador de Roteiros", desc: "Roteiros completos com estrutura viral e ganchos de retenção.", color: "bg-emerald-500" },
    { icon: Layers, title: "Gerador de Prompts Cenas", desc: "Prompts detalhados para cada cena do seu vídeo.", color: "bg-purple-500" },
    { icon: ImagePlus, title: "Gerador de Imagens Ilimitado", desc: "Criação ilimitada de imagens com IA para seus vídeos.", badge: "∞", color: "bg-pink-500" },
    { icon: FileType, title: "Gerador de SRT", desc: "Legendas sincronizadas automaticamente em formato SRT.", color: "bg-primary" },
    { icon: Video, title: "Geração de Vídeo VO3 & Sora", desc: "Integração com VO3 e Sora para geração de vídeos com IA.", badge: "PRO", color: "bg-blue-500" },
    { icon: Bot, title: "Criação de Agente Automático", desc: "Agentes que trabalham 24/7 automatizando suas operações.", badge: "IA", color: "bg-amber-500" },
    { icon: TrendingUp, title: "Analytics Avançado", desc: "Métricas em tempo real: CTR, views, likes, comentários e RPM.", color: "bg-indigo-500" },
    { icon: Users, title: "Análise de Canais Virais", desc: "Monitore e analise os canais mais virais do seu nicho.", color: "bg-teal-500" },
    { icon: FileText, title: "Modelagem de Roteiro com Agente", desc: "IA avançada que modela roteiros baseados em padrões virais.", badge: "IA", color: "bg-rose-500" },
    { icon: Palette, title: "Modelagem de Thumbnail", desc: "Templates e modelagem inteligente de thumbnails.", color: "bg-fuchsia-500" },
    { icon: Video, title: "Processamento de Vídeos YouTube", desc: "Processamento e análise de vídeos diretamente do YouTube.", color: "bg-red-500" },
    { icon: Mic, title: "Geração de Áudio (TTS)", desc: "Text-to-Speech com vozes ultra-realistas e naturais.", color: "bg-violet-500" },
    { icon: FileText, title: "Análise de Transcrições", desc: "Transcreva e analise conteúdo de vídeos automaticamente.", color: "bg-sky-500" },
    { icon: Search, title: "Explorador de Nicho", desc: "Descubra nichos lucrativos antes da concorrência.", badge: "HOT", color: "bg-lime-500" },
    { icon: Key, title: "Gerenciamento de API Keys", desc: "Gerencie suas API keys com segurança e controle total.", color: "bg-slate-500" },
    { icon: Youtube, title: "Integração YouTube Completa", desc: "Upload, gerenciamento e automação direto na plataforma.", color: "bg-red-600" },
  ];

  const dreams = [
    { image: creditCardImg, title: "Cartão Black Ilimitado", desc: "Acesso a benefícios exclusivos e limites sem preocupação" },
    { image: firstClassImg, title: "Viagens Primeira Classe", desc: "Conheça o mundo com conforto e exclusividade" },
    { image: luxuryCarImg, title: "Carros dos Sonhos", desc: "Porsche, BMW, Mercedes... a escolha é sua" },
    { image: luxuryMansionImg, title: "Imóvel de Luxo", desc: "Penthouse com vista para o mar ou mansão" },
    { image: luxuryWatchImg, title: "Relógios de Luxo", desc: "Rolex, Patek Philippe, Audemars Piguet" },
    { image: freedomBeachImg, title: "Liberdade Geográfica", desc: "Trabalhe de qualquer lugar paradisíaco" },
  ];

  const steps = [
    { step: 1, title: "Solicite Acesso", desc: "Preencha o formulário e aguarde a validação da sua conta.", badges: ["Análise de perfil", "Validação em 24h", "Onboarding exclusivo"] },
    { step: 2, title: "Configure seus Canais", desc: "Conecte sua conta do YouTube e configure os parâmetros.", badges: ["Integração automática", "Multi-canal", "Dashboard unificado"] },
    { step: 3, title: "Ative os Agentes", desc: "Coloque os agentes para trabalhar e escale suas operações.", badges: ["Automação 24/7", "IA avançada", "Escalabilidade"] },
    { step: 4, title: "Colete os Lucros", desc: "Acompanhe seus ganhos crescerem enquanto os agentes trabalham.", badges: ["Relatórios em tempo real", "Otimização contínua", "Suporte dedicado"] },
  ];

  const testimonials = [
    { name: "Marina Silva", role: "Trader", earnings: "$11.600/mês", channels: "7 canais", growth: "+520%", quote: "A análise de nichos me ajudou a encontrar oportunidades que ninguém estava explorando. Hoje faturo 5 dígitos." },
    { name: "Pedro Alves", role: "Engenheiro", earnings: "$3.800/mês", channels: "3 canais", growth: "+180%", quote: "Comecei do zero, sem experiência. Em 6 meses já estava vivendo apenas dos canais." },
    { name: "Juliana Santos", role: "Advogada", earnings: "$20.500/mês", channels: "12 canais", growth: "+447%", quote: "O suporte no Telegram é incrível. Sempre que tenho dúvidas, resolvem em minutos." },
    { name: "Carlos Eduardo", role: "Contador", earnings: "$13.800/mês", channels: "10 canais", growth: "+725%", quote: "O sistema de agentes automáticos mudou completamente minha operação. Escala real." },
    { name: "Fernanda Lima", role: "Designer", earnings: "$8.200/mês", channels: "5 canais", growth: "+340%", quote: "As ferramentas de thumbnail e roteiro são incríveis. Meu CTR dobrou em 2 semanas." },
    { name: "Ricardo Mendes", role: "Empresário", earnings: "$25.000/mês", channels: "15 canais", growth: "+890%", quote: "Já testei várias plataformas. Essa é de longe a mais completa e profissional do mercado." },
  ];

  const metrics = [
    { icon: Video, value: "127", label: "Total de Vídeos", status: "ATIVO" },
    { icon: TrendingUp, value: "11.7K", label: "Views Mensais", status: "ATIVO" },
    { icon: Clock, value: "2,340h", label: "Horas Economizadas", status: "ATIVO" },
    { icon: BarChart3, value: "9.9%", label: "CTR Médio" },
    { icon: Users, value: "8,432", label: "Comentários" },
    { icon: Star, value: "67%", label: "Taxa de Retenção" },
  ];

  const faqs = [
    { question: "Os créditos expiram?", answer: "Não, seus créditos nunca expiram. Você pode usar quando quiser." },
    { question: "Posso ajustar minha capacidade?", answer: "Sim, você pode fazer upgrade ou downgrade a qualquer momento." },
    { question: "Como funciona a integração com o YouTube?", answer: "A integração é feita via API oficial do YouTube, de forma segura e automatizada." },
    { question: "O que são os Agentes Virais?", answer: "São IAs que automatizam processos de criação e otimização de conteúdo 24/7." },
    { question: "Existe suporte técnico?", answer: "Sim, oferecemos suporte via Telegram e email, com tempo médio de resposta de 15 minutos." },
    { question: "Posso testar antes de assinar?", answer: "Sim, oferecemos 50 créditos gratuitos para você testar a plataforma." },
  ];

  // Removed static operatorsOnline - now using dynamic component

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <img src={logo} alt="La Casa Dark CORE" className="w-14 h-14 rounded-full relative z-10 border-2 border-primary" />
              </div>
              <span className="font-bold text-xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <button onClick={() => scrollToSection("funcionalidades")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Como Funciona</button>
              <button onClick={() => scrollToSection("planos")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Planos</button>
              <button onClick={() => scrollToSection("faq")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            </div>

            <Link to="/auth">
              <Button className="gradient-button text-primary-foreground font-semibold text-lg h-12 px-8">
                Acessar Core
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-4 relative overflow-hidden">
        {/* Particle Background */}
        <ParticleBackground particleCount={80} className="opacity-60" />

        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-porsche.jpg"
            alt="Porsche de luxo no fundo da landing page"
            className="absolute inset-0 h-full w-full object-cover object-right opacity-50 brightness-90 contrast-110"
            loading="eager"
          />

          {/* Heavy unified dark overlay */}
          <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/95 to-background/60" />
          {/* Strong vertical fade for seamless section transitions */}
          <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/90 via-background/20 to-background" />

          {/* Subtle amber glow accents */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent z-10" />
        </div>

        <ParallaxLayer depth={0.3} className="absolute top-32 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl pointer-events-none animate-float" />
        <ParallaxLayer depth={0.5} className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-start relative z-10">
          <AnimatedSection animation="fade-right" className="space-y-8">
              {/* Private Elite Access Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-base font-medium">PRIVATE ELITE ACCESS</span>
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              {/* Warning Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-primary/20 border border-primary/30">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <span className="text-base font-medium text-primary">Fuja dos "marketeiros" e de quem só vende curso!</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block">Escale seus</span>
                <span className="block text-primary">Canais Dark</span>
                <span className="block">com IA</span>
              </h1>

              {/* Description */}
              <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                Criado por quem <span className="text-primary font-semibold">vive e respira</span> o mercado do YouTube diariamente. Nada de promessas vazias — aqui é <span className="text-primary font-semibold">ferramenta real</span> feita por quem está no campo de batalha.
              </p>

              {/* Quote */}
              <p className="text-base text-muted-foreground italic">
                "Enquanto outros vendem sonhos, nós entregamos resultados com tecnologia de ponta."
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-5">
                <Link to="/auth">
                  <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-16 px-10 text-xl glow-primary hover:scale-105 transition-transform">
                    <Zap className="w-6 h-6 mr-3" />
                    Solicitar Acesso Elite
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-16 px-10 text-xl border-border hover:bg-card hover:scale-105 transition-transform"
                  onClick={() => scrollToSection("demo")}
                >
                  <Play className="w-6 h-6 mr-3" />
                  Ver Demonstração
                </Button>
              </div>

              {/* Operators Online - Dynamic */}
              <OperatorsOnline />

              {/* Feature Badges */}
              <div className="flex flex-wrap gap-4">
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-primary/30">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-base">Melhores APIs do mercado</span>
                </div>
                <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
                  <Check className="w-5 h-5 text-muted-foreground" />
                  <span className="text-base text-muted-foreground">Ferramenta em constante atualização</span>
                </div>
              </div>
          </AnimatedSection>

          {/* AdSense Card */}
          <AnimatedSection animation="fade-left" delay={200}>
            <Card className="p-0 bg-card border-border overflow-hidden">
              {/* Header */}
              <div className="bg-green-600 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">G</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-xl">Google AdSense</p>
                    <p className="text-base text-white/80">Pagamento processado</p>
                  </div>
                </div>
                <span className="px-4 py-2 rounded-full text-sm bg-green-500/30 text-green-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-300" />
                  Ativo
                </span>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8">
                <div className="text-center">
                  <p className="text-base text-muted-foreground">Pagamento Recebido</p>
                  <p className="text-6xl font-bold mt-3">
                    <span className="text-muted-foreground text-3xl">$</span>
                    12,847.56
                  </p>
                  <p className="text-base text-muted-foreground mt-2">USD · 1 de Janeiro, 2026</p>
                </div>

                <div className="space-y-4 border-t border-border pt-6">
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Método de pagamento</span>
                    <span>Transferência bancária</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Conta</span>
                    <span>****4892</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-green-500 flex items-center gap-2">
                      <Check className="w-5 h-5" />
                      Concluído
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 border-t border-border pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">2.4M</p>
                    <p className="text-sm text-muted-foreground">Impressões</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">$5.35</p>
                    <p className="text-sm text-muted-foreground">RPM</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-500">+47%</p>
                    <p className="text-sm text-muted-foreground">vs mês anterior</p>
                  </div>
                </div>

                {/* Next Payment */}
                <div className="bg-card rounded-xl p-5 border border-border text-center">
                  <p className="text-base text-muted-foreground">Próximo pagamento estimado: <span className="text-foreground font-semibold text-xl">$14,230.00</span></p>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>

        {/* Scroll indicator */}
        <div className="flex justify-center mt-20">
          <div className="w-10 h-14 rounded-full border-2 border-border flex items-start justify-center p-2">
            <div className="w-1.5 h-4 rounded-full bg-primary animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {features.map((feature, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className={`p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 ${index === 0 ? 'ring-1 ring-primary/30' : ''}`}>
                  <div className={`w-16 h-16 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-2xl">{feature.title}</h3>
                  <p className="text-base text-muted-foreground mt-1">{feature.desc}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.2} className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary/50" />
          <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary/30" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-primary/40" />
        </ParallaxLayer>

        <AnimatedSection className="max-w-5xl mx-auto text-center space-y-10">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-base font-medium text-primary">VEJA EM AÇÃO</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Conheça o Poder do
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              La Casa Dark CORE
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.
            </p>
          </div>

          <AnimatedSection animation="scale" delay={200}>
            <Card className="aspect-video bg-card border-primary/30 relative overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/50">
                  <Play className="w-16 h-16 text-primary-foreground ml-2" fill="currentColor" />
                </div>
              </div>
              
              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end">
                <div>
                  <p className="text-primary font-semibold text-lg">DEMONSTRAÇÃO COMPLETA</p>
                  <p className="text-muted-foreground text-base">Duração: 5 minutos</p>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-base">Tour pelas funcionalidades</span>
                </div>
              </div>
            </Card>

            {/* Bottom bar */}
            <div className="bg-card rounded-xl p-6 mt-6 flex items-center justify-between border border-border">
              <div>
                <h3 className="font-bold text-xl">Tour Completo das Funcionalidades</h3>
                <p className="text-base text-muted-foreground">Veja como criar conteúdo viral em minutos com IA avançada</p>
              </div>
              <Link to="/auth">
                <Button className="gradient-button text-primary-foreground font-semibold text-lg h-12 px-6">
                  <Zap className="w-5 h-5 mr-2" />
                  Começar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Demo Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10">
            {[
              { value: "IA", label: "Geração de Roteiros" },
              { value: "4x", label: "Thumbnails Premium" },
              { value: "24/7", label: "Automação Total" },
              { value: "Real-time", label: "Analytics Avançado" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
                <p className="text-base text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Dreams Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <ParallaxLayer depth={0.4} className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center space-y-14 relative">
          <AnimatedSection className="space-y-5">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
              <ChevronDown className="w-5 h-5 text-primary rotate-45" />
              <span className="text-base font-medium text-primary">REALIZE SEUS SONHOS</span>
              <ChevronDown className="w-5 h-5 text-primary -rotate-45" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              O Que Você Pode
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              Conquistar Com YouTube
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dedicando apenas <span className="text-primary font-semibold">2 a 3 horas por dia</span>, você pode transformar sua vida e conquistar tudo isso com canais Dark no YouTube.
            </p>
          </AnimatedSection>

          {/* Dreams Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {dreams.map((dream, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className="overflow-hidden group cursor-pointer border-border hover:border-primary/50 transition-all duration-300">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <img 
                      src={dream.image} 
                      alt={dream.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="font-bold text-xl">{dream.title}</h3>
                      <p className="text-base text-muted-foreground">{dream.desc}</p>
                    </div>
                  </div>
                </Card>
              </AnimatedItem>
            ))}
          </div>

          {/* CTA */}
          <AnimatedSection animation="scale" delay={400}>
            <div className="space-y-5 pt-10">
              <h3 className="text-3xl font-bold">
                Tudo isso é <span className="text-primary">possível</span> para você
              </h3>
              <p className="text-lg text-muted-foreground">Milhares de criadores já estão vivendo esse estilo de vida</p>
              <Link to="/auth">
                <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-16 px-10 mt-5 text-lg">
                  <Check className="w-6 h-6 mr-3" />
                  Faça o teste <span className="text-primary-foreground/80 ml-2">e comprove você mesmo os resultados</span>
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Tools Section */}
      <section id="funcionalidades" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.3} className="absolute top-40 -left-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-primary-foreground">
              <Crown className="w-5 h-5" />
              <span className="text-base font-medium">18+ FUNCIONALIDADES PREMIUM</span>
              <Crown className="w-5 h-5" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Arsenal Completo para
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              Operações Dark
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Todas as ferramentas que você precisa para criar, otimizar e escalar seus canais de forma automatizada.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={50}>
                <Card className={`p-6 bg-card border-border hover:border-primary/30 transition-all duration-300 relative ${index === 5 ? 'ring-1 ring-primary/50 bg-primary/5' : ''}`}>
                  {tool.badge && (
                    <span className="absolute top-4 right-4 px-3 py-1 rounded text-sm bg-red-500 text-white font-medium">
                      {tool.badge}
                    </span>
                  )}
                  <div className={`w-14 h-14 rounded-xl ${tool.color} flex items-center justify-center mb-4`}>
                    <tool.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
                  <p className="text-base text-muted-foreground">{tool.desc}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10">
            {[
              { icon: Zap, value: "18+", label: "Ferramentas" },
              { icon: ImagePlus, value: "∞", label: "Imagens/Mês" },
              { icon: Bot, value: "24/7", label: "Automação" },
              { icon: Star, value: "5min", label: "Setup Rápido" },
            ].map((stat, i) => (
              <Card key={i} className="p-6 bg-card border-border text-center">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-base text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Zigzag Timeline */}
      <section id="como-funciona" className="py-24 px-4 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-14">
          <AnimatedSection className="text-center space-y-5">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-primary-foreground">
              <Zap className="w-5 h-5" />
              <span className="text-base font-medium">COMO FUNCIONA</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Do zero ao lucro em
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              4 passos simples
            </h2>
          </AnimatedSection>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-primary/20 transform -translate-x-1/2 hidden md:block" />

            {steps.map((step, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={150}>
                <div className={`flex items-center gap-10 mb-20 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10'}`}>
                    <Card className="p-8 bg-card border-border inline-block text-left">
                      <h3 className="font-bold text-2xl mb-3">{step.title}</h3>
                      <p className="text-lg text-muted-foreground mb-5">{step.desc}</p>
                      <div className="flex flex-wrap gap-3">
                        {step.badges.map((badge, i) => (
                          <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
                            <Check className="w-4 h-4 text-primary" />
                            {badge}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Step number */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shadow-lg shadow-primary/50">
                      {String(step.step).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Spacer for zigzag */}
                  <div className="flex-1 hidden md:block" />
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-14">
          <AnimatedSection className="text-center space-y-5">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-base font-medium text-primary">RESULTADOS COMPROVADOS</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Operadores que estão
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              faturando alto
            </h2>
            <p className="text-xl text-muted-foreground">
              Resultados reais de pessoas que usam o Core para escalar seus canais dark
            </p>
          </AnimatedSection>

          {/* Testimonials Carousel */}
          <TestimonialCarousel testimonials={testimonials} />

          {/* Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-10">
            {[
              { value: "50K+", label: "Vídeos gerados" },
              { value: "847+", label: "Canais gerenciados" },
              { value: "98%", label: "Taxa de satisfação" },
              { value: "$2.3M", label: "Gerados pelos usuários" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-4xl md:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-base text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Metrics Dashboard */}
          <AnimatedSection className="pt-10">
            <Card className="p-8 bg-card border-border">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-bold text-2xl">Dashboard em Tempo Real</h3>
                  <p className="text-base text-muted-foreground">Métricas atualizadas de um operador ativo</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-base text-green-500">Live</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {metrics.map((metric, i) => (
                  <Card key={i} className="p-5 bg-card border-border text-center">
                    {metric.status && (
                      <span className="inline-block px-3 py-1 rounded text-xs bg-green-500/20 text-green-400 mb-3">{metric.status}</span>
                    )}
                    <metric.icon className="w-7 h-7 text-primary mx-auto mb-3" />
                    <p className="text-2xl font-bold">{metric.value}</p>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                  </Card>
                ))}
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.25} className="absolute -top-10 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
              <Star className="w-5 h-5 text-primary" />
              <span className="text-base font-medium">$PRIVATE CORE - Alocação de Recursos</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Defina sua
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">
              Capacidade Operacional
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Os créditos determinam o volume, a frequência e a complexidade das execuções dentro do CORE. <Link to="/auth" className="text-primary underline">Comece com o teste gratuito!</Link>
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Plan */}
            <AnimatedItem index={0} staggerDelay={100}>
              <Card className="p-8 bg-card border-border relative h-full">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground mb-2">50 créditos/mês</p>
                  <h3 className="font-bold text-xl">Acesso Inicial</h3>
                </div>
                <ul className="space-y-3 text-base text-muted-foreground mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground" /> Ambiente de avaliação</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground" /> Recursos limitados</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground" /> Execuções básicas limitadas</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground" /> Análise de vídeos (restrita)</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full h-12 text-base">ATIVAR ACESSO INICIAL</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Start Plan */}
            <AnimatedItem index={1} staggerDelay={100}>
              <Card className="p-8 bg-card border-border relative h-full">
                <div className="mb-6">
                  <p className="text-sm text-primary mb-2">800 créditos/mês</p>
                  <h3 className="font-bold text-xl">START CREATOR</h3>
                </div>
                <ul className="space-y-3 text-base text-muted-foreground mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> 30-50 execuções mensais</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> ~200 min de processamento</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Áudio: até ~30 min</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Até 5 agentes operacionais</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Armazenamento: 10 GB</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button className="gradient-button w-full text-primary-foreground h-12 text-base">ATIVAR CAPACIDADE</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Turbo Plan */}
            <AnimatedItem index={2} staggerDelay={100}>
              <Card className="p-8 bg-card border-primary relative h-full ring-2 ring-primary">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  MAIS POPULAR
                </div>
                <div className="mb-6">
                  <p className="text-sm text-primary mb-2">1.600 créditos/mês</p>
                  <h3 className="font-bold text-xl">TURBO MAKER</h3>
                </div>
                <ul className="space-y-3 text-base text-muted-foreground mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> 80-130 execuções mensais</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> ~400 min de processamento</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Áudio: até ~60 min</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Até 10 agentes operacionais</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Armazenamento: 25 GB</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Geração de imagens premium</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button className="gradient-button w-full text-primary-foreground h-12 text-base">HABILITAR EXECUÇÃO</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Master Plan */}
            <AnimatedItem index={3} staggerDelay={100}>
              <Card className="p-8 bg-card border-border relative h-full">
                <div className="absolute -top-4 right-4 px-3 py-1 rounded text-sm bg-red-500 text-white font-medium">
                  PRO
                </div>
                <div className="mb-6">
                  <p className="text-sm text-primary mb-2">3.200 créditos/mês</p>
                  <h3 className="font-bold text-xl">MASTER PRO</h3>
                </div>
                <ul className="space-y-3 text-base text-muted-foreground mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> 200-250 execuções mensais</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> ~800 min de processamento</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Áudio: até ~120 min</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Agentes ilimitados</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Armazenamento: 50 GB</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> API própria liberada</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Priority support</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground h-12 text-base">ATIVAR INFRAESTRUTURA</Button>
                </Link>
              </Card>
            </AnimatedItem>
          </div>

          {/* Credit Packages */}
          <AnimatedSection className="pt-14">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-base font-medium">Expansão Pontual de Capacidade</span>
              </div>
              <h3 className="text-3xl font-bold mt-5">
                Pacotes de <span className="text-primary">Créditos Avulsos</span>
              </h3>
              <p className="text-lg text-muted-foreground mt-2">Ao final do mês, expanda seus gastos de Alocação</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { credits: "800", label: "Alocação básica" },
                { credits: "1.600", label: "Expansão moderada" },
                { credits: "2.400", label: "Escala Prolongada" },
                { credits: "10.000", label: "Enterprise" },
                { credits: "20.000", label: "Enterprise Plus" },
              ].map((pkg, i) => (
                <Card key={i} className="p-6 bg-card border-border text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <p className="text-sm text-primary mb-2">{pkg.credits} CRÉDITOS</p>
                  <p className="text-base text-muted-foreground">{pkg.label}</p>
                  <Button variant="outline" size="sm" className="mt-4 w-full">ALOCAR CRÉDITOS</Button>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 px-4 scroll-mt-20">
        <div className="max-w-4xl mx-auto space-y-14">
          <AnimatedSection className="text-center space-y-5">
            <h2 className="text-4xl md:text-5xl font-bold">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Tire suas dúvidas sobre o La Casa Dark Core
            </p>
          </AnimatedSection>

          <Accordion type="single" collapsible className="space-y-5">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-xl px-8 bg-card">
                <AccordionTrigger className="hover:no-underline py-6">
                  <span className="text-left text-lg">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-primary text-primary-foreground">
            <Zap className="w-5 h-5" />
            <span className="text-base font-medium">PERÍODO DE TESTE DISPONÍVEL</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold">
            Pronto para
          </h2>
          <h2 className="text-4xl md:text-6xl font-bold text-primary">
            dominar seu nicho?
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Junte-se a <span className="text-primary font-semibold">milhares de criadores</span> que já estão escalando com ferramentas de nível enterprise.
          </p>

          <Link to="/auth">
            <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-18 px-14 text-xl glow-primary">
              <Zap className="w-6 h-6 mr-3" />
              Começar Período de Teste
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-8 text-base text-muted-foreground">
            <span className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              Suporte 24/7
            </span>
            <span className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary" />
              Teste grátis para começar
            </span>
            <span className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              Comunidade exclusiva
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-14">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <img src={logo} alt="La Casa Dark CORE" className="w-16 h-16 rounded-full relative z-10 border-2 border-primary" />
              </div>
              <span className="font-bold text-2xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            <p className="text-lg text-muted-foreground">
              A plataforma mais completa para criação e gestão de canais dark no YouTube. Ferramentas de IA, automação e analytics em um só lugar.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Youtube className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Users className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">Navegação</h4>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li><button onClick={() => scrollToSection("funcionalidades")} className="hover:text-foreground transition-colors">Funcionalidades</button></li>
              <li><button onClick={() => scrollToSection("como-funciona")} className="hover:text-foreground transition-colors">Como Funciona</button></li>
              <li><button onClick={() => scrollToSection("planos")} className="hover:text-foreground transition-colors">Planos</button></li>
              <li><button onClick={() => scrollToSection("faq")} className="hover:text-foreground transition-colors">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">Contato</h4>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li>
                <span className="text-foreground">Email:</span><br />
                suporte@lacasadark.com
              </li>
              <li>
                <span className="text-foreground">Horário:</span><br />
                Seg-Sex, 9h às 18h
              </li>
            </ul>
            <Card className="mt-5 p-5 bg-primary/10 border-primary/30">
              <p className="font-semibold text-base">Período de Teste</p>
              <p className="text-sm text-muted-foreground">Experimente gratuitamente antes de assinar!</p>
            </Card>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-14 pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-5 text-base text-muted-foreground">
          <p>© 2026 La Casa Dark CORE. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* Purchase Notifications */}
      <PurchaseNotifications />

      {/* Auto Chat */}
      <AutoChat />
    </div>
  );
};

export default Landing;
