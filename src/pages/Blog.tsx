import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { 
  ArrowRight, 
  Clock, 
  Calendar, 
  TrendingUp,
  Youtube,
  Smartphone,
  Image,
  FileText,
  Search,
  DollarSign,
  Sparkles,
  Wrench,
  Zap,
  Rocket,
  X,
  ChevronLeft,
  ChevronRight,
  Tag
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
  tags?: string[];
}

const blogPosts: BlogPost[] = [
  {
    slug: "como-ganhar-dinheiro-youtube",
    title: "Como Ganhar Dinheiro no YouTube em 2025: Guia Completo",
    excerpt: "Aprenda as melhores estratégias para monetizar seu canal no YouTube, desde AdSense até métodos alternativos de renda.",
    category: "Monetização",
    readTime: "15 min",
    date: "2025-01-07",
    icon: DollarSign,
    featured: true,
    tags: ["monetização", "adsense", "renda passiva", "youtube"]
  },
  {
    slug: "nichos-lucrativos-youtube",
    title: "10 Nichos Mais Lucrativos do YouTube em 2025",
    excerpt: "Descubra os nichos que mais pagam no YouTube e como escolher o melhor para você. Comparativo de CPM e potencial.",
    category: "Nichos",
    readTime: "12 min",
    date: "2025-01-07",
    icon: TrendingUp,
    featured: true,
    tags: ["nichos", "cpm", "dark channel", "faceless"]
  },
  {
    slug: "como-criar-canal-dark",
    title: "Como Criar um Canal Dark do Zero: Guia Definitivo",
    excerpt: "Aprenda passo a passo como criar um canal dark no YouTube, desde a escolha do nicho até a primeira monetização.",
    category: "Guia Completo",
    readTime: "20 min",
    date: "2025-01-07",
    icon: Youtube,
    featured: true,
    tags: ["dark channel", "faceless", "tutorial", "iniciantes"]
  },
  {
    slug: "shorts-virais",
    title: "Como Fazer Shorts Virais no YouTube em 2025",
    excerpt: "Guia completo para criar Shorts que viralizam e aceleram o crescimento do seu canal. Formatos, hooks e técnicas.",
    category: "Shorts",
    readTime: "14 min",
    date: "2025-01-07",
    icon: Smartphone,
    featured: true,
    tags: ["shorts", "viral", "crescimento", "algoritmo"]
  },
  {
    slug: "roteiros-virais-ia",
    title: "Como Criar Roteiros Virais com Inteligência Artificial",
    excerpt: "Domine a arte de criar roteiros virais usando IA. Técnicas, prompts e estruturas que geram milhões de views.",
    category: "Roteiros",
    readTime: "18 min",
    date: "2025-01-07",
    icon: Sparkles,
    tags: ["ia", "roteiros", "viral", "chatgpt"]
  },
  {
    slug: "thumbnails-profissionais",
    title: "Thumbnails Profissionais: Como Criar Capas que Convertem",
    excerpt: "Domine a arte de criar thumbnails que aumentam CTR. Psicologia das cores, texto e design que funciona.",
    category: "Thumbnails",
    readTime: "14 min",
    date: "2025-01-07",
    icon: Image,
    tags: ["thumbnails", "ctr", "design", "conversão"]
  },
  {
    slug: "seo-youtube",
    title: "SEO para YouTube: Como Ranquear Vídeos em 2025",
    excerpt: "Domine o algoritmo do YouTube com técnicas avançadas de SEO. Títulos, descrições, tags e recomendados.",
    category: "SEO",
    readTime: "16 min",
    date: "2025-01-07",
    icon: Search,
    tags: ["seo", "algoritmo", "ranqueamento", "tags"]
  },
  {
    slug: "algoritmo-youtube",
    title: "Como Funciona o Algoritmo do YouTube em 2025",
    excerpt: "Descubra como o algoritmo decide quais vídeos mostrar. CTR, retenção, engajamento e métricas que importam.",
    category: "Algoritmo",
    readTime: "15 min",
    date: "2025-01-07",
    icon: Zap,
    tags: ["algoritmo", "ctr", "retenção", "engajamento"]
  },
  {
    slug: "ferramentas-criacao-videos",
    title: "Melhores Ferramentas para Criar Vídeos no YouTube",
    excerpt: "Comparativo completo das melhores ferramentas: edição, IA, narração e automação para criadores.",
    category: "Ferramentas",
    readTime: "20 min",
    date: "2025-01-07",
    icon: Wrench,
    tags: ["ferramentas", "ia", "edição", "automação"]
  },
  {
    slug: "monetizacao-afiliados",
    title: "Monetização com Afiliados no YouTube: Guia Completo",
    excerpt: "Aprenda a ganhar dinheiro com marketing de afiliados no YouTube, mesmo sem monetização do AdSense.",
    category: "Afiliados",
    readTime: "18 min",
    date: "2025-01-07",
    icon: DollarSign,
    tags: ["afiliados", "monetização", "renda passiva", "marketing"]
  },
  {
    slug: "crescimento-rapido",
    title: "Estratégias de Crescimento Rápido no YouTube",
    excerpt: "Táticas comprovadas para acelerar o crescimento do seu canal. De 0 a 1.000 inscritos em semanas.",
    category: "Crescimento",
    readTime: "16 min",
    date: "2025-01-07",
    icon: Rocket,
    tags: ["crescimento", "inscritos", "viral", "estratégias"]
  }
];

