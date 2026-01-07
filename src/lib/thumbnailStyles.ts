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
    id: "3d-cinematic-miniature",
    name: "3D Cinematográfico Miniatura",
    description: "Animação 3D com paisagem em miniatura e timelapse",
    icon: "🏔️",
    category: "experimentais",
    promptPrefix: "Production ready 3D cinematic rendering, accurate scale lighting and camera motion, miniature landscape growth animation and timelapse when scene requires environmental or structural buildup, standard 3D cinematic visualization with controlled natural movement, hyper-detailed miniature world, tilt-shift depth of field, macro photography aesthetic, epic scale in small form,"
  },
  {
    id: "isometrico-arquitetonico",
    name: "Isométrico Arquitetônico",
    description: "Perspectiva isométrica com detalhes arquitetônicos",
    icon: "🏛️",
    category: "experimentais",
    promptPrefix: "Isometric architectural rendering, 3D isometric perspective, detailed architectural visualization, clean geometric shapes, precise angles, modern architectural design, blueprint aesthetic with color, technical illustration style, urban planning visualization,"
  },
  {
    id: "low-poly-stylized",
    name: "Low Poly Stylized",
    description: "Arte 3D estilizada com polígonos",
    icon: "💎",
    category: "experimentais",
    promptPrefix: "Low poly 3D art style, stylized geometric shapes, flat shaded polygons, vibrant color palette, modern game aesthetic, minimalist 3D design, crystal-like facets, angular beauty, indie game art style,"
  },
  {
    id: "claymation-3d",
    name: "Claymation 3D",
    description: "Estilo stop-motion com argila",
    icon: "🎭",
    category: "experimentais",
    promptPrefix: "Claymation style, 3D clay animation aesthetic, stop-motion look, handcrafted texture, plasticine material, Wallace and Gromit inspired, tactile organic shapes, warm handmade feeling,"
  },
  {
    id: "voxel-art",
    name: "Voxel Art 3D",
    description: "Cubos 3D estilo Minecraft",
    icon: "🧱",
    category: "experimentais",
    promptPrefix: "Voxel art style, 3D cube-based aesthetic, Minecraft inspired, blocky geometric design, retro gaming meets 3D, pixel art in three dimensions, colorful voxel world, charming cubic characters,"
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
