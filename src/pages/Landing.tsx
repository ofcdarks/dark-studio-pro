import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Zap, 
  Clock, 
  HeadphonesIcon, 
  CreditCard, 
  Plane, 
  Home, 
  Watch, 
  Globe,
  BarChart3,
  Image,
  FileText,
  Layers,
  ImagePlus,
  FileType,
  Video,
  Bot,
  TrendingUp,
  Users,
  Palette,
  Mic,
  Search,
  Key,
  Youtube,
  Shield,
  Check,
  Mail,
  ArrowRight
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSection, AnimatedItem } from "@/components/landing/AnimatedSection";
import { ParallaxSection, ParallaxBackground, ParallaxLayer } from "@/components/landing/ParallaxSection";
import logo from "@/assets/logo.gif";

const Landing = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const tools = [
    { icon: BarChart3, title: "Analisador de Títulos Virais", desc: "Análise de títulos com métricas de viralidade e sugestões de otimização.", badge: "POPULAR" },
    { icon: Image, title: "Gerador de Thumbnails 4x", desc: "Crie 4 variações de thumbnails otimizadas para CTR máximo." },
    { icon: FileText, title: "Gerador de Roteiros", desc: "Roteiros completos com estrutura viral e ganchos de retenção.", badge: "NOVO" },
    { icon: Layers, title: "Gerador de Prompts Cenas", desc: "Prompts detalhados para cada cena do seu vídeo." },
    { icon: ImagePlus, title: "Gerador de Imagens Ilimitado", desc: "Criação ilimitada de imagens com IA para seus vídeos." },
    { icon: FileType, title: "Gerador de SRT", desc: "Legendas sincronizadas automaticamente em formato SRT." },
    { icon: Video, title: "Geração de Vídeo VO3 & Sora", desc: "Integração com VO3 e Sora para geração de vídeos com IA." },
    { icon: Bot, title: "Criação de Agente Automático", desc: "Agentes que trabalham 24/7 automatizando suas operações." },
    { icon: TrendingUp, title: "Analytics Avançado", desc: "Métricas em tempo real: CTR, views, likes, comentários e RPM." },
    { icon: Users, title: "Análise de Canais Virais", desc: "Monitore e analise os canais mais virais do seu nicho." },
    { icon: FileText, title: "Modelagem de Roteiro com Agente", desc: "IA avançada que modela roteiros baseados em padrões virais." },
    { icon: Palette, title: "Modelagem de Thumbnail", desc: "Templates e modelagem inteligente de thumbnails." },
    { icon: Video, title: "Processamento de Vídeos", desc: "Processamento otimizado para seus vídeos." },
    { icon: Mic, title: "Geração de Áudio (TTS)", desc: "Text-to-Speech com vozes ultra-realistas e naturais." },
    { icon: FileText, title: "Análise de Transcrições", desc: "Transcreva e analise conteúdo de vídeos automaticamente." },
    { icon: Search, title: "Explorador de Nicho", desc: "Descubra nichos lucrativos antes da concorrência." },
    { icon: Key, title: "Gerenciamento de API Keys", desc: "Gerencie suas API keys com segurança e controle total." },
    { icon: Youtube, title: "Integração YouTube Completa", desc: "Upload, gerenciamento e automação direto na plataforma." },
  ];

  const dreams = [
    { icon: CreditCard, title: "Cartão Black Ilimitado", desc: "Acesso a benefícios exclusivos e limites sem preocupação" },
    { icon: Plane, title: "Viagens Primeira Classe", desc: "Conheça o mundo com conforto e exclusividade" },
    { icon: Home, title: "Imóvel de Luxo", desc: "Penthouse com vista para o mar ou mansão" },
    { icon: Watch, title: "Relógios de Luxo", desc: "Rolex, Patek Philippe, Audemars Piguet" },
  ];

  const steps = [
    { step: 1, title: "Solicite Acesso", desc: "Preencha o formulário e aguarde a validação da sua conta." },
    { step: 2, title: "Configure seus Canais", desc: "Conecte sua conta do YouTube e configure os parâmetros. Integração automática Multi-canal Dashboard unificado." },
    { step: 3, title: "Ative os Agentes", desc: "Coloque os agentes para trabalhar e escale suas operações. Automação 24/7 IA avançada." },
    { step: 4, title: "Colete os Lucros", desc: "Acompanhe seus ganhos crescerem enquanto os agentes trabalham." },
  ];

  const metrics = [
    { label: "Total de Vídeos", value: "127", status: "ATIVO" },
    { label: "Total de Views", value: "11.7K", status: "ATIVO" },
    { label: "Horas Economizadas", value: "2,340h", status: "ATIVO" },
    { label: "CTR Médio", value: "9.9%" },
    { label: "Comentários", value: "8,432" },
    { label: "Taxa de Retenção", value: "67%" },
  ];

  const creditPackages = [
    { credits: "800", label: "Alocação básica" },
    { credits: "1.600", label: "Expansão moderada" },
    { credits: "2.400", label: "Escala prolongada" },
    { credits: "10.000", label: "Enterprise" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden glow-primary">
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection("funcionalidades")} className="text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-muted-foreground hover:text-foreground transition-colors">Como Funciona</button>
              <button onClick={() => scrollToSection("planos")} className="text-muted-foreground hover:text-foreground transition-colors">Planos</button>
              <button onClick={() => scrollToSection("faq")} className="text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            </div>

            <Link to="/auth">
              <Button className="gradient-button text-primary-foreground font-semibold">
                Acessar Core
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <ParallaxBackground speed={0.2}>
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        </ParallaxBackground>
        <ParallaxLayer depth={0.3} className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <ParallaxLayer depth={0.5} className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <AnimatedSection animation="fade-right" className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">PRIVATE ELITE ACCESS</span>
            </div>
            
            <div className="space-y-4">
              <p className="text-lg text-muted-foreground">Fuja dos "marketeiros" e de quem só vende curso!</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Escale seus Canais Dark com <span className="text-gradient">IA</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Criado por quem vive e respira o mercado do YouTube diariamente. Nada de promessas vazias — aqui é ferramenta real feita por quem está no campo de batalha.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 px-8 text-lg glow-primary hover:scale-105 transition-transform">
                  Solicitar Acesso Elite
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-8 text-lg border-border hover:bg-card hover:scale-105 transition-transform"
                onClick={() => scrollToSection("demo")}
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Demonstração
              </Button>
            </div>
          </AnimatedSection>

          {/* Stats Card */}
          <AnimatedSection animation="fade-left" delay={200}>
            <Card className="p-6 bg-card/90 backdrop-blur border-border space-y-4 hover:shadow-amber transition-shadow duration-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm">Google AdSense</span>
                </div>
                <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Ativo</span>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Pagamento processado</span>
                  <span className="text-sm text-green-400">Pagamento Recebido</span>
                </div>
                <div className="text-3xl font-bold text-primary">$ 12,847.56</div>
                <div className="text-sm text-muted-foreground">USD · 1 de Janeiro, 2026</div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-border pt-4">
                <div>
                  <span className="text-muted-foreground">Método de pagamento</span>
                  <p>Transferência bancária</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Conta</span>
                  <p>****4892</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <p className="text-green-400">Concluído</p>
                </div>
              </div>

              <div className="bg-card/50 rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Impressões</p>
                    <p className="text-2xl font-bold">2.4M</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RPM</p>
                    <p className="text-2xl font-bold text-primary">$5.35</p>
                  </div>
                  <div className="px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm">
                    +47%
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Operadores online: JM, CS, MF, AC, MT, LP, RS, GR</p>
                <p className="text-primary mt-1">Próximo pagamento: $14,230.00</p>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Features Highlights */}
      <section className="py-16 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Melhores APIs do mercado", desc: "Ferramenta em constante atualização" },
              { icon: Clock, title: "Inteligente 24/7", desc: "Automação Otimizada" },
              { icon: HeadphonesIcon, title: "Suporte", desc: "Atendimento dedicado" },
            ].map((item, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={150}>
                <div className="flex items-center gap-4 p-6 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-amber transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-4 scroll-mt-20">
        <AnimatedSection className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <span className="text-primary font-semibold">VEJA EM AÇÃO</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Conheça o Poder do LaCasa <span className="text-gradient">DarkCORE</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.
            </p>
          </div>

          <AnimatedSection animation="scale" delay={200}>
            <Card className="aspect-video bg-card/50 border-border relative overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-125 transition-transform duration-500 border border-primary/30">
                  <Play className="w-10 h-10 text-primary ml-1" />
                </div>
                <p className="mt-4 text-muted-foreground text-sm">DEMONSTRAÇÃO COMPLETA</p>
                <p className="text-lg font-semibold mt-2">Tour pelas funcionalidades</p>
                <p className="text-sm text-muted-foreground">Duração: 5 minutos</p>
              </div>
            </Card>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={400}>
            <div className="bg-card/50 rounded-xl p-6 border border-border">
              <h3 className="font-bold text-lg mb-2">Tour Completo das Funcionalidades</h3>
              <p className="text-muted-foreground mb-4">Veja como criar conteúdo viral em minutos com IA avançada</p>
              <Link to="/auth">
                <Button className="gradient-button text-primary-foreground font-semibold hover:scale-105 transition-transform">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </AnimatedSection>
      </section>

      {/* Dreams Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-card/50 to-transparent relative overflow-hidden">
        <ParallaxLayer depth={0.4} className="absolute -top-20 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <ParallaxLayer depth={0.6} className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center space-y-12 relative">
          <AnimatedSection className="space-y-4">
            <span className="text-primary font-semibold">REALIZE SEUS SONHOS</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              O Que Você Pode Conquistar Com YouTube
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Dedicando apenas 2 a 3 horas por dia, você pode transformar sua vida e conquistar tudo isso com canais Dark no YouTube.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dreams.map((item, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className="p-6 bg-card border-border hover:border-primary/50 hover:-translate-y-2 transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>

          <AnimatedSection animation="scale" delay={400}>
            <Card className="p-8 bg-card/50 border-primary/30 max-w-md mx-auto hover:glow-primary transition-shadow duration-500">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-xl mb-2">Liberdade Geográfica</h3>
              <p className="text-muted-foreground">Trabalhe de qualquer lugar paradisíaco</p>
              <p className="text-primary font-semibold mt-4">Tudo isso é possível para você</p>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Tools Section */}
      <section id="funcionalidades" className="py-20 px-4 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.3} className="absolute top-40 -left-32 w-72 h-72 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <ParallaxLayer depth={0.5} className="absolute bottom-20 -right-32 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12 relative">
          <AnimatedSection className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">
              Arsenal Completo para Operações Dark
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Todas as ferramentas que você precisa para criar, otimizar e escalar seus canais de forma automatizada.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={50}>
                <Card className="p-6 bg-card border-border hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group relative h-full">
                  {tool.badge && (
                    <span className="absolute top-4 right-4 px-2 py-1 rounded text-xs bg-primary/20 text-primary">
                      {tool.badge}
                    </span>
                  )}
                  <tool.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold mb-2">{tool.title}</h3>
                  <p className="text-sm text-muted-foreground">{tool.desc}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
            {[
              { value: "18+", label: "Ferramentas" },
              { value: "∞", label: "Imagens/Mês" },
              { value: "24/7", label: "Automação" },
              { value: "5min", label: "Setup Rápido" },
            ].map((stat, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className="p-6 bg-card border-border text-center hover:border-primary/50 transition-colors">
                  <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 px-4 bg-card/30 scroll-mt-20">
        <div className="max-w-5xl mx-auto space-y-12">
          <AnimatedSection className="text-center space-y-4">
            <span className="text-primary font-semibold">COMO FUNCIONA</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Do zero ao lucro em simples passos
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <AnimatedItem key={item.step} index={index} staggerDelay={150}>
                <div className="relative">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl hover:scale-110 transition-transform">
                      {item.step}
                    </div>
                    {item.step < 4 && (
                      <div className="hidden lg:block flex-1 h-0.5 bg-gradient-to-r from-primary to-transparent" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>

          <AnimatedSection animation="scale" delay={400}>
            <Card className="p-6 bg-card border-primary/30 max-w-md mx-auto text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Relatórios em tempo real</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Otimização contínua</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Suporte dedicado</span>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <ParallaxLayer depth={0.35} className="absolute top-0 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <ParallaxLayer depth={0.45} className="absolute bottom-0 right-1/3 w-64 h-64 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12 relative">
          <AnimatedSection className="text-center space-y-4">
            <span className="text-primary font-semibold">RESULTADOS COMPROVADOS</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Operadores que estão faturando alto
            </h2>
            <p className="text-muted-foreground">
              Resultados reais de pessoas que usam o Core para escalar seus canais dark
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-8">
            <AnimatedSection animation="fade-right">
              <Card className="p-8 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold">MS</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Marina Silva</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">$11.600/mês</span>
                      <span>•</span>
                      <span>7 canais</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "A análise de nichos me ajudou a encontrar oportunidades que ninguém estava explorando. Hoje faturo 5 dígitos."
                </p>
                <div className="mt-4 px-3 py-1 rounded bg-green-500/20 text-green-400 text-sm inline-block">
                  +520%
                </div>
              </Card>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={200}>
              <Card className="p-8 bg-card border-border hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xl font-bold">LM</span>
                  </div>
                  <div>
                    <h3 className="font-bold">Lucas Mendes</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-primary font-semibold">$42.400/mês</span>
                      <span>•</span>
                      <span>15 canais</span>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Gerencio 15 canais com a mesma equipe que antes mal dava conta de 3. A automação mudou tudo."
                </p>
              </Card>
            </AnimatedSection>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-8">
            {metrics.map((metric, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={80}>
                <Card className="p-4 bg-card border-border text-center hover:border-primary/50 transition-colors">
                  {metric.status && (
                    <span className="text-xs text-green-400 bg-green-500/20 px-2 py-0.5 rounded mb-2 inline-block">{metric.status}</span>
                  )}
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-20 px-4 bg-card/30 scroll-mt-20 relative overflow-hidden">
        <ParallaxLayer depth={0.25} className="absolute -top-10 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <ParallaxLayer depth={0.4} className="absolute -bottom-20 left-0 w-80 h-80 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-12 relative">
          <AnimatedSection className="text-center space-y-4">
            <span className="text-primary font-semibold">$PRIVATE CORE - Alocação de Recursos</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Defina sua Capacidade Operacional
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os créditos determinam o volume, a frequência e a complexidade das execuções dentro do CORE. Comece com o teste gratuito!
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan */}
            <AnimatedItem index={0} staggerDelay={100}>
              <Card className="p-6 bg-card border-border relative h-full hover:border-primary/30 transition-colors">
                <div className="mb-4">
                  <h3 className="font-bold text-lg">Acesso Inicial</h3>
                  <p className="text-3xl font-bold text-primary mt-2">50</p>
                  <p className="text-sm text-muted-foreground">créditos/mês</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>Recursos limitados</li>
                  <li>Não representa o ambiente completo</li>
                  <li>Execuções básicas limitadas</li>
                  <li>Análise de vídeos (restrita)</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button variant="outline" className="w-full hover:scale-105 transition-transform">ATIVAR ACESSO INICIAL</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Start Plan */}
            <AnimatedItem index={1} staggerDelay={100}>
              <Card className="p-6 bg-card border-border relative h-full hover:border-primary/30 transition-colors">
                <div className="mb-4">
                  <h3 className="font-bold text-lg">START CREATOR</h3>
                  <p className="text-3xl font-bold text-primary mt-2">800</p>
                  <p className="text-sm text-muted-foreground">créditos/mês</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>30-50 execuções mensais</li>
                  <li>~200 min de processamento</li>
                  <li>Áudio: até ~30 min</li>
                  <li>Até 5 agentes operacionais</li>
                  <li>Armazenamento: 10 GB</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button className="gradient-button w-full text-primary-foreground hover:scale-105 transition-transform">ATIVAR CAPACIDADE</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Turbo Plan */}
            <AnimatedItem index={2} staggerDelay={100}>
              <Card className="p-6 bg-card border-primary/50 relative h-full ring-2 ring-primary/30 hover:glow-primary transition-shadow">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  MAIS POPULAR
                </span>
                <div className="mb-4">
                  <h3 className="font-bold text-lg">TURBO MAKER</h3>
                  <p className="text-3xl font-bold text-primary mt-2">1.600</p>
                  <p className="text-sm text-muted-foreground">créditos/mês</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>60-125 execuções mensais</li>
                  <li>~500 min de processamento</li>
                  <li>Áudio: até ~1-2h</li>
                  <li>Transcrição ilimitada</li>
                  <li>Até 15 agentes</li>
                  <li>Armazenamento: 20 GB</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button className="gradient-button w-full text-primary-foreground glow-primary hover:scale-105 transition-transform">HABILITAR EXECUÇÃO</Button>
                </Link>
              </Card>
            </AnimatedItem>

            {/* Pro Plan */}
            <AnimatedItem index={3} staggerDelay={100}>
              <Card className="p-6 bg-card border-border relative h-full hover:border-primary/30 transition-colors">
                <span className="absolute top-4 right-4 px-2 py-1 bg-primary/20 text-primary text-xs font-bold rounded">
                  PRO
                </span>
                <div className="mb-4">
                  <h3 className="font-bold text-lg">MASTER PRO</h3>
                  <p className="text-3xl font-bold text-primary mt-2">2.400</p>
                  <p className="text-sm text-muted-foreground">créditos/mês</p>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li>120-250 execuções mensais</li>
                  <li>~800 min de processamento</li>
                  <li>Áudio: 3h+</li>
                  <li>Agentes ilimitados</li>
                  <li>API própria liberada</li>
                  <li>Analytics enterprise</li>
                </ul>
                <Link to="/auth" className="block">
                  <Button className="gradient-button w-full text-primary-foreground hover:scale-105 transition-transform">HABILITAR EXECUÇÃO</Button>
                </Link>
              </Card>
            </AnimatedItem>
          </div>

          {/* Credit Packages */}
          <AnimatedSection animation="fade-up" delay={400}>
            <div className="mt-12">
              <div className="text-center space-y-4 mb-8">
                <h3 className="text-2xl font-bold">Expansão Pontual de Capacidade</h3>
                <p className="text-muted-foreground">Pacotes de Créditos Avulsos - Reforço temporário para picos de execução</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {creditPackages.map((pkg, index) => (
                  <AnimatedItem key={index} index={index} staggerDelay={100}>
                    <Card className="p-6 bg-card border-border text-center hover:border-primary/50 hover:-translate-y-1 transition-all">
                      <p className="text-2xl font-bold text-primary">{pkg.credits}</p>
                      <p className="text-sm text-muted-foreground mb-4">CRÉDITOS</p>
                      <p className="text-xs text-muted-foreground mb-4">{pkg.label}</p>
                      <Link to="/auth">
                        <Button variant="outline" size="sm" className="w-full hover:scale-105 transition-transform">ALOCAR CRÉDITOS</Button>
                      </Link>
                    </Card>
                  </AnimatedItem>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 scroll-mt-20">
        <AnimatedSection className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Perguntas Frequentes</h2>
            <p className="text-muted-foreground">Tire suas dúvidas sobre o La Casa Dark Core</p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              { q: "Os créditos expiram?", a: "Os créditos mensais do seu plano não acumulam para o próximo mês. Já os créditos avulsos adquiridos em pacotes não expiram e podem ser utilizados a qualquer momento." },
              { q: "Posso ajustar minha capacidade?", a: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudanças entram em vigor no próximo ciclo de cobrança." },
              { q: "Como funciona a integração com o YouTube?", a: "Basta conectar sua conta do YouTube através da nossa integração OAuth segura. Após a conexão, você terá acesso completo para gerenciar uploads, analytics e automações." },
              { q: "O que são os Agentes Virais?", a: "Os Agentes Virais são assistentes de IA que automatizam tarefas repetitivas como criação de roteiros, análise de títulos e monitoramento de métricas, trabalhando 24/7 para você." },
              { q: "Existe suporte técnico?", a: "Sim! Oferecemos suporte dedicado via chat e email. Usuários PRO têm acesso a suporte prioritário com tempo de resposta reduzido." },
              { q: "Posso testar antes de assinar?", a: "Sim! Oferecemos um período de teste gratuito com 50 créditos para você conhecer a plataforma antes de escolher um plano." },
            ].map((item, index) => (
              <AccordionItem key={index} value={String(index + 1)} className="bg-card border border-border rounded-lg px-6 data-[state=open]:border-primary/50 transition-colors">
                <AccordionTrigger className="hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </AnimatedSection>
      </section>

      {/* CTA Section */}
      <AnimatedSection className="py-20 px-4 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 animate-pulse">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">PERÍODO DE TESTE DISPONÍVEL</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold">
            Pronto para dominar seu nicho?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Junte-se a milhares de criadores que já estão escalando com ferramentas de nível enterprise.
          </p>

          <Link to="/auth">
            <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 px-8 text-lg glow-primary hover:scale-110 transition-transform">
              Começar Período de Teste
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="w-4 h-4 text-primary" />
              <span>Suporte 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Teste grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Comunidade exclusiva</span>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden">
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold">La Casa Dark <span className="text-primary">CORE</span></span>
              </div>
              <p className="text-sm text-muted-foreground">
                A plataforma mais completa para criação e gestão de canais dark no YouTube.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Navegação</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => scrollToSection("funcionalidades")} className="hover:text-foreground transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => scrollToSection("como-funciona")} className="hover:text-foreground transition-colors">Como Funciona</button></li>
                <li><button onClick={() => scrollToSection("planos")} className="hover:text-foreground transition-colors">Planos</button></li>
                <li><button onClick={() => scrollToSection("faq")} className="hover:text-foreground transition-colors">FAQ</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  suporte@lacasadark.com
                </li>
                <li>Horário: Seg-Sex, 9h às 18h</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Período de Teste</h4>
              <p className="text-sm text-muted-foreground mb-4">Experimente gratuitamente antes de assinar!</p>
              <Link to="/auth">
                <Button className="gradient-button text-primary-foreground hover:scale-105 transition-transform">
                  Começar Agora
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 La Casa Dark CORE. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
