import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, MessageSquare, Users, Play, Pause, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AdminNotificationsTab() {
  const [purchaseEnabled, setPurchaseEnabled] = useState(true);
  const [newUserEnabled, setNewUserEnabled] = useState(true);
  const [purchaseMessage, setPurchaseMessage] = useState("");
  const [newUserMessage, setNewUserMessage] = useState("");
  const [purchaseLoop, setPurchaseLoop] = useState(false);
  const [newUserLoop, setNewUserLoop] = useState(false);
  const [fakeQuantity, setFakeQuantity] = useState("100");
  const [fakeDelay, setFakeDelay] = useState("60");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    if (data?.value) {
      const n = data.value as Record<string, any>;
      setPurchaseEnabled(n.purchase_enabled ?? true);
      setNewUserEnabled(n.new_user_enabled ?? true);
    }
  };

  const saveSettings = async () => {
    const { data: current } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notifications")
      .single();

    const { error } = await supabase
      .from("admin_settings")
      .update({
        value: {
          ...(current?.value as object),
          purchase_enabled: purchaseEnabled,
          new_user_enabled: newUserEnabled,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", "notifications");

    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações salvas!");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuração de Notificações</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Notificações de Compra</h4>
              <Switch checked={purchaseEnabled} onCheckedChange={setPurchaseEnabled} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">SID</label>
                <Input className="bg-secondary border-border" placeholder="SID" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Mensagem</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="[push] ou cultura de compras no plano [plano]"
                  value={purchaseMessage}
                  onChange={(e) => setPurchaseMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground">Notificações de Novos Usuários</h4>
              <Switch checked={newUserEnabled} onCheckedChange={setNewUserEnabled} />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">SID</label>
                <Input className="bg-secondary border-border" placeholder="SID" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">Mensagem</label>
                <Input
                  className="bg-secondary border-border"
                  placeholder="[push] ou cultura de eventos na plataforma"
                  value={newUserMessage}
                  onChange={(e) => setNewUserMessage(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        <Button onClick={saveSettings} className="w-full mt-4 bg-success text-success-foreground">
          Salvar Configurações
        </Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-foreground">Usuários Fictícios</h3>
        </div>
        <div className="flex gap-4 mb-4">
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            Adicionar Usuário Fictício
          </Button>
          <Button variant="outline" className="border-blue-500 text-blue-500">
            Criar 100 Usuários (60 Compra + 40 Novo)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Nenhum usuário fictício cadastrado.
        </p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Play className="w-5 h-5 text-green-500" />
          <h3 className="font-semibold text-foreground">Controles de Loop</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-4">Notificações de Compra</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => setPurchaseLoop(!purchaseLoop)}
                className={purchaseLoop ? "bg-destructive" : "bg-success"}
              >
                {purchaseLoop ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {purchaseLoop ? "Parar Loop" : "Iniciar Loop"}
              </Button>
              <Button variant="secondary">Pausar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {purchaseLoop ? "Em execução..." : "Aguardando..."}
            </p>
          </div>
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="font-medium text-foreground mb-4">Notificações de Novos Usuários</h4>
            <div className="flex gap-2">
              <Button
                onClick={() => setNewUserLoop(!newUserLoop)}
                className={newUserLoop ? "bg-destructive" : "bg-success"}
              >
                {newUserLoop ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {newUserLoop ? "Parar Loop" : "Iniciar Loop"}
              </Button>
              <Button variant="secondary">Pausar</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {newUserLoop ? "Em execução..." : "Aguardando..."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
