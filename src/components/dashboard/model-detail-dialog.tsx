"use client";

import { Brain, Cpu, Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AvailableModel {
  name: string;
  display_name: string;
  context_limit: number;
  description: string | null;
}

function formatContext(limit: number) {
  if (limit >= 1000) return `${Math.round(limit / 1000)}K`;
  return String(limit);
}

export function ModelDetailDialog({
  model,
  isCurrentModel,
  open,
  onOpenChange,
  onSelect,
}: {
  model: AvailableModel | null;
  isCurrentModel: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (model: AvailableModel) => void;
}) {
  if (!model) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <DialogTitle>{model.display_name}</DialogTitle>
          </div>
          <DialogDescription>
            Full details for this model configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Context window */}
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Cpu className="h-4 w-4" />
              Context Window
            </div>
            <span className="text-sm font-semibold">
              {formatContext(model.context_limit)} tokens
            </span>
          </div>

          {/* Description */}
          {model.description && (
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Info className="h-4 w-4" />
                Description
              </div>
              <p className="text-sm">{model.description}</p>
            </div>
          )}

          {/* Status badge */}
          <div className="flex items-center gap-2">
            {isCurrentModel ? (
              <Badge className="bg-green-600 text-white border-green-600">
                Currently Active
              </Badge>
            ) : (
              <Badge variant="outline">Available</Badge>
            )}
          </div>
        </div>

        <DialogFooter>
          {isCurrentModel ? (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onSelect(model);
                }}
              >
                Select This Model
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
