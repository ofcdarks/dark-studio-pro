import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HardDrive, Image, Database, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function AdminStorageTab() {
  const [loading, setLoading] = useState(false);
  const [minStorage, setMinStorage] = useState("0");

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Estatísticas do Servidor</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Total</p>
            <p className="text-2xl font-bold text-foreground">0 GB</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground mb-1">Espaço Usado (Total Usuários)</p>
            <p className="text-2xl font-bold text-foreground">0 GB</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Espaço Disponível (Livre)</p>
            <p className="text-2xl font-bold text-foreground">0 GB</p>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Imagens Geradas</p>
            <p className="text-2xl font-bold text-primary">0 MB</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Armazenamento por Usuário</h3>
          </div>
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Buscar por email ou nome..."
              className="w-64 bg-secondary border-border"
            />
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </div>
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      </Card>
    </div>
  );
}
