import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Video, TrendingUp, Plus } from "lucide-react";
import { useState } from "react";

const similarChannels = [
  { name: "Mystery Dark", subscribers: "890K", videos: 234, similarity: "92%" },
  { name: "Ancient Secrets", subscribers: "1.2M", videos: 567, similarity: "88%" },
  { name: "Dark History", subscribers: "456K", videos: 189, similarity: "85%" },
  { name: "Hidden Truth", subscribers: "678K", videos: 312, similarity: "82%" },
  { name: "Unexplained", subscribers: "345K", videos: 145, similarity: "79%" },
];

const SearchChannels = () => {
  const [channelUrl, setChannelUrl] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Buscar Canais Semelhantes</h1>
            <p className="text-muted-foreground">
              Encontre canais com conteúdo similar ao seu ou de referência
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cole a URL de um canal de referência..."
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="w-4 h-4 mr-2" />
                Buscar Similares
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            {similarChannels.map((channel, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{channel.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {channel.subscribers}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {channel.videos} vídeos
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Similaridade</p>
                      <p className="text-lg font-semibold text-primary">{channel.similarity}</p>
                    </div>
                    <Button variant="outline" size="icon" className="border-border text-primary hover:bg-secondary">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SearchChannels;
