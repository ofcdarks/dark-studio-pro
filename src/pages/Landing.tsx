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
  Rocket,
  BarChart3,
  Image,
  FileText,
  Layers,
  ImagePlus,
  FileType,
  Video,
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
  ChevronDown,
  Flame,
  Diamond
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSection, AnimatedItem } from "@/components/landing/AnimatedSection";
import { ParallaxLayer, ParallaxBackground } from "@/components/landing/ParallaxSection";
import { PurchaseNotifications } from "@/components/landing/PurchaseNotifications";
import { AutoChat } from "@/components/landing/AutoChat";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { OperatorsOnline } from "@/components/landing/OperatorsOnline";
import { ParticleBackground } from "@/components/landing/ParticleBackground";
import { GlassCard } from "@/components/landing/GlassCard";
import { AdSenseCard } from "@/components/landing/AdSenseCard";
import FloatingElements from "@/components/landing/FloatingElements";
import { ScrollIndicator } from "@/components/landing/ScrollIndicator";
import { MobileMenu } from "@/components/landing/MobileMenu";
import { ComparisonSlider } from "@/components/landing/ComparisonSlider";

import { Tool3DCard } from "@/components/landing/Tool3DCard";
import { Dream3DCard } from "@/components/landing/Dream3DCard";
import logo from "@/assets/logo.gif";
import demoCoverFuturistic from "@/assets/video-cover-futuristic.jpg";


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
    { icon: Zap, title: "Inteligente", desc: "Automação Avançada", color: "bg-gradient-to-br from-green-500 to-emerald-600" },
    { icon: Clock, title: "24/7", desc: "Suporte Premium", color: "bg-gradient-to-br from-purple-500 to-violet-600" },
    { icon: TrendingUp, title: "Otimizada", desc: "Performance Alta", color: "bg-gradient-to-br from-orange-500 to-amber-600" },
    { icon: Users, title: "Exclusiva", desc: "Comunidade VIP", color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
    { icon: Play, title: "Constantes", desc: "Updates Semanais", color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  ];

  const tools = [
    { icon: BarChart3, title: "Analisador de Títulos Virais", desc: "Análise de títulos com métricas de viralidade e sugestões de otimização.", badge: "POPULAR", color: "bg-gradient-to-br from-green-500 to-emerald-600" },
    { icon: Image, title: "Gerador de Thumbnails 4x", desc: "Crie 4 variações de thumbnails otimizadas para CTR máximo.", badge: "NOVO", color: "bg-gradient-to-br from-orange-500 to-amber-600" },
    { icon: FileText, title: "Gerador de Roteiros", desc: "Roteiros completos com estrutura viral e ganchos de retenção.", color: "bg-gradient-to-br from-emerald-500 to-teal-600" },
    { icon: Layers, title: "Gerador de Prompts Cenas", desc: "Prompts detalhados para cada cena do seu vídeo.", color: "bg-gradient-to-br from-purple-500 to-violet-600" },
    { icon: ImagePlus, title: "Gerador de Imagens Ilimitado", desc: "Criação ilimitada de imagens para seus vídeos.", badge: "∞", color: "bg-gradient-to-br from-pink-500 to-rose-600" },
    { icon: FileType, title: "Gerador de SRT", desc: "Legendas sincronizadas automaticamente em formato SRT.", color: "bg-gradient-to-br from-primary to-accent" },
    { icon: Video, title: "Geração de Vídeo VO3 & Sora", desc: "Integração com VO3 e Sora para geração de vídeos.", badge: "PRO", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { icon: Rocket, title: "Criação de Agente Automático", desc: "Agentes que trabalham 24/7 automatizando suas operações.", badge: "AUTO", color: "bg-gradient-to-br from-amber-500 to-orange-600" },
    { icon: TrendingUp, title: "Analytics Avançado", desc: "Métricas em tempo real: CTR, views, likes, comentários e RPM.", color: "bg-gradient-to-br from-indigo-500 to-purple-600" },
    { icon: Users, title: "Análise de Canais Virais", desc: "Monitore e analise os canais mais virais do seu nicho.", color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
    { icon: FileText, title: "Modelagem de Roteiro Avançada", desc: "Modelagem avançada de roteiros baseados em padrões virais.", badge: "PRO", color: "bg-gradient-to-br from-rose-500 to-pink-600" },
    { icon: Palette, title: "Modelagem de Thumbnail", desc: "Templates e modelagem inteligente de thumbnails.", color: "bg-gradient-to-br from-fuchsia-500 to-purple-600" },
    { icon: Video, title: "Processamento de Vídeos YouTube", desc: "Processamento e análise de vídeos diretamente do YouTube.", color: "bg-gradient-to-br from-red-500 to-rose-600" },
    { icon: Mic, title: "Geração de Áudio (TTS)", desc: "Text-to-Speech com vozes ultra-realistas e naturais.", color: "bg-gradient-to-br from-violet-500 to-purple-600" },
    { icon: FileText, title: "Análise de Transcrições", desc: "Transcreva e analise conteúdo de vídeos automaticamente.", color: "bg-gradient-to-br from-sky-500 to-blue-600" },
    { icon: Search, title: "Explorador de Nicho", desc: "Descubra nichos lucrativos antes da concorrência.", badge: "HOT", color: "bg-gradient-to-br from-lime-500 to-green-600" },
    { icon: Key, title: "Gerenciamento de API Keys", desc: "Gerencie suas API keys com segurança e controle total.", color: "bg-gradient-to-br from-slate-500 to-zinc-600" },
    { icon: Youtube, title: "Integração YouTube Completa", desc: "Upload, gerenciamento e automação direto na plataforma.", color: "bg-gradient-to-br from-red-500 to-red-700" },
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
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Global Floating Elements */}
      <FloatingElements />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <div className="w-14 h-14 rounded-full overflow-hidden relative z-10 border-2 border-primary bg-black">
                  <img src={logo} alt="La Casa Dark CORE" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <button onClick={() => scrollToSection("funcionalidades")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Como Funciona</button>
              <button onClick={() => scrollToSection("planos")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Planos</button>
              <button onClick={() => scrollToSection("faq")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-3 md:hidden">
              <MobileMenu scrollToSection={scrollToSection} />
            </div>

            {/* Desktop CTA */}
            <Link to="/auth" className="hidden md:block">
              <Button className="gradient-button text-primary-foreground font-semibold text-lg h-12 px-8">
                Acessar Core
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-4 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Particle Background - reduced for mobile */}
        <ParticleBackground particleCount={40} className="opacity-40 md:opacity-60" />

        {/* Background Image - Porsche with Parallax */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ParallaxBackground speed={0.15} className="h-[120%] -top-[10%]">
            <img
              src="/images/hero-porsche.jpg?v=20260102"
              alt="Porsche de luxo no fundo da landing page"
              className="h-full w-full object-cover object-center opacity-60 md:opacity-80"
              loading="eager"
            />
          </ParallaxBackground>

          {/* Gradient overlay - left side dark for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          {/* Vertical fade for seamless section transitions */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
        </div>

        {/* Parallax orbs - desktop only */}
        <ParallaxLayer depth={0.3} className="absolute top-32 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float hidden md:block" />
        <ParallaxLayer depth={0.5} className="absolute bottom-0 right-1/4 w-60 md:w-80 h-60 md:h-80 bg-primary/8 rounded-full blur-2xl pointer-events-none hidden lg:block" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 w-full">
          <AnimatedSection animation="fade-right" className="space-y-5 md:space-y-6">

              {/* Warning Badge */}
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-primary/20 border border-primary/30">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-medium text-primary">Fuja dos "marketeiros" e de quem só vende curso!</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block">Escale seus</span>
                <span className="block text-primary">Canais Dark</span>
                <span className="block">com IA</span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Criado por quem <span className="text-primary font-semibold">vive e respira</span> o mercado do YouTube diariamente. Nada de promessas vazias — aqui é <span className="text-primary font-semibold">ferramenta real</span> feita por quem está no campo de batalha.
              </p>

              {/* Quote - hide on mobile */}
              <p className="text-sm md:text-base text-muted-foreground italic hidden sm:block">
                "Enquanto outros vendem sonhos, nós entregamos resultados com tecnologia de ponta."
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-6 md:px-10 text-lg md:text-xl glow-primary hover:scale-105 transition-transform w-full">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                    Solicitar Acesso Elite
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 md:h-16 px-6 md:px-10 text-lg md:text-xl border-border hover:bg-card hover:scale-105 transition-transform w-full sm:w-auto"
                  onClick={() => scrollToSection("demo")}
                >
                  <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Ver Demonstração
                </Button>
              </div>

              {/* Operators Online - Dynamic */}
              <OperatorsOnline />

          </AnimatedSection>

          {/* AdSense Card - hide on very small screens */}
          <AnimatedSection animation="fade-left" delay={200} className="hidden sm:block">
            <AdSenseCard />
          </AnimatedSection>
        </div>

      </section>

      {/* Scroll indicator - mouse style */}
      <ScrollIndicator variant="mouse" />

      {/* Marquee Strip - "A revolução chegou" with shimmer effect */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-primary via-amber-500 to-primary">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Diamond className="w-4 h-4 md:w-5 md:h-5" />
              A REVOLUÇÃO CHEGOU
              <span className="text-primary-foreground/80">•</span>
              NÃO HÁ ESPAÇO PARA AMADORES
            </span>
          ))}
        </div>
      </div>


      {/* Features Strip */}
      <section className="py-12 md:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-8">
            {features.map((feature, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className={`p-4 md:p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 ${index === 0 ? 'ring-1 ring-primary/30' : ''}`}>
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl ${feature.color} flex items-center justify-center mb-3 md:mb-5`}>
                    <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <h3 className="font-bold text-lg md:text-2xl">{feature.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">{feature.desc}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-16 md:py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.2} className="absolute top-0 left-0 w-full h-full hidden md:block">
          <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary/50" />
          <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary/30" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-primary/40" />
        </ParallaxLayer>

        <AnimatedSection className="max-w-5xl mx-auto text-center space-y-8 md:space-y-10">
          <div className="space-y-4 md:space-y-5">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-card border border-border">
              <Rocket className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="text-sm md:text-base font-medium text-primary">VEJA EM AÇÃO</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              Conheça o Poder do
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              La Casa Dark CORE
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.
            </p>
          </div>

          <AnimatedSection animation="scale" delay={200}>
            <Card className="aspect-video bg-card border-primary/30 relative overflow-hidden group cursor-pointer">
              {/* Futuristic demo cover */}
              <img
                src={demoCoverFuturistic}
                alt="Capa futurista da demonstração da plataforma"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-primary/50">
                  <Play className="w-10 h-10 md:w-16 md:h-16 text-primary-foreground ml-1 md:ml-2" fill="currentColor" />
                </div>
              </div>
              
              {/* Bottom info - responsive */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-0">
                <div>
                  <p className="text-primary font-semibold text-sm md:text-lg">DEMONSTRAÇÃO COMPLETA</p>
                  <p className="text-muted-foreground text-xs md:text-base">Duração: 5 minutos</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-muted-foreground">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-base">Tour pelas funcionalidades</span>
                </div>
              </div>
            </Card>

            {/* Bottom bar - stack on mobile */}
            <div className="bg-card rounded-xl p-4 md:p-6 mt-4 md:mt-6 flex flex-col md:flex-row items-start md:items-center justify-between border border-border gap-4">
              <div>
                <h3 className="font-bold text-lg md:text-xl">Tour Completo das Funcionalidades</h3>
                <p className="text-sm md:text-base text-muted-foreground">Veja como criar conteúdo viral em minutos</p>
              </div>
              <Link to="/auth" className="w-full md:w-auto">
                <Button className="gradient-button text-primary-foreground font-semibold text-base md:text-lg h-11 md:h-12 px-5 md:px-6 w-full md:w-auto">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Começar Agora
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          {/* Demo Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 pt-8 md:pt-10">
            {[
              { value: "PRO", label: "Geração de Roteiros" },
              { value: "4x", label: "Thumbnails Premium" },
              { value: "24/7", label: "Automação Total" },
              { value: "Real-time", label: "Analytics Avançado" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Scroll indicator - arrow style */}
      <ScrollIndicator variant="arrow" />

      {/* Dreams Section */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <ParallaxLayer depth={0.4} className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none hidden md:block" />
        
        <div className="max-w-7xl mx-auto text-center space-y-10 md:space-y-14 relative">
          <AnimatedSection className="space-y-4 md:space-y-5">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-card border border-border">
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-primary rotate-45" />
              <span className="text-sm md:text-base font-medium text-primary">REALIZE SEUS SONHOS</span>
              <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-primary -rotate-45" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              O Que Você Pode
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              Conquistar Com YouTube
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Dedicando apenas <span className="text-primary font-semibold">2 a 3 horas por dia</span>, você pode transformar sua vida e conquistar tudo isso com canais Dark no YouTube.
            </p>
          </AnimatedSection>

          {/* Dreams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {dreams.map((dream, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Dream3DCard
                  image={dream.image}
                  title={dream.title}
                  desc={dream.desc}
                />
              </AnimatedItem>
            ))}
          </div>

          {/* CTA */}
          <AnimatedSection animation="scale" delay={400}>
            <div className="space-y-4 md:space-y-5 pt-6 md:pt-10">
              <h3 className="text-2xl md:text-3xl font-bold">
                Tudo isso é <span className="text-primary">possível</span> para você
              </h3>
              <p className="text-base md:text-lg text-muted-foreground">Milhares de criadores já estão vivendo esse estilo de vida</p>
              <Link to="/auth">
                <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-6 md:px-10 mt-4 md:mt-5 text-base md:text-lg">
                  <Check className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  <span className="hidden sm:inline">Faça o teste e comprove você mesmo</span>
                  <span className="sm:hidden">Faça o teste agora</span>
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Middle Marquee Strip */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee-fast whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              FERRAMENTAS PROFISSIONAIS
              <span className="text-primary-foreground/80">•</span>
              RESULTADOS REAIS
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator - dots style */}
      <ScrollIndicator variant="dots" />

      {/* Tools Section */}
      <section id="funcionalidades" className="py-16 md:py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.3} className="absolute top-40 -left-32 w-60 md:w-80 h-60 md:h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none hidden md:block" />
        
        <div className="max-w-7xl mx-auto space-y-10 md:space-y-14 relative">
          <AnimatedSection className="text-center space-y-4 md:space-y-5">
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-primary text-primary-foreground">
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-sm md:text-base font-medium">18+ FUNCIONALIDADES PREMIUM</span>
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              Arsenal Completo para
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              Operações Dark
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Todas as ferramentas que você precisa para criar, otimizar e escalar seus canais de forma automatizada.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {tools.map((tool, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={50}>
                <Tool3DCard
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.desc}
                  badge={tool.badge}
                  color={tool.color}
                  isHighlighted={index === 5}
                />
              </AnimatedItem>
            ))}
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-6 md:pt-10">
            {[
              { icon: Zap, value: "18+", label: "Ferramentas" },
              { icon: ImagePlus, value: "∞", label: "Imagens/Mês" },
              { icon: Clock, value: "24/7", label: "Automação" },
              { icon: Star, value: "5min", label: "Setup Rápido" },
            ].map((stat, i) => (
              <Card key={i} className="p-4 md:p-6 bg-card border-border text-center hover:border-primary/30 transition-all duration-300 group">
                <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-2xl md:text-3xl font-bold text-gradient">{stat.value}</p>
                <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DaVinci Resolve Section - Professional Upgrade */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <ParallaxLayer depth={0.3} className="absolute -top-20 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block" />
        
        <div className="max-w-5xl mx-auto relative">
          <AnimatedSection className="text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30">
              <Video className="w-5 h-5 text-purple-400" />
              <span className="text-sm md:text-base font-medium text-purple-300">WORKFLOW PROFISSIONAL</span>
            </div>
            
            {/* Animated DaVinci Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500 animate-spin-slow blur-md opacity-60" style={{ width: '100px', height: '100px', margin: '-10px' }} />
                {/* Inner circle with icon */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse-glow">
                  <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                    <span className="text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">DR</span>
                  </div>
                </div>
                {/* Orbiting dot */}
                <div className="absolute w-3 h-3 rounded-full bg-primary animate-spin-slow" style={{ top: '50%', left: '-8px', transformOrigin: '48px center' }} />
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Chega de edição
              <span className="block text-purple-400">amadora no celular</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enquanto a maioria perde tempo com templates genéricos de CapCut, 
              nossos operadores dominam o <span className="text-primary font-semibold">DaVinci Resolve 20</span> — 
              o mesmo software usado por Hollywood. Exportação XML nativa, color grading cinematográfico 
              e workflow que separa <span className="text-purple-400 font-semibold">amadores de profissionais</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Amateur Side */}
              <Card className="p-6 md:p-8 bg-card/50 border-destructive/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-destructive/50" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-destructive">Caminho Amador</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Templates prontos e genéricos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Marca d'água em tudo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Qualidade limitada a 1080p
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Zero controle de cor
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Pro Side */}
              <Card className="p-6 md:p-8 bg-card/50 border-primary/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">La Casa Dark CORE</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Exportação XML nativa para DaVinci
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Color grading cinematográfico
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Resolução 4K e HDR
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Workflow profissional completo
                    </li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Interactive Comparison Slider */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-6 text-center">Arraste para ver a diferença</p>
              <ComparisonSlider />
            </div>

            <div className="pt-6">
              <Link to="/auth">
                <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-8 md:px-12 text-lg glow-primary">
                  <Rocket className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  Elevar Meu Nível Agora
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Scroll indicator - line style */}
      <ScrollIndicator variant="line" />

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

      {/* Scroll indicator - mouse style */}
      <ScrollIndicator variant="mouse" />

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

      {/* Scroll indicator - arrow style */}
      <ScrollIndicator variant="arrow" />

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

      {/* Second Marquee Strip - Before Footer */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-primary via-amber-500 to-primary">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee-reverse whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Flame className="w-4 h-4 md:w-5 md:h-5" />
              AUTOMATIZE SUA OPERAÇÃO
              <span className="text-primary-foreground/80">•</span>
              ESCALE SEUS RESULTADOS
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-14">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <div className="w-16 h-16 rounded-full overflow-hidden relative z-10 border-2 border-primary bg-black">
                  <img src={logo} alt="La Casa Dark CORE" className="w-full h-full object-cover" />
                </div>
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
