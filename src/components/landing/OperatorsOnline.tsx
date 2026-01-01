import { useState, useEffect } from "react";

interface Operator {
  initials: string;
  name: string;
  status: "online" | "away" | "busy";
  lastActive: string;
}

const operatorsData: Operator[] = [
  { initials: "RB", name: "Roberto B.", status: "online", lastActive: "Agora" },
  { initials: "MT", name: "Marina T.", status: "online", lastActive: "Agora" },
  { initials: "PN", name: "Pedro N.", status: "online", lastActive: "Agora" },
  { initials: "CH", name: "Carla H.", status: "away", lastActive: "5 min" },
  { initials: "MF", name: "Marcos F.", status: "online", lastActive: "Agora" },
  { initials: "BN", name: "Beatriz N.", status: "online", lastActive: "Agora" },
  { initials: "GR", name: "Gustavo R.", status: "busy", lastActive: "3 min" },
  { initials: "KM", name: "Karen M.", status: "online", lastActive: "Agora" },
  { initials: "TS", name: "Thiago S.", status: "online", lastActive: "Agora" },
  { initials: "FC", name: "Fernanda C.", status: "away", lastActive: "2 min" },
  { initials: "SP", name: "Samuel P.", status: "online", lastActive: "Agora" },
  { initials: "LM", name: "Larissa M.", status: "online", lastActive: "Agora" },
  { initials: "DR", name: "Daniel R.", status: "online", lastActive: "Agora" },
];

export const OperatorsOnline = () => {
  const [operators, setOperators] = useState<Operator[]>(operatorsData);
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    // Randomly update operator statuses every few seconds
    const interval = setInterval(() => {
      setOperators(prev => {
        return prev.map(op => {
          // 10% chance to change status
          if (Math.random() < 0.1) {
            const statuses: ("online" | "away" | "busy")[] = ["online", "away", "busy"];
            const weights = [0.7, 0.2, 0.1]; // More likely to be online
            const rand = Math.random();
            let cumulative = 0;
            let newStatus = op.status;
            
            for (let i = 0; i < statuses.length; i++) {
              cumulative += weights[i];
              if (rand < cumulative) {
                newStatus = statuses[i];
                break;
              }
            }
            
            return {
              ...op,
              status: newStatus,
              lastActive: newStatus === "online" ? "Agora" : `${Math.floor(Math.random() * 10) + 1} min`
            };
          }
          return op;
        });
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const count = operators.filter(op => op.status === "online").length;
    setOnlineCount(count);
  }, [operators]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "away": return "bg-yellow-500";
      case "busy": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const visibleOperators = operators.slice(0, 4);
  const remainingCount = operators.length - 4;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
          <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-50" />
        </div>
        <span className="text-base text-muted-foreground">
          <span className="text-green-400 font-semibold">{onlineCount}</span> operadores online
        </span>
      </div>
      
      <div className="flex -space-x-3">
        {visibleOperators.map((op, i) => (
          <div 
            key={i} 
            className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-10"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-background flex items-center justify-center text-sm font-semibold shadow-lg shadow-primary/20">
              {op.initials}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${getStatusColor(op.status)} border-2 border-background`} />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card rounded-lg border border-border shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              <p className="font-semibold text-sm">{op.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(op.status)}`} />
                {op.status === "online" ? "Online agora" : op.lastActive}
              </p>
            </div>
          </div>
        ))}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 border-2 border-background flex items-center justify-center text-sm text-primary font-bold shadow-lg shadow-primary/20">
          +{remainingCount}
        </div>
      </div>
      
      <div className="hidden lg:flex gap-2 flex-wrap">
        {operators.slice(4, 11).map((op, i) => (
          <div 
            key={i} 
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer hover:scale-105 ${
              op.status === "online" 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : op.status === "away"
                ? "bg-yellow-500/10 text-yellow-400/80 border border-yellow-500/20"
                : "bg-red-500/10 text-red-400/80 border border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(op.status)} ${op.status === "online" ? "animate-pulse" : ""}`} />
              {op.initials}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
