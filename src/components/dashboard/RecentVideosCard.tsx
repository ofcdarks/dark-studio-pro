import { Clock, Eye, TrendingUp, DollarSign } from "lucide-react";

const recentVideos = [
  {
    title: "Los Zapotecas: El Pueblo del Relámpago que Fundó Monte Albán",
    views: "4.2K views",
    ctr: "0.0% CTR",
    revenue: "N/A",
    channel: "LatinAmericaCulture",
  },
  {
    title: "GÖBEKLI TEPE: El Templo que PRECEDIÓ a la Historia | El Verd...",
    views: "9.7K views",
    ctr: "0.0% CTR",
    revenue: "N/A",
    channel: "LatinAmericaCulture",
  },
];

export function RecentVideosCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Vídeos Recentes</h3>
      </div>
      <div className="space-y-3">
        {recentVideos.map((video, index) => (
          <div
            key={index}
            className="bg-secondary/50 rounded-lg p-4 hover:bg-secondary transition-colors cursor-pointer"
          >
            <h4 className="font-medium text-foreground mb-2 line-clamp-1">
              {video.title}
            </h4>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {video.views}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {video.ctr}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {video.revenue}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{video.channel}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
