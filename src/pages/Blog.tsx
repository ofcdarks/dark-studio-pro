import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Clock, 
  Calendar, 
  TrendingUp,
  Youtube,
  Smartphone,
  Image,
  Search,
  DollarSign,
  Sparkles,
  Wrench,
  Zap,
  Rocket,
  X,
  ChevronLeft,
  ChevronRight,
  Tag,
  BookOpen,
  Eye,
  Crown,
  Play
} from "lucide-react";
import logo from "@/assets/logo.gif";

// Import blog images
import imgMonetizacao from "@/assets/blog/como-ganhar-dinheiro-youtube.jpg";
import imgNichos from "@/assets/blog/nichos-lucrativos-youtube.jpg";
import imgCanalDark from "@/assets/blog/como-criar-canal-dark.jpg";
import imgShorts from "@/assets/blog/shorts-virais.jpg";
import imgRoteiros from "@/assets/blog/roteiros-virais-ia.jpg";
import imgThumbnails from "@/assets/blog/thumbnails-profissionais.jpg";
import imgSEO from "@/assets/blog/seo-youtube.jpg";
import imgAlgoritmo from "@/assets/blog/algoritmo-youtube.jpg";
import imgFerramentas from "@/assets/blog/ferramentas-criacao-videos.jpg";
import imgAfiliados from "@/assets/blog/monetizacao-afiliados.jpg";
import imgCrescimento from "@/assets/blog/crescimento-rapido.jpg";

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
  image?: string;
  views?: number;
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
    tags: ["monetização", "adsense", "renda passiva", "youtube"],
    image: imgMonetizacao,
    views: 12547
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
    tags: ["nichos", "cpm", "dark channel", "faceless"],
    image: imgNichos,
    views: 9823
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
    tags: ["dark channel", "faceless", "tutorial", "iniciantes"],
    image: imgCanalDark,
    views: 18432
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
    tags: ["shorts", "viral", "crescimento", "algoritmo"],
    image: imgShorts,
    views: 7621
  },
  {
    slug: "roteiros-virais-ia",
    title: "Como Criar Roteiros Virais com Inteligência Artificial",
    excerpt: "Domine a arte de criar roteiros virais usando IA. Técnicas, prompts e estruturas que geram milhões de views.",
    category: "Roteiros",
    readTime: "18 min",
    date: "2025-01-07",
    icon: Sparkles,
    tags: ["ia", "roteiros", "viral", "chatgpt"],
    image: imgRoteiros,
    views: 5432
  },
  {
    slug: "thumbnails-profissionais",
    title: "Thumbnails Profissionais: Como Criar Capas que Convertem",
    excerpt: "Domine a arte de criar thumbnails que aumentam CTR. Psicologia das cores, texto e design que funciona.",
    category: "Thumbnails",
    readTime: "14 min",
    date: "2025-01-07",
    icon: Image,
    tags: ["thumbnails", "ctr", "design", "conversão"],
    image: imgThumbnails,
    views: 6234
  },
  {
    slug: "seo-youtube",
    title: "SEO para YouTube: Como Ranquear Vídeos em 2025",
    excerpt: "Domine o algoritmo do YouTube com técnicas avançadas de SEO. Títulos, descrições, tags e recomendados.",
    category: "SEO",
    readTime: "16 min",
    date: "2025-01-07",
    icon: Search,
    tags: ["seo", "algoritmo", "ranqueamento", "tags"],
    image: imgSEO,
    views: 4521
  },
  {
    slug: "algoritmo-youtube",
    title: "Como Funciona o Algoritmo do YouTube em 2025",
    excerpt: "Descubra como o algoritmo decide quais vídeos mostrar. CTR, retenção, engajamento e métricas que importam.",
    category: "Algoritmo",
    readTime: "15 min",
    date: "2025-01-07",
    icon: Zap,
    tags: ["algoritmo", "ctr", "retenção", "engajamento"],
    image: imgAlgoritmo,
    views: 8765
  },
  {
    slug: "ferramentas-criacao-videos",
    title: "Melhores Ferramentas para Criar Vídeos no YouTube",
    excerpt: "Comparativo completo das melhores ferramentas: edição, IA, narração e automação para criadores.",
    category: "Ferramentas",
    readTime: "20 min",
    date: "2025-01-07",
    icon: Wrench,
    tags: ["ferramentas", "ia", "edição", "automação"],
    image: imgFerramentas,
    views: 3987
  },
  {
    slug: "monetizacao-afiliados",
    title: "Monetização com Afiliados no YouTube: Guia Completo",
    excerpt: "Aprenda a ganhar dinheiro com marketing de afiliados no YouTube, mesmo sem monetização do AdSense.",
    category: "Afiliados",
    readTime: "18 min",
    date: "2025-01-07",
    icon: DollarSign,
    tags: ["afiliados", "monetização", "renda passiva", "marketing"],
    image: imgAfiliados,
    views: 2876
  },
  {
    slug: "crescimento-rapido",
    title: "Estratégias de Crescimento Rápido no YouTube",
    excerpt: "Táticas comprovadas para acelerar o crescimento do seu canal. De 0 a 1.000 inscritos em semanas.",
    category: "Crescimento",
    readTime: "16 min",
    date: "2025-01-07",
    icon: Rocket,
    tags: ["crescimento", "inscritos", "viral", "estratégias"],
    image: imgCrescimento,
    views: 5123
  }
];

const POSTS_PER_PAGE = 6;

const formatViews = (views: number) => {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return views.toString();
};

