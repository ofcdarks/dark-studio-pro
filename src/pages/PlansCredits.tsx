import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  X, 
  Zap, 
  ArrowLeft,
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
  { credits: 1000, price: 99.90, label: "Alocação básica" },
  { credits: 2500, price: 149.90, label: "Expansão moderada" },
  { credits: 5000, price: 249.90, label: "Execução intensiva" },
  { credits: 10000, price: 399.90, label: "Escala prolongada" },
  { credits: 20000, price: 699.90, label: "Contínuo de alta demanda" },
];

const MONTHLY_PLANS = [
  {
    name: "Acesso Inicial",
    credits: 50,
    price: 0,
    features: [
      { label: "Ambiente de avaliação", included: true },
      { label: "Ferramentas limitadas (habilitadas)", included: true },
      { label: "Ambiente exemplos (limitado)", included: true },
      { label: "Análise de vídeos (restrito)", included: true },
      { label: "Geração de áudio (Inserto)", included: false },
      { label: "Localização (Inserto) | Agentes", included: false },
      { label: "Cláusula de Riscos e Rendimento", included: false },
      { label: "Processamento interno da Lavador", included: false },
      { label: "Armazenamento reduzido", included: false },
    ],
    buttonLabel: "ATIVAR ACESSO INICIAL",
    highlighted: false,
  },
  {
    name: "START CREATOR",
    credits: 800,
    price: 79.90,
    features: [
      { label: "Processamento de vídeo", included: true },
      { label: "Ambiente exemplos virgens", included: true },
      { label: "Áudio: até 40 min", included: true },
      { label: "Transcrição Ilimitada", included: true },
      { label: "API 8 agentes operacionais", included: true },
      { label: "Atualização de vídeos", included: true },
      { label: "Geração de Riscos e Rendimento", included: true },
      { label: "Integração YouTube", included: true },
      { label: "Armazenamento: 10 GB", included: true },
    ],
    buttonLabel: "ATIVAR CAPACIDADE",
    highlighted: false,
    extraInfo: {
      label: "CONTA EXECUÇÃO (LIA min)",
      items: ["90 análises + Cesta (ET) = 360", "análises = vídeo = 85 artigos", "com armazenamento ilimitado"],
    },
  },
  {
    name: "TURBO MAKER",
    credits: 1600,
    price: 99.90,
    originalPrice: 149.90,
    features: [
      { label: "60-120 transcrição mensal", included: true },
      { label: "Claude + Sonnet: Ilimitado", included: true },
      { label: "Multilíngua (IA fixa modo)", included: true },
      { label: "360+ análises", included: true },
      { label: "API 10 agentes operacionais", included: true },
      { label: "Geração de Riscos e Rendimento", included: true },
      { label: "Armazenamento: 30 GB", included: true },
      { label: "Integração YouTube exemplos", included: true },
      { label: "Atualização semanal", included: true },
      { label: "Armazenamento: 20 GB", included: true },
    ],
    buttonLabel: "HABILITAR EXECUÇÃO",
    highlighted: true,
    extraInfo: {
      label: "CONTA EXECUÇÃO:",
      items: ["Orçamento de Ciclo (LLA min)", "60+ min", "Execuções Images (Ciclo): <800", "Transcrição: 2-15h", "com armazenamento ilimitado"],
    },
  },
  {
    name: "MASTER PRO",
    credits: 2400,
    price: 149.90,
    features: [
      { label: "Capacidade estável de execução", included: true },
      { label: "Criações de Rifas de 15 min +", included: true },
      { label: "Todos os vídeos multi estátilo", included: true },
      { label: "Transcrição Ilimitada", included: true },
      { label: "Transcrição Ilimitada 15.000", included: true },
      { label: "API própria liberada", included: true },
      { label: "Acréscimo enterprise", included: true },
    ],
    buttonLabel: "ATIVAR INFRAESTRUTURA",
    highlighted: false,
    badge: "PRO",
    extraInfo: {
      label: "CONTA EXECUÇÃO FULL:",
      items: ["Operação (Mestre)de + Agente", "0+", "Extração contínua de clips", "Armazenamento: 50 GB"],
    },
  },
];

