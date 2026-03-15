"use client";

import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface UndoEntry {
  type: string;
  description: string;
  undo: () => void;
}

export function useUndoStack() {
  const stackRef = useRef<UndoEntry[]>([]);

  const push = useCallback((entry: UndoEntry) => {
    stackRef.current.push(entry);
    // Keep max 20 entries
    if (stackRef.current.length > 20) {
      stackRef.current.shift();
    }

    toast(entry.description, {
      action: {
        label: "Undo",
        onClick: () => {
          const item = stackRef.current.pop();
          if (item) item.undo();
        },
      },
      duration: 5000,
    });
  }, []);

  const pop = useCallback(() => {
    const entry = stackRef.current.pop();
    if (entry) {
      entry.undo();
      toast(`Undone: ${entry.description}`);
    }
  }, []);

  return { push, pop };
}
