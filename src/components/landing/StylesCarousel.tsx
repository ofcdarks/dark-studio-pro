import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Palette, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedSection } from "./AnimatedSection";

// Import style preview images - Row 1
import preview3DCinematic from "@/assets/style-previews/3d-cinematic-miniature.jpg";
import previewCinematografico from "@/assets/style-previews/cinematografico.jpg";
import previewAnime from "@/assets/style-previews/anime.jpg";
import previewNeonCyberpunk from "@/assets/style-previews/neon-cyberpunk.jpg";
import previewNoirClassico from "@/assets/style-previews/noir-classico.jpg";
import previewDiorama from "@/assets/style-previews/diorama-cinematografico.jpg";
import previewPixar from "@/assets/style-previews/pixar-disney.jpg";
import previewVaporwave from "@/assets/style-previews/vaporwave.jpg";

// Import style preview images - Row 2
import previewTerrorAnalogico from "@/assets/style-previews/terror-analogico.jpg";
import previewSurrealismo from "@/assets/style-previews/surrealismo-psicologico.jpg";
import previewFantasia from "@/assets/style-previews/fantasia.jpg";
import previewApocaliptico from "@/assets/style-previews/apocaliptico.jpg";
import previewComicBook from "@/assets/style-previews/comic-book.jpg";
import previewGoticoVitoriano from "@/assets/style-previews/gotico-vitoriano.jpg";
import previewSynthwave from "@/assets/style-previews/synthwave.jpg";
import previewUnrealEngine from "@/assets/style-previews/unreal-engine.jpg";

// Row 1 styles (left to right)
const stylesRow1 = [
  { id: "3d-cinematic", name: "3D Cinematográfico", image: preview3DCinematic, category: "3D" },
  { id: "cinematografico", name: "Cinematográfico", image: previewCinematografico, category: "Realista" },
  { id: "anime", name: "Anime", image: previewAnime, category: "Artístico" },
  { id: "neon-cyberpunk", name: "Neon Cyberpunk", image: previewNeonCyberpunk, category: "Vibrante" },
  { id: "noir-classico", name: "Noir Clássico", image: previewNoirClassico, category: "Dramático" },
  { id: "diorama", name: "Diorama", image: previewDiorama, category: "Experimental" },
  { id: "pixar", name: "Pixar/Disney", image: previewPixar, category: "3D" },
  { id: "vaporwave", name: "Vaporwave", image: previewVaporwave, category: "Vibrante" },
];

// Row 2 styles (right to left)
const stylesRow2 = [
  { id: "terror", name: "Terror Analógico", image: previewTerrorAnalogico, category: "Dramático" },
  { id: "surrealismo", name: "Surrealismo", image: previewSurrealismo, category: "Experimental" },
  { id: "fantasia", name: "Fantasia", image: previewFantasia, category: "Artístico" },
  { id: "apocaliptico", name: "Apocalíptico", image: previewApocaliptico, category: "Dramático" },
  { id: "comic", name: "Comic Book", image: previewComicBook, category: "Artístico" },
  { id: "gotico", name: "Gótico Vitoriano", image: previewGoticoVitoriano, category: "Dramático" },
  { id: "synthwave", name: "Synthwave", image: previewSynthwave, category: "Vibrante" },
  { id: "unreal", name: "Unreal Engine", image: previewUnrealEngine, category: "3D" },
];

interface StyleCardProps {
  style: { id: string; name: string; image: string; category: string };
  index: number;
}

const StyleCard = ({ style, index }: StyleCardProps) => (
  <motion.div
    key={`${style.id}-${index}`}
    className="flex-shrink-0 w-56 md:w-72 group"
    whileHover={{ scale: 1.05, y: -8 }}
    transition={{ duration: 0.3 }}
  >
    <div className="relative rounded-xl overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all duration-300 shadow-lg group-hover:shadow-primary/20">
      <div className="aspect-video">
        <img 
          src={style.image} 
          alt={style.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
      <div className="absolute top-3 right-3">
        <span className="px-2 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-full">
          {style.category}
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h4 className="font-bold text-base text-foreground">{style.name}</h4>
      </div>
    </div>
  </motion.div>
);

export const StylesCarousel = () => {
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Row 1: Left to Right
  useEffect(() => {
    const scrollContainer = scrollRef1.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const speed = 0.5;

    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition += speed;
        if (scrollPosition >= scrollContainer.scrollWidth / 2) {
          scrollPosition = 0;
        }
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Row 2: Right to Left
  useEffect(() => {
    const scrollContainer = scrollRef2.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = scrollContainer.scrollWidth / 2;
    const speed = 0.5;

    const animate = () => {
      if (!isPaused && scrollContainer) {
        scrollPosition -= speed;
        if (scrollPosition <= 0) {
          scrollPosition = scrollContainer.scrollWidth / 2;
        }
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  const duplicatedRow1 = [...stylesRow1, ...stylesRow1];
  const duplicatedRow2 = [...stylesRow2, ...stylesRow2];

  return (
    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative">
        <AnimatedSection className="text-center space-y-4 md:space-y-5">
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-card border border-primary/30">
            <Palette className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-sm md:text-base font-medium text-primary">BIBLIOTECA VISUAL</span>
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
            <span className="text-primary">84 Estilos</span> Visuais
          </h2>
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
            Prontos para Usar
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            De <span className="text-primary font-semibold">Cinematográfico</span> a <span className="text-primary font-semibold">Anime</span>, 
            de <span className="text-primary font-semibold">Terror</span> a <span className="text-primary font-semibold">Fantasia</span>. 
            Encontre o estilo perfeito para cada vídeo.
          </p>
        </AnimatedSection>

        {/* Carousels Container */}
        <div 
          className="relative space-y-4 md:space-y-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          
          {/* Row 1 - Left to Right */}
          <div 
            ref={scrollRef1}
            className="flex gap-4 md:gap-5 overflow-x-hidden py-2"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow1.map((style, index) => (
              <StyleCard key={`row1-${style.id}-${index}`} style={style} index={index} />
            ))}
          </div>

          {/* Row 2 - Right to Left */}
          <div 
            ref={scrollRef2}
            className="flex gap-4 md:gap-5 overflow-x-hidden py-2"
            style={{ scrollBehavior: 'auto' }}
          >
            {duplicatedRow2.map((style, index) => (
              <StyleCard key={`row2-${style.id}-${index}`} style={style} index={index} />
            ))}
          </div>
        </div>

        {/* Stats and CTA */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 pt-4">
            <div className="flex items-center gap-8 md:gap-12">
              {[
                { value: "84", label: "Estilos" },
                { value: "7", label: "Categorias" },
                { value: "∞", label: "Possibilidades" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <Link to="/auth">
              <Button className="gradient-button text-primary-foreground font-semibold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg">
                <Palette className="w-5 h-5 mr-2" />
                Explorar Todos os Estilos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
