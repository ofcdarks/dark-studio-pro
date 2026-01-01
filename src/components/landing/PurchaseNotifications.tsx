import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Crown, Star } from "lucide-react";

const purchaseData = [
  { name: "Mariana L.", city: "Porto Alegre", plan: "MASTER PRO", time: "Agora mesmo" },
  { name: "Carlos E.", city: "São Paulo", plan: "TURBO MAKER", time: "Há 2 min" },
  { name: "Amanda S.", city: "Rio de Janeiro", plan: "START CREATOR", time: "Há 3 min" },
  { name: "Pedro H.", city: "Brasília", plan: "MASTER PRO", time: "Há 5 min" },
  { name: "Juliana M.", city: "Curitiba", plan: "TURBO MAKER", time: "Há 7 min" },
  { name: "Rafael C.", city: "Belo Horizonte", plan: "MASTER PRO", time: "Há 8 min" },
  { name: "Fernanda R.", city: "Salvador", plan: "START CREATOR", time: "Há 10 min" },
  { name: "Lucas P.", city: "Fortaleza", plan: "TURBO MAKER", time: "Há 12 min" },
  { name: "Beatriz A.", city: "Recife", plan: "MASTER PRO", time: "Há 15 min" },
  { name: "Thiago M.", city: "Florianópolis", plan: "TURBO MAKER", time: "Há 18 min" },
  { name: "Camila G.", city: "Manaus", plan: "START CREATOR", time: "Há 20 min" },
  { name: "Diego S.", city: "Goiânia", plan: "MASTER PRO", time: "Há 22 min" },
  { name: "Isabela F.", city: "Vitória", plan: "TURBO MAKER", time: "Há 25 min" },
  { name: "Gabriel R.", city: "Campinas", plan: "START CREATOR", time: "Há 28 min" },
  { name: "Natália L.", city: "Natal", plan: "MASTER PRO", time: "Há 30 min" },
  { name: "Vinícius O.", city: "João Pessoa", plan: "TURBO MAKER", time: "Há 32 min" },
  { name: "Larissa T.", city: "Campo Grande", plan: "START CREATOR", time: "Há 35 min" },
  { name: "Rodrigo N.", city: "Cuiabá", plan: "MASTER PRO", time: "Há 38 min" },
  { name: "Patrícia C.", city: "Teresina", plan: "TURBO MAKER", time: "Há 40 min" },
  { name: "André M.", city: "Maceió", plan: "START CREATOR", time: "Há 42 min" },
  { name: "Jéssica B.", city: "Aracaju", plan: "MASTER PRO", time: "Há 45 min" },
  { name: "Marcelo D.", city: "São Luís", plan: "TURBO MAKER", time: "Há 48 min" },
  { name: "Vanessa P.", city: "Belém", plan: "START CREATOR", time: "Há 50 min" },
  { name: "Eduardo K.", city: "Londrina", plan: "MASTER PRO", time: "Há 52 min" },
  { name: "Renata S.", city: "Santos", plan: "TURBO MAKER", time: "Há 55 min" },
];

export const PurchaseNotifications = () => {
  const [currentNotification, setCurrentNotification] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      setIsExiting(false);
      setIsVisible(true);
      
      // Hide after 4 seconds
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          setCurrentNotification((prev) => (prev + 1) % purchaseData.length);
        }, 500);
      }, 4000);
    };

    // Initial show after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000);

    // Then show every 8-15 seconds (random interval)
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 7000 + 8000; // 8-15 seconds
      setTimeout(showNotification, randomDelay);
    }, 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  const notification = purchaseData[currentNotification];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 left-8 z-50 hidden md:block">
      <Card 
        className={`p-4 bg-card border-border flex items-center gap-4 shadow-2xl shadow-primary/20 transition-all duration-500 ${
          isExiting ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
          <Crown className="w-7 h-7 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-primary font-semibold">🎉 Acabou de assinar!</span>
            <Star className="w-4 h-4 fill-primary text-primary" />
          </div>
          <p className="font-bold text-lg">{notification.name}</p>
          <p className="text-sm text-muted-foreground">
            {notification.city} • <span className="text-primary">{notification.plan}</span>
          </p>
          <p className="text-xs text-muted-foreground/70">{notification.time}</p>
        </div>
      </Card>
    </div>
  );
};