const ANNUAL_PLANS = [
  {
    name: "START CREATOR",
    credits: 9600,
    price: 699.00,
    originalPrice: 959.00,
    savings: 350,
    features: [
      "Todos os recursos do START",
      "Execução prolongada segura",
      "API própria liberada",
      "Armazenamento: 15 GB",
    ],
    buttonLabel: "ATIVAR CAPACIDADE ANUAL",
    highlighted: false,
  },
  {
    name: "TURBO MAKER",
    credits: 19200,
    price: 999.00,
    originalPrice: 1199.00,
    savings: 600,
    features: [
      "Todos os recursos do TURBO",
      "Execução com escalabilidade",
      "API própria liberada",
      "Armazenamento: 30 GB",
    ],
    buttonLabel: "HABILITAR EXECUÇÃO ANUAL",
    highlighted: true,
  },
  {
    name: "MASTER PRO",
    credits: 28800,
    price: 1499.00,
    originalPrice: 1799.00,
    savings: 1000,
    features: [
      "Todos os recursos do MASTER",
      "Infraestrutura exemplos do CORE",
      "API própria liberada",
      "Acréscimo enterprise",
      "Armazenamento: 50 GB",
    ],
    buttonLabel: "ATIVAR INFRAESTRUTURA ANUAL",
    highlighted: false,
    badge: "PRO",
  },
];

const COMPARISON_DATA = [
  { feature: "Avaliação", creditos: "50", roteiros: "ad 45", valor: "Grátis", audio: "35-mín", transcricao: "1", agentes: "1" },
  { feature: "START", creditos: "800", roteiros: "50-85", valor: "~R80", audio: "25-mín", transcricao: "35-mín", agentes: "5" },
  { feature: "TURBO", creditos: "1.600", roteiros: "80-150", valor: "~600", audio: "1-1.5h", transcricao: "50 análises", agentes: "10" },
  { feature: "MASTER", creditos: "2.400", roteiros: "100-180", valor: "+1.800", audio: "Ilimitado", transcricao: "Ilimitado", agentes: "15.000" },
];

