import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Crown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl border-b border-border/50" />
      
      <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
        {/* Logo */}
        <motion.div 
          className="flex items-center gap-3"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Crown className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl hidden sm:block">
            La Casa Dark <span className="text-gradient">CORE</span>
          </span>
        </motion.div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <motion.a
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            whileHover={{ y: -2 }}
          >
            Funcionalidades
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#como-funciona"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            whileHover={{ y: -2 }}
          >
            Como Funciona
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            whileHover={{ y: -2 }}
          >
            Planos
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
          <motion.a
            href="#faq"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            whileHover={{ y: -2 }}
          >
            FAQ
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </motion.a>
        </nav>

        {/* CTA Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="hero" size="sm">
              Começar Agora
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg bg-secondary/50"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
        >
          <nav className="container mx-auto px-6 py-4 flex flex-col gap-4">
            <a href="#features" className="text-foreground py-2" onClick={() => setIsOpen(false)}>
              Funcionalidades
            </a>
            <a href="#como-funciona" className="text-foreground py-2" onClick={() => setIsOpen(false)}>
              Como Funciona
            </a>
            <a href="#pricing" className="text-foreground py-2" onClick={() => setIsOpen(false)}>
              Planos
            </a>
            <a href="#faq" className="text-foreground py-2" onClick={() => setIsOpen(false)}>
              FAQ
            </a>
            <Link to="/auth" className="w-full">
              <Button variant="hero" className="w-full">
                Começar Agora
              </Button>
            </Link>
          </nav>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