const POSTS_PER_PAGE = 6;

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = [...new Set(blogPosts.map(post => post.category))];
    return cats.sort();
  }, []);

  // Extrair tags únicas
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogPosts.forEach(post => {
      post.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, []);

  // Filtrar posts
  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      const matchesSearch = searchQuery === "" || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = !selectedCategory || post.category === selectedCategory;
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => post.tags?.includes(tag));
      
      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [searchQuery, selectedCategory, selectedTags]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const featuredPosts = filteredPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  // Pagination logic
  const totalPages = Math.ceil(regularPosts.length / POSTS_PER_PAGE);
  const paginatedRegularPosts = regularPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll to the "All Posts" section
    document.getElementById('all-posts')?.scrollIntoView({ behavior: 'smooth' });
  };

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
            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-10 h-12 text-base bg-background/50 border-border/50 focus:border-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full"
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className="rounded-full"
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Tags Filter */}
            <div className="mt-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filtrar por tags:</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedTags([])}
                  >
                    Limpar
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Count */}
            {(searchQuery || selectedCategory || selectedTags.length > 0) && (
              <p className="text-center text-muted-foreground mt-4">
                {filteredPosts.length} {filteredPosts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
                {selectedCategory && ` em "${selectedCategory}"`}
                {selectedTags.length > 0 && ` com tags: ${selectedTags.map(t => `#${t}`).join(', ')}`}
                {searchQuery && ` para "${searchQuery}"`}
              </p>
            )}
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Artigos em Destaque
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`}>
                  <Card 
                    className="group relative overflow-hidden border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 h-full"
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
                </Link>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* All Posts */}
        {regularPosts.length > 0 && (
        <section id="all-posts" className="py-12 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                {featuredPosts.length === 0 ? 'Resultados da Busca' : 'Todos os Artigos'}
              </h2>
              {totalPages > 1 && (
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedRegularPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`}>
                  <Card 
                    className="group overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-md h-full"
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
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first, last, current, and adjacent pages
                    const shouldShow = 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 1;
                    
                    const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                    const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                    if (showEllipsisBefore || showEllipsisAfter) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }

                    if (!shouldShow) return null;

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => goToPage(page)}
                        className="h-10 w-10"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </section>
        )}

        {/* No Results */}
        {filteredPosts.length === 0 && (
          <section className="py-16 px-4">
            <div className="max-w-md mx-auto text-center">
              <Search className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Tente buscar por outros termos ou remover os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                }}
              >
                Limpar filtros
              </Button>
            </div>
          </section>
        )}

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
