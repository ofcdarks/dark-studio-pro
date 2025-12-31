import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Crown, 
  ArrowLeft,
  Sparkles,
  Clock,
  Shield,
  Infinity
} from "lucide-react";

interface PlanData {
  id: string;
  plan_name: string;
  monthly_credits: number | null;
  price_amount: number | null;
  is_annual: boolean | null;
  permissions: Record<string, boolean>;
  stripe_price_id: string | null;
}

const CREDIT_PACKAGES = [
  { credits: 1000, price: 99.90, label: "Reforço rápido" },
  { credits: 2500, price: 149.90, label: "Expansão" },
  { credits: 5000, price: 249.90, label: "Boost" },
  { credits: 10000, price: 399.90, label: "Mega reforço" },
  { credits: 20000, price: 699.90, label: "Operação de alto volume" },
];

const PLAN_FEATURES = [
  { key: "analyze_videos", label: "Análise de vídeos" },
  { key: "transcription", label: "Transcrição" },
  { key: "title_generation", label: "Geração de títulos" },
  { key: "thumbnail_generation", label: "Geração de Thumbnails" },
  { key: "script_generation", label: "Geração de roteiros" },
  { key: "voice_generation", label: "Geração de áudio" },
  { key: "video_generation", label: "Geração de vídeo" },
  { key: "batch_images", label: "Imagens em lote" },
  { key: "channel_monitoring", label: "Monitoramento de canais" },
  { key: "youtube_integration", label: "Integração YouTube" },
  { key: "viral_library", label: "Biblioteca de virais" },
  { key: "viral_agents", label: "Agentes virais" },
  { key: "api_own", label: "API própria liberada" },
];

const FAQ_ITEMS = [
  {
    question: "Os créditos expiram?",
    answer: "Créditos de execução recorrente expiram ao final do ciclo ativo. Créditos de expansão pontual não expiram."
  },
  {
    question: "Posso ajustar minha capacidade?",
    answer: "Sim. A capacidade pode ser ampliada ou reduzida conforme sua necessidade operacional."
  },
  {
    question: "O que acontece ao atingir o limite?",
    answer: "As execuções são suspensas até nova alocação de créditos."
  },
  {
    question: "Posso combinar planos e pacotes?",
    answer: "Sim. Pacotes funcionam como reforço adicional sobre qualquer capacidade ativa."
  },
];

const COMPARISON_DATA = [
  { feature: "Análises", inicial: "50", start: "50-85", turbo: "1.000", master: "2.400" },
  { feature: "Roteiros/mês", inicial: "Básico", start: "ad 45", turbo: "0-min", master: "25-min" },
  { feature: "Valor (mês)", inicial: "R$ 0", start: "~350", turbo: "~900", master: "~1.500" },
  { feature: "Áudio", inicial: "-", start: "35-mín", turbo: "1-14h", master: "Ilimitado" },
  { feature: "Transcrição", inicial: "-", start: "30-min", turbo: "Ilimitado", master: "Ilimitado" },
  { feature: "Agentes", inicial: "1", start: "3", turbo: "10", master: "Ilimitado" },
];

