import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RequireWhatsAppModalProps {
  open: boolean;
  userId: string;
  onComplete: () => void;
}

export function RequireWhatsAppModal({ open, userId, onComplete }: RequireWhatsAppModalProps) {
  const [whatsapp, setWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const formatWhatsApp = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    
    // Format as Brazilian phone: +55 (11) 99999-9999
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `+${digits.slice(0, 2)} (${digits.slice(2)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4)}`;
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9, 13)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSave = async () => {
    const digits = whatsapp.replace(/\D/g, "");
    
    if (digits.length < 12) {
      toast.error("Digite um número de WhatsApp válido com DDD");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ whatsapp: whatsapp })
        .eq("id", userId);

      if (error) throw error;

      toast.success("WhatsApp cadastrado com sucesso!");
      onComplete();
    } catch (error: any) {
      console.error("Error saving WhatsApp:", error);
      toast.error("Erro ao salvar WhatsApp");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="bg-card border-primary/50 rounded-xl shadow-xl sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Phone className="w-5 h-5 text-primary" />
            Cadastre seu WhatsApp
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Para continuar usando a plataforma, precisamos do seu número de WhatsApp para suporte e notificações importantes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número do WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="+55 (11) 99999-9999"
              value={whatsapp}
              onChange={handleChange}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Inclua o código do país e DDD
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleSave} 
            disabled={saving || whatsapp.replace(/\D/g, "").length < 12}
            className="w-full"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Phone className="w-4 h-4 mr-2" />
            )}
            Salvar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
