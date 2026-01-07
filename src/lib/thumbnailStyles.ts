export interface ThumbnailStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  promptPrefix: string;
}

export const THUMBNAIL_STYLE_CATEGORIES = [
  {
    id: "realistas",
    name: "Estilos Realistas",
    icon: "🎨"
  },
  {
    id: "artisticos",
    name: "Estilos Artísticos",
    icon: "🎨"
  },
  {
    id: "minimalistas",
    name: "Estilos Minimalistas",
    icon: "🎨"
  },
  {
    id: "vibrantes",
    name: "Estilos Vibrantes",
    icon: "🎨"
  },
  {
    id: "dramaticos",
    name: "Estilos Dramáticos",
    icon: "🎨"
  },
  {
    id: "experimentais",
    name: "Estilos Experimentais 2025",
    icon: "🎨"
  },
  {
    id: "3d-animacao",
    name: "3D & Animação",
    icon: "🎮"
  }
];

export const THUMBNAIL_STYLES: ThumbnailStyle[] = [
  // Estilos Realistas
  {
    id: "foto-realista",
    name: "Foto Realista",
    description: "Ultra HD, detalhes perfeitos",
    icon: "📷",
    category: "realistas",
    promptPrefix: "Photorealistic, ultra high definition, perfect lighting, sharp focus, professional photography, 8K quality,"
  },
  {
    id: "cinematografico",
    name: "Cinematográfico",
    description: "Estilo Hollywood, dramático",
    icon: "🎬",
    category: "realistas",
    promptPrefix: "Cinematic style, Hollywood movie aesthetic, dramatic lighting, film grain, anamorphic lens, epic composition,"
  },
  {
    id: "documentario",
    name: "Documentário",
    description: "Natural, autêntico",
    icon: "📹",
    category: "realistas",
    promptPrefix: "Documentary style, natural lighting, authentic atmosphere, candid capture, raw and genuine,"
  },
  {
    id: "narrativa-cinematografica",
    name: "Narrativa Cinematográfica",
    description: "Storytelling visual",
    icon: "🎥",
    category: "realistas",
    promptPrefix: "Visual storytelling, narrative composition, emotional depth, cinematic framing, meaningful atmosphere,"
  },
  {
    id: "retrato-editorial",
    name: "Retrato Editorial",
    description: "Estilo revista de moda",
    icon: "👔",
    category: "realistas",
    promptPrefix: "Editorial portrait style, fashion magazine aesthetic, professional studio lighting, high-end retouching, Vogue quality,"
  },
  {
    id: "natureza-wildlife",
    name: "Natureza & Wildlife",
    description: "National Geographic",
    icon: "🦁",
    category: "realistas",
    promptPrefix: "Wildlife photography, National Geographic style, natural habitat, golden hour lighting, majestic wildlife, ultra detailed,"
  },
  {
    id: "arquitetura-moderna",
    name: "Arquitetura Moderna",
    description: "Design contemporâneo",
    icon: "🏙️",
    category: "realistas",
    promptPrefix: "Modern architecture photography, contemporary design, clean lines, dramatic perspectives, architectural digest style,"
  },

  // Estilos Artísticos
  {
    id: "anime",
    name: "Anime",
    description: "Estilo japonês animado",
    icon: "🌸",
    category: "artisticos",
    promptPrefix: "Anime style, Japanese animation aesthetic, vibrant colors, expressive characters, detailed backgrounds, Studio Ghibli inspired,"
  },
  {
    id: "desenho-animado",
    name: "Desenho Animado",
    description: "Colorido e expressivo",
    icon: "🎨",
    category: "artisticos",
    promptPrefix: "Cartoon style, colorful and expressive, bold outlines, playful atmosphere, animated look,"
  },
  {
    id: "cartoon-premium",
    name: "Cartoon Premium",
    description: "Alta qualidade animada",
    icon: "✨",
    category: "artisticos",
    promptPrefix: "Premium cartoon style, high-quality animation, Pixar/Disney quality, detailed textures, professional rendering,"
  },
  {
    id: "fantasia",
    name: "Fantasia",
    description: "Mágico e épico",
    icon: "🪄",
    category: "artisticos",
    promptPrefix: "Fantasy style, magical atmosphere, epic scale, ethereal lighting, mystical elements, enchanted world,"
  },
  {
    id: "comic-book",
    name: "Comic Book",
    description: "HQ americana clássica",
    icon: "💥",
    category: "artisticos",
    promptPrefix: "Comic book style, Marvel/DC aesthetic, bold ink lines, halftone dots, dynamic action poses, vibrant superhero colors,"
  },
  {
    id: "manga-shonen",
    name: "Manga Shonen",
    description: "Estilo Dragon Ball/Naruto",
    icon: "⚡",
    category: "artisticos",
    promptPrefix: "Shonen manga style, dynamic action lines, intense expressions, power auras, battle scenes, Japanese comic aesthetic,"
  },
  {
    id: "aquarela-digital",
    name: "Aquarela Digital",
    description: "Pintura suave e fluida",
    icon: "🎨",
    category: "artisticos",
    promptPrefix: "Digital watercolor style, soft flowing colors, delicate brush strokes, artistic bleeding effects, painterly aesthetic,"
  },
  {
    id: "oleo-classico",
    name: "Óleo Clássico",
    description: "Pintura renascentista",
    icon: "🖼️",
    category: "artisticos",
    promptPrefix: "Classical oil painting style, Renaissance masters technique, rich textures, dramatic chiaroscuro, museum quality art,"
  },
  {
    id: "pop-art",
    name: "Pop Art",
    description: "Andy Warhol vibes",
    icon: "🎭",
    category: "artisticos",
    promptPrefix: "Pop art style, Andy Warhol inspired, bold primary colors, Ben-Day dots, iconic repetition, 60s aesthetic,"
  },

  // Estilos Minimalistas
  {
    id: "desenho-palitos",
    name: "Desenho de Palitos",
    description: "Simples e minimalista",
    icon: "👤",
    category: "minimalistas",
    promptPrefix: "Stick figure style, minimalist, simple lines, clean background, straightforward illustration,"
  },
  {
    id: "quadro-branco",
    name: "Quadro Branco",
    description: "Explicativo e limpo",
    icon: "📋",
    category: "minimalistas",
    promptPrefix: "Whiteboard style, clean explanatory visuals, hand-drawn look, educational aesthetic, simple and clear,"
  },
  {
    id: "tech-minimalista",
    name: "Tech Minimalista",
    description: "Moderno e clean",
    icon: "💻",
    category: "minimalistas",
    promptPrefix: "Tech minimalist style, modern and clean, sleek design, subtle gradients, professional tech aesthetic,"
  },
  {
    id: "narrativa-espiritual-minimalista",
    name: "Narrativa Espiritual Minimalista",
    description: "Sereno",
    icon: "🧘",
    category: "minimalistas",
    promptPrefix: "Spiritual minimalist style, serene atmosphere, peaceful composition, soft colors, zen aesthetic, mindful design,"
  },
  {
    id: "flat-design",
    name: "Flat Design",
    description: "Vetorial moderno",
    icon: "📐",
    category: "minimalistas",
    promptPrefix: "Flat design style, vector illustration, bold colors, no gradients, clean geometric shapes, modern UI aesthetic,"
  },
  {
    id: "line-art",
    name: "Line Art Elegante",
    description: "Traços finos e sofisticados",
    icon: "✍️",
    category: "minimalistas",
    promptPrefix: "Elegant line art, fine detailed strokes, sophisticated single-line illustration, artistic contours, premium minimalism,"
  },
  {
    id: "silhueta-dramatica",
    name: "Silhueta Dramática",
    description: "Formas em contraste",
    icon: "🌅",
    category: "minimalistas",
    promptPrefix: "Dramatic silhouette style, high contrast, bold shapes against light, sunset/sunrise backdrop, powerful minimalism,"
  },

  // Estilos Vibrantes
  {
    id: "viral-vibrante",
    name: "Viral Vibrante",
    description: "Alto contraste, cores intensas",
    icon: "🔥",
    category: "vibrantes",
    promptPrefix: "Vibrant viral style, high contrast, intense saturated colors, bold composition, eye-catching, trending aesthetic,"
  },
  {
    id: "documentario-moderno",
    name: "Documentário Moderno",
    description: "Dinâmico e atual",
    icon: "📺",
    category: "vibrantes",
    promptPrefix: "Modern documentary style, dynamic composition, contemporary aesthetic, engaging visuals, current and fresh,"
  },
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    description: "Futurista com neons",
    icon: "🌃",
    category: "vibrantes",
    promptPrefix: "Cyberpunk neon style, futuristic cityscape, glowing neon lights, Blade Runner aesthetic, rain-soaked streets, high-tech low-life,"
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    description: "Estética retrô-futurista",
    icon: "🌴",
    category: "vibrantes",
    promptPrefix: "Vaporwave aesthetic, 80s retro-futurism, pink and cyan gradients, Greek statues, palm trees, sunset grids, nostalgic digital,"
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Outrun, sunset grid",
    icon: "🚗",
    category: "vibrantes",
    promptPrefix: "Synthwave style, Outrun aesthetic, neon sunset, chrome reflections, retro sports cars, 80s sci-fi, digital sunset grid,"
  },
  {
    id: "tropical-paradise",
    name: "Tropical Paradise",
    description: "Cores vibrantes de praia",
    icon: "🏝️",
    category: "vibrantes",
    promptPrefix: "Tropical paradise style, vibrant beach colors, turquoise waters, palm trees, golden sunshine, vacation vibes, exotic beauty,"
  },
  {
    id: "gradiente-aurora",
    name: "Gradiente Aurora",
    description: "Cores fluidas mescladas",
    icon: "🌈",
    category: "vibrantes",
    promptPrefix: "Aurora gradient style, flowing color transitions, iridescent hues, northern lights aesthetic, ethereal color blend,"
  },

  // Estilos Dramáticos
  {
    id: "terror-analogico",
    name: "Terror Analógico",
    description: "Estética VHS, sombrio",
    icon: "👻",
    category: "dramaticos",
    promptPrefix: "Analog horror style, VHS aesthetic, dark and eerie, grainy texture, unsettling atmosphere, retro horror,"
  },
  {
    id: "teatro-sombrio",
    name: "Teatro Sombrio",
    description: "Dramático e intenso",
    icon: "🎭",
    category: "dramaticos",
    promptPrefix: "Dark theater style, dramatic intensity, spotlight effects, theatrical composition, moody and intense,"
  },
  {
    id: "drama-naturalista",
    name: "Drama Naturalista",
    description: "Realista e emocional",
    icon: "🎬",
    category: "dramaticos",
    promptPrefix: "Naturalistic drama style, realistic and emotional, subtle lighting, authentic atmosphere, human connection,"
  },
  {
    id: "noir-classico",
    name: "Noir Clássico",
    description: "Preto e branco cinematográfico",
    icon: "🕵️",
    category: "dramaticos",
    promptPrefix: "Film noir style, black and white, dramatic shadows, venetian blind lighting, detective mystery, 1940s Hollywood,"
  },
  {
    id: "gotico-vitoriano",
    name: "Gótico Vitoriano",
    description: "Dark academia, sombrio",
    icon: "🏰",
    category: "dramaticos",
    promptPrefix: "Victorian gothic style, dark academia aesthetic, ornate architecture, candlelit atmosphere, mysterious and elegant,"
  },
  {
    id: "apocaliptico",
    name: "Apocalíptico",
    description: "Pós-apocalipse, destruição",
    icon: "💀",
    category: "dramaticos",
    promptPrefix: "Post-apocalyptic style, dystopian landscape, destroyed cities, dramatic skies, survival aesthetic, Mad Max vibes,"
  },
  {
    id: "suspense-thriller",
    name: "Suspense Thriller",
    description: "Tensão e mistério",
    icon: "🔍",
    category: "dramaticos",
    promptPrefix: "Thriller suspense style, tense atmosphere, shadowy figures, mysterious lighting, edge-of-seat composition, Hitchcock inspired,"
  },

  // Estilos Experimentais 2025
  {
    id: "diorama-cinematografico",
    name: "Diorama Cinematográfico Narrativo",
    description: "Miniatura/maquete com iluminação cinematográfica",
    icon: "🎬",
    category: "experimentais",
    promptPrefix: "Cinematic diorama style, miniature world, detailed model lighting, narrative composition, tilt-shift effect, theatrical miniature,"
  },
  {
    id: "neo-realismo-espiritual",
    name: "Neo-Realismo Espiritual",
    description: "Transcendente",
    icon: "⭐",
    category: "experimentais",
    promptPrefix: "Neo-spiritual realism, transcendent atmosphere, ethereal glow, spiritual elements, otherworldly beauty, divine lighting,"
  },
  {
    id: "surrealismo-psicologico",
    name: "Surrealismo Psicológico",
    description: "Onírico",
    icon: "🌀",
    category: "experimentais",
    promptPrefix: "Psychological surrealism, dreamlike quality, oniric atmosphere, subconscious imagery, Dalí-inspired, mind-bending visuals,"
  },
  {
    id: "memoria-fragmentada",
    name: "Memória Fragmentada",
    description: "Narrativa quebrada",
    icon: "💔",
    category: "experimentais",
    promptPrefix: "Fragmented memory style, broken narrative, collage elements, displaced time, nostalgic fragments, scattered composition,"
  },
  {
    id: "narrativa-fragmentada",
    name: "Narrativa Fragmentada",
    description: "Estilo colagem",
    icon: "📰",
    category: "experimentais",
    promptPrefix: "Fragmented narrative, collage style, mixed media aesthetic, layered composition, editorial design, artistic montage,"
  },
  {
    id: "sonho-real",
    name: "Sonho-Real",
    description: "Limiar entre sonho e realidade",
    icon: "🌙",
    category: "experimentais",
    promptPrefix: "Dream-reality style, liminal space, between dream and reality, soft surreal lighting, ethereal atmosphere, dreamscape,"
  },
  {
    id: "vhs-nostalgico",
    name: "VHS Nostálgico",
    description: "Estética anos 80/90",
    icon: "📼",
    category: "experimentais",
    promptPrefix: "VHS nostalgic style, 80s/90s aesthetic, retro grain, scan lines, vintage color palette, analog warmth, retrowave,"
  },
  {
    id: "glitch-art",
    name: "Glitch Art",
    description: "Digital distorcido",
    icon: "📺",
    category: "experimentais",
    promptPrefix: "Glitch art style, digital distortion, corrupted data aesthetic, RGB split, pixelated errors, cybernetic malfunction,"
  },
  {
    id: "double-exposure",
    name: "Double Exposure",
    description: "Sobreposição artística",
    icon: "👤",
    category: "experimentais",
    promptPrefix: "Double exposure style, artistic overlay, silhouette with landscape, dreamy composition, ethereal blend, photographic art,"
  },
  {
    id: "infravermelho",
    name: "Infravermelho",
    description: "Cores invertidas surreais",
    icon: "🌿",
    category: "experimentais",
    promptPrefix: "Infrared photography style, inverted colors, pink and white foliage, surreal landscape, ethereal atmosphere, false color,"
  },

  // 3D & Animação
  {
    id: "3d-cinematic-miniature",
    name: "3D Cinematográfico Miniatura",
    description: "Animação 3D com paisagem em miniatura e timelapse",
    icon: "🏔️",
    category: "3d-animacao",
    promptPrefix: "Production ready 3D cinematic rendering, accurate scale lighting and camera motion, miniature landscape growth animation and timelapse when scene requires environmental or structural buildup, standard 3D cinematic visualization with controlled natural movement, hyper-detailed miniature world, tilt-shift depth of field, macro photography aesthetic, epic scale in small form,"
  },
  {
    id: "isometrico-arquitetonico",
    name: "Isométrico Arquitetônico",
    description: "Perspectiva isométrica com detalhes arquitetônicos",
    icon: "🏛️",
    category: "3d-animacao",
    promptPrefix: "Isometric architectural rendering, 3D isometric perspective, detailed architectural visualization, clean geometric shapes, precise angles, modern architectural design, blueprint aesthetic with color, technical illustration style, urban planning visualization,"
  },
  {
    id: "low-poly-stylized",
    name: "Low Poly Stylized",
    description: "Arte 3D estilizada com polígonos",
    icon: "💎",
    category: "3d-animacao",
    promptPrefix: "Low poly 3D art style, stylized geometric shapes, flat shaded polygons, vibrant color palette, modern game aesthetic, minimalist 3D design, crystal-like facets, angular beauty, indie game art style,"
  },
  {
    id: "claymation-3d",
    name: "Claymation 3D",
    description: "Estilo stop-motion com argila",
    icon: "🎭",
    category: "3d-animacao",
    promptPrefix: "Claymation style, 3D clay animation aesthetic, stop-motion look, handcrafted texture, plasticine material, Wallace and Gromit inspired, tactile organic shapes, warm handmade feeling,"
  },
  {
    id: "voxel-art",
    name: "Voxel Art 3D",
    description: "Cubos 3D estilo Minecraft",
    icon: "🧱",
    category: "3d-animacao",
    promptPrefix: "Voxel art style, 3D cube-based aesthetic, Minecraft inspired, blocky geometric design, retro gaming meets 3D, pixel art in three dimensions, colorful voxel world, charming cubic characters,"
  },
  {
    id: "anime-3d",
    name: "Anime 3D",
    description: "Anime renderizado em 3D",
    icon: "🌸",
    category: "3d-animacao",
    promptPrefix: "3D anime style, cel-shaded rendering, Japanese animation in 3D, vibrant anime colors, expressive 3D characters, Genshin Impact aesthetic, stylized 3D animation,"
  },
  {
    id: "pixar-disney",
    name: "Pixar/Disney 3D",
    description: "Animação estilo estúdio premium",
    icon: "✨",
    category: "3d-animacao",
    promptPrefix: "Pixar Disney 3D animation style, premium studio quality, subsurface scattering skin, detailed hair simulation, expressive characters, theatrical lighting, family-friendly aesthetic, award-winning animation quality,"
  },
  {
    id: "unreal-engine",
    name: "Unreal Engine",
    description: "Hiperrealismo de games AAA",
    icon: "🎮",
    category: "3d-animacao",
    promptPrefix: "Unreal Engine 5 quality, AAA game graphics, ray tracing, photorealistic rendering, next-gen visuals, cinematic game cutscene,"
  },
  {
    id: "paper-craft",
    name: "Paper Craft 3D",
    description: "Arte de papel recortado",
    icon: "📄",
    category: "3d-animacao",
    promptPrefix: "Paper craft 3D style, layered paper cutout aesthetic, origami inspired, handmade paper texture, delicate shadows, whimsical papercraft world,"
  },
  {
    id: "neon-3d",
    name: "Neon 3D",
    description: "Linhas de luz em 3D",
    icon: "💡",
    category: "3d-animacao",
    promptPrefix: "3D neon style, glowing light tubes, wireframe aesthetic, dark background with neon outlines, futuristic light sculpture, Tron inspired,"
  }
];

export const getStylesByCategory = (categoryId: string): ThumbnailStyle[] => {
  return THUMBNAIL_STYLES.filter(style => style.category === categoryId);
};

export const getStyleById = (styleId: string): ThumbnailStyle | undefined => {
  return THUMBNAIL_STYLES.find(style => style.id === styleId);
};

export const getAllStyles = (): ThumbnailStyle[] => {
  return THUMBNAIL_STYLES;
};
