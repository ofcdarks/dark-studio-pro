import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbnailGenerator } from "@/components/thumbnail/ThumbnailGenerator";
import { Image, History } from "lucide-react";

const ThumbnailsPage = () => {
  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Thumbnails</h1>
            <p className="text-muted-foreground">
              Gere 4 variações de thumbnails otimizadas para YouTube com headlines e SEO
            </p>
          </div>

          <Tabs defaultValue="generator" className="space-y-6">
            <TabsList>
              <TabsTrigger value="generator" className="gap-2">
                <Image className="w-4 h-4" />
                Gerar Thumbnails
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator">
              <ThumbnailGenerator />
            </TabsContent>

            <TabsContent value="history">
              <div className="text-center py-12 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Histórico de thumbnails geradas em breve</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ThumbnailsPage;
