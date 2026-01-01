import { useState, useEffect } from "react";

const allOperators = [
  "JM", "AL", "CS", "RB", "MF", "LP", "TS", "GR", "DV", "FC", "MT", "KM",
  "RS", "CH", "VL", "BN", "PN", "SP", "LM", "DR"
];

export const OperatorsOnline = () => {
  const [visibleOperators, setVisibleOperators] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with random selection of 12 operators
    const shuffled = [...allOperators].sort(() => Math.random() - 0.5);
    setVisibleOperators(shuffled.slice(0, 12));
  }, []);

  useEffect(() => {
    // Randomly swap one operator every 3 seconds for dynamic effect
    const interval = setInterval(() => {
      setVisibleOperators(prev => {
        const newList = [...prev];
        const indexToReplace = Math.floor(Math.random() * newList.length);
        const available = allOperators.filter(op => !newList.includes(op));
        if (available.length > 0) {
          const newOp = available[Math.floor(Math.random() * available.length)];
          newList[indexToReplace] = newOp;
        }
        return newList;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Online indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm text-muted-foreground">Operadores online</span>
      </div>
      
      {/* Operator badges - simple rectangular style like original */}
      <div className="flex items-center gap-1 flex-wrap">
        {visibleOperators.map((initials, i) => (
          <div 
            key={`${initials}-${i}`}
            className="px-2 py-1 rounded bg-secondary/80 text-xs font-medium text-muted-foreground"
          >
            {initials}
          </div>
        ))}
      </div>
    </div>
  );
};
