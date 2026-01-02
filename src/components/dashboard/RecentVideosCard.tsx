import { Clock, Eye, TrendingUp, DollarSign, Play } from "lucide-react";
import { motion } from "framer-motion";

const recentVideos = [
  {
    title: "Los Zapotecas: El Pueblo del Relámpago que Fundó Monte Albán",
    views: "4.2K",
    ctr: "0.0%",
    revenue: "N/A",
    channel: "LatinAmericaCulture",
  },
  {
    title: "GÖBEKLI TEPE: El Templo que PRECEDIÓ a la Historia | El Verd...",
    views: "9.7K",
    ctr: "0.0%",
    revenue: "N/A",
    channel: "LatinAmericaCulture",
  },
];

export function RecentVideosCard() {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">Vídeos Recentes</h3>
      </div>
      <div className="space-y-3">
        {recentVideos.map((video, index) => (
          <motion.div
            key={index}
            className="relative bg-secondary/30 border border-border/30 rounded-lg p-4 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/20 cursor-pointer overflow-hidden"
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
          >
            {/* Play icon on hover */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3 h-3 text-primary ml-0.5" />
            </div>
            
            <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-1 pr-10">
              {video.title}
            </h4>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {video.views}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {video.ctr}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                {video.revenue}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-2">{video.channel}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}