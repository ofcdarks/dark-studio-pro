import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

// Google AdSense logo as SVG component
const AdSenseLogo = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12">
    <circle cx="24" cy="24" r="22" fill="#4285F4"/>
    <circle cx="24" cy="24" r="16" fill="#34A853"/>
    <circle cx="24" cy="24" r="10" fill="#FBBC05"/>
    <circle cx="24" cy="24" r="5" fill="#EA4335"/>
  </svg>
);

// Different payment amounts to cycle through
const paymentAmounts = [
  { amount: "12,847.56", next: "14,230.00", impressions: "2.4M", rpm: "5.35", growth: "47" },
  { amount: "15,234.89", next: "16,890.00", impressions: "2.8M", rpm: "5.89", growth: "52" },
  { amount: "18,456.23", next: "20,100.00", impressions: "3.1M", rpm: "6.12", growth: "61" },
  { amount: "21,789.45", next: "23,500.00", impressions: "3.6M", rpm: "6.45", growth: "73" },
  { amount: "9,567.12", next: "11,200.00", impressions: "1.9M", rpm: "4.98", growth: "38" },
];

export const AdSenseCard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % paymentAmounts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = paymentAmounts[currentIndex];

  return (
    <Card className="p-0 bg-card border-border overflow-hidden max-w-md mx-auto">
      {/* Header - Blue like reference */}
      <div className="bg-[#1a73e8] p-5 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
            <AdSenseLogo />
          </div>
          <div>
            <p className="font-semibold text-white text-lg">Google AdSense</p>
            <p className="text-sm text-white/80">Pagamento processado</p>
          </div>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs bg-green-500/30 text-green-100 flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-green-400"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          Ativo
        </span>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Pagamento Recebido</p>
          <AnimatePresence mode="wait">
            <motion.p 
              key={current.amount}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-5xl font-bold mt-2"
            >
              <span className="text-muted-foreground text-2xl">$</span>
              {current.amount}
            </motion.p>
          </AnimatePresence>
          <p className="text-sm text-muted-foreground mt-1">USD · 1 de Janeiro, 2026</p>
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Método de pagamento</span>
            <span className="font-medium">Transferência bancária</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conta</span>
            <span className="font-medium">****4892</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="text-green-500 flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4" />
              Concluído
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 border-t border-border pt-5">
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p 
                key={current.impressions}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold"
              >
                {current.impressions}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground">Impressões</p>
          </div>
          <div className="text-center border-x border-border">
            <AnimatePresence mode="wait">
              <motion.p 
                key={current.rpm}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold text-blue-500"
              >
                ${current.rpm}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground">RPM</p>
          </div>
          <div className="text-center">
            <AnimatePresence mode="wait">
              <motion.p 
                key={current.growth}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-2xl font-bold text-green-500"
              >
                +{current.growth}%
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground">vs mês anterior</p>
          </div>
        </div>

        {/* Next Payment */}
        <div className="bg-muted/30 rounded-lg p-4 text-center border border-border">
          <p className="text-sm text-muted-foreground">
            Próximo pagamento estimado:{" "}
            <AnimatePresence mode="wait">
              <motion.span 
                key={current.next}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-foreground font-semibold text-lg"
              >
                ${current.next}
              </motion.span>
            </AnimatePresence>
          </p>
        </div>
      </div>
    </Card>
  );
};
