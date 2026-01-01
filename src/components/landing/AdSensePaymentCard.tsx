import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

const AdSensePaymentCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/30 rounded-3xl blur-2xl opacity-60" />
      
      {/* Card */}
      <div className="relative p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">AdSense Revenue</p>
              <p className="text-xs text-muted-foreground/70">Este mês</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-400">+127%</span>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <motion.p
            className="text-4xl font-black text-foreground"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            $12,847
            <span className="text-lg font-normal text-muted-foreground">.32</span>
          </motion.p>
          <p className="text-sm text-muted-foreground mt-1">Receita confirmada</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-lg font-bold text-primary">847K</p>
            <p className="text-[10px] text-muted-foreground">Views</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-lg font-bold text-foreground">$15.16</p>
            <p className="text-[10px] text-muted-foreground">CPM</p>
          </div>
          <div className="p-3 rounded-lg bg-background/50 border border-border/50">
            <p className="text-lg font-bold text-emerald-400">+42%</p>
            <p className="text-[10px] text-muted-foreground">Growth</p>
          </div>
        </div>

        {/* Payment Date */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Próximo pagamento: 21 de Janeiro</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AdSensePaymentCard;