export default function PlansCredits() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <MainLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-primary font-playfair font-bold text-lg">La Casa Dark Core</span>
                <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                  <a href="#mensais" className="hover:text-foreground cursor-pointer">Mensais</a>
                  <a href="#anuais" className="hover:text-foreground cursor-pointer">Anuais</a>
                  <a href="#pacotes" className="hover:text-foreground cursor-pointer">Pacotes</a>
                  <a href="#comparacao" className="hover:text-foreground cursor-pointer">Comparação</a>
                  <a href="#faq" className="hover:text-foreground cursor-pointer">FAQ</a>
                </nav>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(-1)}
                className="border-primary text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                VOLTAR
              </Button>
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
            <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">
              Defina sua Capacidade Operacional
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Os créditos determinam o volume, a frequência e a complexidade das execuções dentro do CORE.
            </p>
            <p className="text-muted-foreground max-w-xl mx-auto text-sm">
              Selecione a capacidade adequada ao seu ritmo de operação.
            </p>
          </section>

          {/* Monthly Plans Section */}
          <section id="mensais" className="space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xl font-semibold text-foreground">
                  Execução Recorrente (Capacidade Mensal)
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">Execução recorrente com recursos mensais</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MONTHLY_PLANS.map((plan, idx) => (
                <Card 
                  key={idx} 
                  className={`relative overflow-hidden ${
                    plan.highlighted 
                      ? "border-2 border-primary bg-card" 
                      : "border-border bg-card"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <Badge className={`${plan.highlighted ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {plan.credits.toLocaleString()} créditos/mês
                      </Badge>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          R${plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm text-muted-foreground">/mês</span>
                      </div>
                      {plan.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          R${plan.originalPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5 text-xs">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-muted-foreground">
                          {feature.included ? (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                          )}
                          <span>{feature.label}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant={plan.highlighted ? "default" : "outline"}
                      className={`w-full text-xs ${plan.highlighted ? "bg-primary" : ""}`}
                      size="sm"
                    >
                      {plan.buttonLabel}
                    </Button>

                    {plan.extraInfo && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-primary font-semibold mb-2">{plan.extraInfo.label}</p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {plan.extraInfo.items.map((item, iIdx) => (
                            <li key={iIdx}>{item}</li>
                          ))}
                        </ul>
                        <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
                          ATIVAR CAPACIDADE
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Annual Plans Section */}
          <section id="anuais" className="space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xl font-semibold text-foreground">
                  Execução Prolongada (Capacidade Anual)
                </h2>
                <Badge className="bg-success/20 text-success border-success text-xs">
                  Economize
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Execução prolongada com otimização de recursos</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {ANNUAL_PLANS.map((plan, idx) => (
                <Card 
                  key={idx} 
                  className={`relative overflow-hidden ${
                    plan.highlighted 
                      ? "border-2 border-primary bg-card" 
                      : "border-border bg-card"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-destructive text-destructive-foreground text-xs">
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      <Badge className={`${plan.highlighted ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {plan.credits.toLocaleString()} créditos/ano
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        + {(plan.credits * 0.1).toLocaleString()} créditos/mês
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-primary">
                          R${plan.price.toFixed(2).replace(".", ",")}
                        </span>
                        <span className="text-sm text-muted-foreground">/ano</span>
                      </div>
                      <span className="text-sm text-muted-foreground line-through">
                        R${plan.originalPrice.toFixed(2).replace(".", ",")}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-success">
                        <Zap className="w-3 h-3" />
                        Economia de R$ {plan.savings.toFixed(0)}/ano
                      </div>
                    </div>

                    <ul className="space-y-1.5 text-xs">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-muted-foreground">
                          <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      variant={plan.highlighted ? "default" : "outline"}
                      className={`w-full text-xs ${plan.highlighted ? "bg-primary" : ""}`}
                      size="sm"
                    >
                      {plan.buttonLabel}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Credit Packages Section */}
          <section id="pacotes" className="space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Expansão Pontual de Capacidade
              </h2>
              <p className="text-sm text-muted-foreground">Reforço temporário para picos de execução</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CREDIT_PACKAGES.map((pkg, idx) => (
                <Card 
                  key={idx} 
                  className={`border-border bg-card text-center ${idx === 4 ? "border-primary" : ""}`}
                >
                  <CardContent className="pt-6 space-y-3">
                    <div className="text-sm font-bold text-foreground">
                      {pkg.credits.toLocaleString()} CRÉDITOS
                    </div>
                    <div className="text-xl font-bold text-primary">
                      R$ {pkg.price.toFixed(2).replace(".", ",")}
                    </div>
                    <p className="text-xs text-muted-foreground">{pkg.label}</p>
                    <Button variant="outline" size="sm" className="w-full text-xs">
                      ALOCAR CRÉDITOS
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section id="comparacao" className="space-y-6 scroll-mt-20">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground">Comparação de Planos</h2>
              <p className="text-sm text-muted-foreground">Compare todos os planos em uma única tabela</p>
            </div>

            <Card className="border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">Capacidade</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Créditos</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Roteiros/mês</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Valor (mês)</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Áudio</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Transcrição</TableHead>
                      <TableHead className="text-muted-foreground text-xs">Agentes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {COMPARISON_DATA.map((row, idx) => (
                      <TableRow 
                        key={idx} 
                        className={`border-border ${row.feature === "TURBO" ? "bg-primary/10" : ""}`}
                      >
                        <TableCell className={`font-medium text-xs ${row.feature === "TURBO" ? "text-primary" : "text-foreground"}`}>
                          {row.feature}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.creditos}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.roteiros}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.valor}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.audio}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.transcricao}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.agentes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="space-y-6 scroll-mt-20">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground">Perguntas Frequentes</h2>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Os créditos expiram?</h3>
                  <p className="text-xs text-muted-foreground">
                    Créditos de execução recorrente expiram ao final do ciclo ativo.<br />
                    Créditos de expansão pontual não expiram.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">Posso ajustar minha capacidade?</h3>
                  <p className="text-xs text-muted-foreground">
                    Sim. A capacidade pode ser ampliada ou reduzida conforme sua<br />
                    necessidade operacional.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground text-sm mb-2">O que acontece ao atingir o limite?</h3>
                  <p className="text-xs text-muted-foreground">
                    As execuções são suspensas até nova alocação de créditos.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary bg-card border-2">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-primary text-sm mb-2">Posso combinar planos e pacotes?</h3>
                  <p className="text-xs text-muted-foreground">
                    Sim. Pacotes funcionam como reforço adicional sobre qualquer<br />
                    capacidade ativa.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-6 py-8">
            <h2 className="text-xl font-semibold text-foreground">Pronto para começar?</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o plano ideal e comece a criar conteúdo profissional hoje mesmo.
            </p>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
              onClick={() => document.getElementById('mensais')?.scrollIntoView({ behavior: 'smooth' })}
            >
              VER MEUS CRÉDITOS
            </Button>
          </section>

          {/* Footer */}
          <footer className="text-center space-y-4 py-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Ambiente validado para execução em escala.<br />
              Gerenciamento das máquinas operacionais.
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