const Blog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Track page view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await supabase.functions.invoke("track-blog-view", {
          body: { pagePath: "/blog" },
        });
      } catch (e) {
        // Silent fail for analytics
      }
    };
    trackView();
  }, []);

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
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/landing" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-colors shadow-lg shadow-primary/20">
                  <img src={logo} alt="La Casa Dark" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-lg">La Casa Dark</span>
                  <span className="text-primary font-bold">Blog</span>
                </div>
              </Link>
              
              <div className="flex items-center gap-3">
                <Link to="/landing">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30">
                    <Rocket className="w-4 h-4 mr-2" />
                    Acessar Plataforma
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section - Premium Design */}
        <section className="relative py-20 md:py-28 px-4 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Central de Conhecimento</span>
                <Crown className="w-4 h-4 text-primary" />
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Domine a Arte de Criar
                <br />
                <span className="text-primary">Canais Dark</span> no YouTube
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                Guias completos, tutoriais avançados e estratégias exclusivas para criar canais 
                faceless que geram renda passiva consistente.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
                {[
                  { value: "11+", label: "Artigos" },
                  { value: "100k+", label: "Leitores" },
                  { value: "4.9★", label: "Avaliação" }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Search Bar - Premium */}
              <div className="max-w-2xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-primary/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
                  <div className="relative flex items-center bg-card border border-border/50 rounded-xl overflow-hidden">
                    <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Buscar artigos, categorias ou tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-12 h-14 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 p-1 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Category Filter - Pill Style */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-wrap justify-center gap-2 mb-6"
            >
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-5 ${selectedCategory === null ? 'shadow-lg shadow-primary/30' : ''}`}
              >
                Todos
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`rounded-full px-5 ${selectedCategory === category ? 'shadow-lg shadow-primary/30' : ''}`}
                >
                  {category}
                </Button>
              ))}
            </motion.div>

            {/* Tags Filter - Compact */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Tags populares:</span>
                {selectedTags.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary hover:text-primary"
                    onClick={() => setSelectedTags([])}
                  >
                    Limpar ({selectedTags.length})
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {allTags.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Results Count */}
            {(searchQuery || selectedCategory || selectedTags.length > 0) && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground mt-6"
              >
                <span className="text-primary font-semibold">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
              </motion.p>
            )}
          </div>
        </section>

        {/* Featured Posts - Premium Grid */}
        {featuredPosts.length > 0 && (
          <section className="py-16 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-10">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">Artigos em Destaque</h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredPosts.map((post, index) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link to={`/blog/${post.slug}`}>
                      <Card className="group relative overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-500 h-full bg-card hover:shadow-xl hover:shadow-primary/10">
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden">
                          {post.image ? (
                            <img 
                              src={post.image} 
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                              <post.icon className="w-12 h-12 text-primary/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                          
                          {/* Category Badge */}
                          <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground border-0 shadow-lg">
                            {post.category}
                          </Badge>
                          
                          {/* Views */}
                          {post.views && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-xs">
                              <Eye className="w-3 h-3" />
                              {formatViews(post.views)}
                            </div>
                          )}

                          {/* Play indicator on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                            </div>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5">
                          <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {post.readTime}
                            </span>
                            <span className="flex items-center gap-1 text-primary font-medium group-hover:underline">
                              Ler mais <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* All Posts - Clean Grid */}
        {regularPosts.length > 0 && (
          <section id="all-posts" className="py-16 px-4 bg-muted/20">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl md:text-3xl font-bold">
                  {featuredPosts.length === 0 ? 'Resultados da Busca' : 'Todos os Artigos'}
                </h2>
                {totalPages > 1 && (
                  <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    Página {currentPage} de {totalPages}
                  </span>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedRegularPosts.map((post, index) => (
                  <motion.div
                    key={post.slug}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <Link to={`/blog/${post.slug}`}>
                      <Card className="group overflow-hidden hover:border-primary/30 transition-all duration-300 h-full hover:shadow-lg">
                        {/* Image */}
                        <div className="relative aspect-video overflow-hidden">
                          {post.image ? (
                            <img 
                              src={post.image} 
                              alt={post.title}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                              <post.icon className="w-10 h-10 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                          
                          {/* Category Badge */}
                          <Badge variant="outline" className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm border-border/50">
                            {post.category}
                          </Badge>
                        </div>
                        
                        {/* Content */}
                        <div className="p-5">
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
                  </motion.div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
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
                          className={`h-10 w-10 rounded-full ${currentPage === page ? 'shadow-lg shadow-primary/30' : ''}`}
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
                    className="h-10 w-10 rounded-full"
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
          <section className="py-20 px-4">
            <div className="max-w-md mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhum artigo encontrado</h3>
              <p className="text-muted-foreground mb-6">
                Tente buscar por outros termos ou remover os filtros aplicados.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory(null);
                  setSelectedTags([]);
                }}
                className="rounded-full"
              >
                Limpar todos os filtros
              </Button>
            </div>
          </section>
        )}

        {/* CTA Section - Premium */}
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Comece Agora</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Pronto para Criar Seu
              <br />
              <span className="text-primary">Canal Dark de Sucesso</span>?
            </h2>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
              Pare de apenas ler sobre. Use nossa plataforma completa com IA e comece a criar 
              vídeos virais que geram renda passiva hoje mesmo.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/30 gap-2 px-8 h-14 text-base w-full sm:w-auto">
                  <Rocket className="w-5 h-5" />
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/landing">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-14 text-base w-full sm:w-auto border-border/50 hover:border-primary/50">
                  Ver Funcionalidades
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer - Clean */}
        <footer className="py-10 px-4 border-t border-border/50 bg-muted/10">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30">
                  <img src={logo} alt="La Casa Dark" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm text-muted-foreground">
                  © 2026 La Casa Dark. Todos os direitos reservados.
                </span>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termos
                </Link>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacidade
                </Link>
                <a 
                  href="mailto:suporte@canaisdarks.com.br" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contato
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Blog;
