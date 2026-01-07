import { motion } from "framer-motion";
import { ThumbnailStyle } from "@/lib/thumbnailStyles";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Import real preview images for 3D styles
import preview3DCinematic from "@/assets/style-previews/3d-cinematic-miniature.jpg";
import previewIsometric from "@/assets/style-previews/isometrico-arquitetonico.jpg";
import previewLowPoly from "@/assets/style-previews/low-poly-stylized.jpg";
import previewClaymation from "@/assets/style-previews/claymation-3d.jpg";
import previewVoxel from "@/assets/style-previews/voxel-art.jpg";
import previewAnime3D from "@/assets/style-previews/anime-3d.jpg";
import previewPixar from "@/assets/style-previews/pixar-disney.jpg";

interface StylePreviewCardProps {
  style: ThumbnailStyle;
  isSelected: boolean;
  onClick: () => void;
}

// Map style IDs to their real preview images
const styleImages: Record<string, string> = {
  "3d-cinematic-miniature": preview3DCinematic,
  "isometrico-arquitetonico": previewIsometric,
  "low-poly-stylized": previewLowPoly,
  "claymation-3d": previewClaymation,
  "voxel-art": previewVoxel,
  "anime-3d": previewAnime3D,
  "pixar-disney": previewPixar,
};

// Fallback visual for styles without real images
const DefaultStyleVisual = ({ style }: { style: ThumbnailStyle }) => (
  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
    <span className="text-4xl">{style.icon}</span>
  </div>
);

export const StylePreviewCard = ({ style, isSelected, onClick }: StylePreviewCardProps) => {
  const previewImage = styleImages[style.id];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
        isSelected 
          ? "border-primary ring-2 ring-primary/30" 
          : "border-border hover:border-primary/50"
      )}
    >
      {/* Preview Visual */}
      <div className="aspect-video w-full">
        {previewImage ? (
          <img 
            src={previewImage} 
            alt={style.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <DefaultStyleVisual style={style} />
        )}
      </div>
      
      {/* Info */}
      <div className="p-3 bg-card">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground truncate">{style.name}</h4>
            <p className="text-xs text-muted-foreground truncate">{style.description}</p>
          </div>
        </div>
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.div>
  );
};
