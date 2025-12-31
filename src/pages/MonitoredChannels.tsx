import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Plus, Search, Users, Video, TrendingUp, Bell } from "lucide-react";
import { useState } from "react";

const channels = [
  { name: "LatinAmericaCulture", subscribers: "245K", videos: 89, growth: "+12%", status: "active" },
  { name: "HistoryMystery", subscribers: "1.2M", videos: 234, growth: "+8%", status: "active" },
  { name: "DarkDocumentary", subscribers: "567K", videos: 156, growth: "+23%", status: "active" },
];

const MonitoredChannels = () => {
  const [channelUrl, setChannelUrl] = useState("");

  return (
    <MainLayout>
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Canais Monitorados</h1>
            <p className="text-muted-foreground">
              Acompanhe o desempenho dos canais concorrentes e de referência
            </p>
          </div>

          <Card className="p-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cole a URL do canal do YouTube..."
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Canal
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {channels.map((channel, index) => (
              <Card key={index} className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                      <Eye className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{channel.name}</h3>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {channel.subscribers}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-primary">
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Vídeos</p>
                    <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                      <Video className="w-4 h-4 text-primary" />
                      {channel.videos}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Crescimento</p>
                    <p className="text-lg font-semibold text-success flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {channel.growth}
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-border text-foreground hover:bg-secondary">
                  Ver Análise Completa
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MonitoredChannels;