export default function PlansCredits() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_permissions")
        .select("*")
        .order("monthly_credits", { ascending: true });

      if (error) throw error;
      const typedPlans: PlanData[] = (data || []).map(p => ({
        ...p,
        permissions: (p.permissions as Record<string, boolean>) || {}
      }));
      setPlans(typedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const monthlyPlans = plans.filter(p => !p.is_annual);
  const annualPlans = plans.filter(p => p.is_annual);

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("master")) return Crown;
    if (planName.toLowerCase().includes("turbo")) return Zap;
    if (planName.toLowerCase().includes("start")) return Star;
    return Sparkles;
  };

  const getPlanHighlight = (planName: string) => {
    return planName.toLowerCase().includes("turbo");
  };

  const calculateAnnualSavings = (monthlyPrice: number) => {
    const annualPrice = monthlyPrice * 10; // 2 meses grátis
    const savings = monthlyPrice * 2;
    return { annualPrice, savings };
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-playfair font-bold text-foreground">Planos e Créditos</h1>
                  <p className="text-sm text-muted-foreground">Gerencie sua capacidade operacional</p>
                </div>
              </div>
              <Badge variant="outline" className="border-primary text-primary">
                PRIVATE CORE
              </Badge>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-4">
            <Badge className="bg-primary/20 text-primary border-primary">
              <Zap className="w-3 h-3 mr-1" />
              PRIVATE CORE - Alocação de Recursos
            </Badge>
            <h2 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">
              Defina sua Capacidade Operacional
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Os créditos determinam o volume, a frequência e a complexidade das execuções dentro do CORE.
              Selecione a capacidade adequada ao seu ritmo de operação.
            </p>
          </section>

          {/* Monthly Plans Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xl font-semibold text-foreground">
                  Execução Recorrente (Capacidade Mensal)
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">Execução recorrente com recursos mensais</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Free Plan */}
              <Card className="border-border bg-card relative overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-medium text-foreground">Acesso Inicial</CardTitle>
                  <div className="space-y-1">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">
                      50 créditos/mês
                    </Badge>
                    <div className="text-2xl font-bold text-foreground">
                      R$0 <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Recurso Introdutório - Ideal para experimentar o sistema
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      Ambiente de avaliação
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      Ferramentas limitadas
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" />
                      Análise de vídeos (restrito)
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4 text-destructive" />
                      Geração de áudio
                    </li>
                    <li className="flex items-center gap-2 text-muted-foreground">
                      <X className="w-4 h-4 text-destructive" />
                      Armazenamento 10 GB
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full">
                    ATIVAR ACESSO INICIAL
                  </Button>
                </CardContent>
              </Card>

              {/* Dynamic Plans from Database */}
              {monthlyPlans.map((plan) => {
                const Icon = getPlanIcon(plan.plan_name);
                const isHighlighted = getPlanHighlight(plan.plan_name);
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`border-border bg-card relative overflow-hidden ${
                      isHighlighted ? "ring-2 ring-primary border-primary" : ""
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                          POPULAR
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {plan.plan_name.toUpperCase()}
                      </CardTitle>
                      <div className="space-y-1">
                        <Badge className="bg-primary/20 text-primary border-primary">
                          {plan.monthly_credits?.toLocaleString()} créditos/mês
                        </Badge>
                        <div className="text-2xl font-bold text-foreground">
                          R${plan.price_amount?.toFixed(2)} 
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {PLAN_FEATURES.slice(0, 6).map((feature) => {
                          const hasFeature = plan.permissions?.[feature.key] ?? false;
                          return (
                            <li key={feature.key} className="flex items-center gap-2 text-muted-foreground">
                              {hasFeature ? (
                                <Check className="w-4 h-4 text-primary" />
                              ) : (
                                <X className="w-4 h-4 text-destructive" />
                              )}
                              {feature.label}
                            </li>
                          );
                        })}
                      </ul>
                      <Button 
                        className={`w-full ${
                          isHighlighted 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : ""
                        }`}
                        variant={isHighlighted ? "default" : "outline"}
                      >
                        ATIVAR CAPACIDADE
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Annual Plans Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h3 className="text-xl font-semibold text-foreground">
                  Execução Prolongada (Capacidade Anual)
                </h3>
                <Badge className="bg-green-500/20 text-green-400 border-green-500">
                  Economize
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Execução prolongada com otimização de recursos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {annualPlans.length > 0 ? annualPlans.map((plan) => {
                const Icon = getPlanIcon(plan.plan_name);
                const isHighlighted = getPlanHighlight(plan.plan_name);
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`border-border bg-card relative overflow-hidden ${
                      isHighlighted ? "ring-2 ring-primary border-primary" : ""
                    }`}
                  >
                    {isHighlighted && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                          POPULAR
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        {plan.plan_name.toUpperCase()}
                      </CardTitle>
                      <div className="space-y-1">
                        <Badge className="bg-primary/20 text-primary border-primary">
                          {(plan.monthly_credits * 12)?.toLocaleString()} créditos/ano
                        </Badge>
                        <div className="text-2xl font-bold text-foreground">
                          R${plan.price_amount?.toFixed(2)} 
                          <span className="text-sm font-normal text-muted-foreground">/ano</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <Sparkles className="w-3 h-3" />
                          Economia de R$ {((plan.price_amount / 10) * 2).toFixed(2)}/ano
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          Todos os recursos do plano mensal
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          Execução prolongada sem pagas
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          Economia com estabilidade
                        </li>
                        <li className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary" />
                          API própria liberada
                        </li>
                      </ul>
                      <Button 
                        className={`w-full ${
                          isHighlighted 
                            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                            : ""
                        }`}
                        variant={isHighlighted ? "default" : "outline"}
                      >
                        ASSINAR CAPACIDADE ANUAL
                      </Button>
                    </CardContent>
                  </Card>
                );
              }) : (
                // Fallback annual plans if none in database
                <>
                  {["START CREATOR", "TURBO MAKER", "MASTER PRO"].map((name, idx) => {
                    const prices = [699, 999, 1499];
                    const credits = [9600, 19200, 28800];
                    const savings = [359, 599, 899];
                    const isHighlighted = name === "TURBO MAKER";
                    const Icon = getPlanIcon(name);
                    
                    return (
                      <Card 
                        key={name} 
                        className={`border-border bg-card relative overflow-hidden ${
                          isHighlighted ? "ring-2 ring-primary border-primary" : ""
                        }`}
                      >
                        {isHighlighted && (
                          <div className="absolute top-0 right-0">
                            <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground">
                              POPULAR
                            </Badge>
                          </div>
                        )}
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                            <Icon className="w-5 h-5 text-primary" />
                            {name}
                          </CardTitle>
                          <div className="space-y-1">
                            <Badge className="bg-primary/20 text-primary border-primary">
                              {credits[idx].toLocaleString()} créditos/ano
                            </Badge>
                            <div className="text-2xl font-bold text-foreground">
                              R${prices[idx].toFixed(2)} 
                              <span className="text-sm font-normal text-muted-foreground">/ano</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-400">
                              <Sparkles className="w-3 h-3" />
                              Economia de R$ {savings[idx].toFixed(2)}/ano
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2 text-muted-foreground">
                              <Check className="w-4 h-4 text-primary" />
                              Todos os recursos do mensal
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                              <Check className="w-4 h-4 text-primary" />
                              Execução prolongada sem pausas
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                              <Check className="w-4 h-4 text-primary" />
                              Economia com estabilidade
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                              <Check className="w-4 h-4 text-primary" />
                              API própria liberada
                            </li>
                          </ul>
                          <Button 
                            className={`w-full ${
                              isHighlighted 
                                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                                : ""
                            }`}
                            variant={isHighlighted ? "default" : "outline"}
                          >
                            ASSINAR CAPACIDADE ANUAL
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </>
              )}
            </div>
          </section>

          {/* Credit Packages Section */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Expansão Pontual de Capacidade
              </h3>
              <p className="text-sm text-muted-foreground">Reforço temporário para picos de execução</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card key={pkg.credits} className="border-border bg-card text-center">
                  <CardContent className="pt-6 space-y-3">
                    <div className="text-lg font-bold text-foreground">
                      {pkg.credits.toLocaleString()} CRÉDITOS
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace(".", ",")}
                    </div>
                    <p className="text-xs text-muted-foreground">{pkg.label}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      ALOCAR CRÉDITOS
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Comparação de Planos</h3>
              <p className="text-sm text-muted-foreground">Compare todos os planos em uma única tabela</p>
            </div>

            <Card className="border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">Capacidade</TableHead>
                    <TableHead className="text-muted-foreground">Créditos</TableHead>
                    <TableHead className="text-muted-foreground">Roteiros/mês</TableHead>
                    <TableHead className="text-muted-foreground">Valor (mês)</TableHead>
                    <TableHead className="text-muted-foreground">Áudio</TableHead>
                    <TableHead className="text-muted-foreground">Transcrição</TableHead>
                    <TableHead className="text-muted-foreground">Agentes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border">
                    <TableCell className="font-medium text-foreground">Avaliação</TableCell>
                    <TableCell className="text-muted-foreground">50</TableCell>
                    <TableCell className="text-muted-foreground">Básico</TableCell>
                    <TableCell className="text-muted-foreground">ad 45</TableCell>
                    <TableCell className="text-muted-foreground">0-min</TableCell>
                    <TableCell className="text-muted-foreground">25-min</TableCell>
                    <TableCell className="text-muted-foreground">1</TableCell>
                  </TableRow>
                  <TableRow className="border-border">
                    <TableCell className="font-medium text-foreground">START</TableCell>
                    <TableCell className="text-muted-foreground">500</TableCell>
                    <TableCell className="text-muted-foreground">50-85</TableCell>
                    <TableCell className="text-muted-foreground">~350</TableCell>
                    <TableCell className="text-muted-foreground">35-mín</TableCell>
                    <TableCell className="text-muted-foreground">30-min</TableCell>
                    <TableCell className="text-muted-foreground">3</TableCell>
                  </TableRow>
                  <TableRow className="border-border bg-primary/5">
                    <TableCell className="font-medium text-primary">TURBO</TableCell>
                    <TableCell className="text-foreground">1.000</TableCell>
                    <TableCell className="text-foreground">80-150</TableCell>
                    <TableCell className="text-foreground">~900</TableCell>
                    <TableCell className="text-foreground">1-14h</TableCell>
                    <TableCell className="text-foreground">Ilimitado</TableCell>
                    <TableCell className="text-foreground">10</TableCell>
                  </TableRow>
                  <TableRow className="border-border">
                    <TableCell className="font-medium text-foreground">MASTER</TableCell>
                    <TableCell className="text-muted-foreground">2.400</TableCell>
                    <TableCell className="text-muted-foreground">100-180</TableCell>
                    <TableCell className="text-muted-foreground">~1.500</TableCell>
                    <TableCell className="text-muted-foreground">Ilimitado</TableCell>
                    <TableCell className="text-muted-foreground">Ilimitado</TableCell>
                    <TableCell className="text-muted-foreground">Ilimitado</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </section>

          {/* FAQ Section */}
          <section className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-foreground">Perguntas Frequentes</h3>
            </div>

            <div className="max-w-2xl mx-auto">
              <Accordion type="single" collapsible className="space-y-2">
                {FAQ_ITEMS.map((item, idx) => (
                  <AccordionItem 
                    key={idx} 
                    value={`item-${idx}`}
                    className="border border-border rounded-lg px-4 bg-card"
                  >
                    <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-6 py-12 border-t border-border">
            <h3 className="text-2xl font-playfair font-bold text-foreground">
              Pronto para começar?
            </h3>
            <p className="text-muted-foreground">
              Escolha o plano ideal e comece a criar conteúdo profissional hoje mesmo.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              VER MEU DASHBOARD
            </Button>
          </section>

          {/* Footer */}
          <footer className="text-center space-y-4 py-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              As tarifas cobradas pela execução são em escala. <br />
              Consulte política de utilização.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 La Casa Dark Core. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </div>
    </MainLayout>
  );
}
