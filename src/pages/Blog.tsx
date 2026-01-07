import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { 
  ArrowRight, 
  Clock, 
  Calendar, 
  TrendingUp,
  Youtube,
  Mic,
  Image,
  FileText,
  Search,
  DollarSign,
  Sparkles
} from "lucide-react";
import logo from "@/assets/logo.gif";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  icon: React.ElementType;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    slug: "como-criar-canal-dark-youtube-2026",
    title: "Como Criar um Canal Dark no YouTube em 2026: Guia Completo",
    excerpt: "Aprenda passo a passo como criar um canal dark (faceless) no YouTube que gera renda passiva. Desde a escolha do nicho até a monetização.",
    category: "Guia Completo",
    readTime: "15 min",
    date: "2026-01-07",
    icon: Youtube,
    featured: true
  },
  {
    slug: "melhores-nichos-canal-dark-2026",
    title: "10 Nichos Mais Lucrativos para Canal Dark em 2026",
    excerpt: "Descubra os nichos que mais pagam no YouTube para canais faceless. Análise de CPM, concorrência e potencial de crescimento.",
    category: "Nichos",
    readTime: "8 min",
    date: "2026-01-06",
    icon: TrendingUp,
    featured: true
  },
  {
    slug: "geradores-voz-ia-youtube",
    title: "Melhores Geradores de Voz IA para YouTube: Comparativo 2026",
    excerpt: "Compare os principais geradores de voz com inteligência artificial. ElevenLabs, Google TTS, Amazon Polly e mais.",
    category: "Ferramentas",
    readTime: "10 min",
    date: "2026-01-05",
    icon: Mic
  },
  {
    slug: "thumbnails-virais-ctr-alto",
    title: "Como Criar Thumbnails Virais com CTR Acima de 10%",
    excerpt: "Técnicas comprovadas para criar thumbnails que chamam atenção e aumentam drasticamente suas visualizações.",
    category: "Thumbnails",
    readTime: "7 min",
    date: "2026-01-04",
    icon: Image
  },
  {
    slug: "roteiro-viral-youtube",
    title: "Estrutura de Roteiro Viral: Os Segredos dos Vídeos com Milhões de Views",
    excerpt: "Descubra a estrutura de roteiro usada pelos maiores canais do YouTube. Gancho, desenvolvimento e CTA perfeito.",
    category: "Roteiros",
    readTime: "12 min",
    date: "2026-01-03",
    icon: FileText
  },
  {
    slug: "monetizacao-youtube-requisitos-2026",
    title: "Monetização YouTube 2026: Novos Requisitos e Estratégias",
    excerpt: "Tudo sobre os requisitos atuais para monetizar seu canal. 1.000 inscritos, 4.000 horas e alternativas.",
    category: "Monetização",
    readTime: "9 min",
    date: "2026-01-02",
    icon: DollarSign
  },
  {
    slug: "seo-youtube-ranquear-videos",
    title: "SEO para YouTube: Como Ranquear Vídeos na Primeira Página",
    excerpt: "Técnicas avançadas de SEO para YouTube. Títulos, descrições, tags e algoritmo de recomendação.",
    category: "SEO",
    readTime: "11 min",
    date: "2026-01-01",
    icon: Search
  },
  {
    slug: "automacao-canal-youtube-ia",
    title: "Automação de Canal YouTube com IA: O Guia Definitivo",
    excerpt: "Como usar inteligência artificial para automatizar seu canal. Da criação de conteúdo ao upload.",
    category: "Automação",
    readTime: "14 min",
    date: "2025-12-30",
    icon: Sparkles
  }
];

const Blog = () => {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog La Casa Dark - Canal Dark YouTube",
    "description": "Artigos e guias completos sobre como criar e monetizar canais dark no YouTube",
    "url": "https://canaisdarks.com.br/blog",
    "publisher": {
      "@type": "Organization",
      "name": "La Casa Dark",
      "logo": {
        "@type": "ImageObject",
        "url": "https://canaisdarks.com.br/logo.gif"
      }
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.date,
      "author": {
        "@type": "Organization",
        "name": "La Casa Dark"
      }
    }))
  };

  return (
    <>
      <SEOHead
        title="Blog: Guias para Criar Canal Dark no YouTube 2026"
        description="Aprenda a criar um canal dark no YouTube. Guias sobre nichos lucrativos, voz IA, thumbnails virais, roteiros e monetização. Conteúdo gratuito para criadores."
        canonical="/blog"
        keywords="blog canal dark, como criar canal dark youtube, tutorial faceless channel, guia canal sem aparecer, monetizar youtube 2026, nichos lucrativos youtube, voz ia youtube, thumbnails virais"
        jsonLd={blogJsonLd}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/landing" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary">
                  <img src={logo} alt="La Casa Dark" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-lg">La Casa Dark <span className="text-primary">Blog</span></span>
              </Link>
              
              <div className="flex items-center gap-4">
                <Link to="/landing">
                  <Button variant="ghost" size="sm">Voltar</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="gradient-button">Acessar Plataforma</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-6xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-primary border-primary">
              Blog Educacional
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Aprenda a Criar <span className="text-primary">Canais Dark</span> no YouTube
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Guias completos, tutoriais e estratégias para criar canais faceless que geram 
              renda passiva. Conteúdo 100% gratuito.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Badge variant="secondary" className="text-sm py-1.5 px-3">Canal Dark</Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-3">Faceless Channel</Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-3">Voz IA</Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-3">Monetização</Badge>
              <Badge variant="secondary" className="text-sm py-1.5 px-3">Thumbnails</Badge>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Artigos em Destaque
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card 
                  key={post.slug}
                  className="group relative overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-amber-500" />
                  <div className="p-6 md:p-8">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <post.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="default" className="bg-primary/20 text-primary hover:bg-primary/30">
                            {post.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {post.readTime}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {post.excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('pt-BR')}
                          </span>
                          <Button variant="ghost" size="sm" className="gap-1 text-primary hover:text-primary">
                            Ler artigo <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* All Posts */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Todos os Artigos</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post) => (
                <Card 
                  key={post.slug}
                  className="group overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md"
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <post.icon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {post.category}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(post.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para Criar Seu <span className="text-primary">Canal Dark</span>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Pare de apenas ler sobre. Use nossa plataforma e comece a criar vídeos virais hoje mesmo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-button gap-2 w-full sm:w-auto">
                  Começar Gratuitamente <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/landing">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver Funcionalidades
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 La Casa Dark. Todos os direitos reservados.</p>
            <div className="flex items-center gap-6">
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <a href="mailto:suporte@canaisdarks.com.br" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;
