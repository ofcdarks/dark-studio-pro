import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StylePreviewCard } from "./StylePreviewCard";
import { 
  THUMBNAIL_STYLE_CATEGORIES, 
  THUMBNAIL_STYLES, 
  getStylesByCategory,
  getStyleById,
  ThumbnailStyle 
} from "@/lib/thumbnailStyles";
import { Palette, ChevronDown } from "lucide-react";

interface StyleSelectorProps {
  selectedStyleId: string;
  onStyleSelect: (styleId: string) => void;
}

export const StyleSelector = ({ selectedStyleId, onStyleSelect }: StyleSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("3d-animacao");
  
  const selectedStyle = getStyleById(selectedStyleId);
  
  const handleSelect = (style: ThumbnailStyle) => {
    onStyleSelect(style.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between h-auto py-3"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{selectedStyle?.icon || "🎨"}</span>
            <div className="text-left">
              <div className="font-medium">{selectedStyle?.name || "Selecionar Estilo"}</div>
              <div className="text-xs text-muted-foreground">{selectedStyle?.description || "Clique para escolher"}</div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Biblioteca de Estilos Visuais
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {THUMBNAIL_STYLE_CATEGORIES.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="text-xs px-3 py-1.5"
              >
                {cat.icon} {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="h-[55vh] mt-4 pr-4">
            {THUMBNAIL_STYLE_CATEGORIES.map((cat) => (
              <TabsContent key={cat.id} value={cat.id} className="mt-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-3 gap-4"
                  >
                    {getStylesByCategory(cat.id).map((style) => (
                      <StylePreviewCard
                        key={style.id}
                        style={style}
                        isSelected={selectedStyleId === style.id}
                        onClick={() => handleSelect(style)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </TabsContent>
            ))}
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
