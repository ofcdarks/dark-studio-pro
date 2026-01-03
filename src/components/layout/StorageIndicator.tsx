import { HardDrive } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function StorageIndicator() {
  const { storageUsed, storageLimit, usagePercent } = useStorage();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <HardDrive className="h-4 w-4" />
          {usagePercent > 80 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
          <span className="sr-only">Armazenamento</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            <span className="font-semibold">Armazenamento</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usado</span>
              <span className="font-medium">{storageUsed.toFixed(2)} GB</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usagePercent.toFixed(0)}% usado</span>
              <span>de {storageLimit.toFixed(1)} GB</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
