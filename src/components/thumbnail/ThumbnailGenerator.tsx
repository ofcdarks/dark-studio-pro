import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Image, Wand2, Download, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThumbnailVariation {
  variationNumber: number;
  imageBase64: string;
  headline: string | null;
  seoDescription: string;
  seoTags: string;
  prompt: string;
  style: string;
}

interface ThumbnailResult {
  success: boolean;
  variations: ThumbnailVariation[];
  headlines: string[];
  videoTitle: string;
  niche: string;
  subNiche?: string;
}

const STYLES = [
  { value: "photorealistic", label: "Fotorealista" },
  { value: "cinematic", label: "Cinematográfico" },
  { value: "3d-render", label: "3D Render" },
  { value: "anime", label: "Anime/Ilustração" },
  { value: "dark-moody", label: "Dark/Moody" },
  { value: "vibrant", label: "Vibrante/Colorido" },
];

const LANGUAGES = [
  { value: "Português", label: "Português" },
  { value: "English", label: "English" },
  { value: "Español", label: "Español" },
];

export const ThumbnailGenerator = () => {
  const [videoTitle, setVideoTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [subNiche, setSubNiche] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [language, setLanguage] = useState("Português");
  const [includeHeadline, setIncludeHeadline] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ThumbnailResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!videoTitle.trim()) {
      toast.error("Insira o título do vídeo");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-thumbnail", {
        body: {
          videoTitle,
          niche: niche || "Geral",
          subNiche: subNiche || undefined,
          style,
          includeHeadline,
          language,
        },
      });

      if (error) throw error;

      if (data.success) {
        setResult(data);
        toast.success(`${data.variations.length} thumbnails geradas!`);
      } else {
        throw new Error(data.error || "Erro ao gerar thumbnails");
      }
    } catch (error) {
      console.error("Error generating thumbnails:", error);
      toast.error("Erro ao gerar thumbnails. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageBase64: string, index: number) => {
    try {
      const link = document.createElement("a");
      link.href = imageBase64;
      link.download = `thumbnail-variation-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download iniciado!");
    } catch (error) {
      toast.error("Erro ao fazer download");
    }
  };

  const handleCopyDescription = (description: string, index: number) => {
    navigator.clipboard.writeText(description);
    setCopiedIndex(index);
    toast.success("Descrição copiada!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyTags = (tags: string) => {
    navigator.clipboard.writeText(tags);
    toast.success("Tags copiadas!");
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Gerador de Thumbnails</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="videoTitle">Título do Vídeo *</Label>
            <Input
              id="videoTitle"
              placeholder="Ex: Como eu ganhei R$10.000 em 30 dias"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="niche">Nicho</Label>
            <Input
              id="niche"
              placeholder="Ex: Marketing Digital"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subNiche">Sub-Nicho (opcional)</Label>
            <Input
              id="subNiche"
              placeholder="Ex: Renda Extra"
              value={subNiche}
              onChange={(e) => setSubNiche(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Estilo Visual</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Idioma</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="includeHeadline"
              checked={includeHeadline}
              onCheckedChange={setIncludeHeadline}
            />
            <Label htmlFor="includeHeadline">Gerar Headlines</Label>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !videoTitle.trim()}
          className="mt-6 w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando 4 Variações...
            </>
          ) : (
            <>
              <Image className="w-4 h-4 mr-2" />
              Gerar 4 Thumbnails
            </>
          )}
        </Button>
      </Card>

      {/* Results Section */}
      {result && result.variations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            Thumbnails Geradas ({result.variations.length})
          </h3>

          {result.headlines.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium text-foreground mb-2">Headlines Geradas:</h4>
              <div className="flex flex-wrap gap-2">
                {result.headlines.map((headline, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {headline}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.variations.map((variation, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video relative bg-secondary">
                  <img
                    src={variation.imageBase64}
                    alt={`Variação ${variation.variationNumber}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-background/80 rounded text-xs font-medium">
                      {variation.style}
                    </span>
                  </div>
                  {variation.headline && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm font-bold">
                        {variation.headline}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Variação {variation.variationNumber}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(variation.imageBase64, index)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Descrição SEO</Label>
                    <div className="relative">
                      <Textarea
                        value={variation.seoDescription}
                        readOnly
                        className="mt-1 text-sm h-20 resize-none"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => handleCopyDescription(variation.seoDescription, index)}
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-success" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Tags SEO</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={variation.seoTags}
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleCopyTags(variation.seoTags)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isGenerating && !result && (
        <Card className="p-8">
          <div className="text-center">
            <Image className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h4 className="font-medium text-foreground mb-1">
              Nenhuma thumbnail gerada ainda
            </h4>
            <p className="text-sm text-muted-foreground">
              Preencha o formulário acima e clique em "Gerar 4 Thumbnails"
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
