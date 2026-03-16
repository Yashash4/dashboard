"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

interface Task {
  id: string;
  title: string;
  assigneeColor: string;
  borderColor: string;
  priority: "high" | "medium" | "low";
}

const priorityColors: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const initialColumns: Record<string, Task[]> = {
  todo: [
    { id: "t1", title: "Write FAQ content", assigneeColor: "#60a5fa", borderColor: "#60a5fa", priority: "medium" },
    { id: "t2", title: "Setup webhooks", assigneeColor: "#f472b6", borderColor: "#f472b6", priority: "low" },
    { id: "t3", title: "Train product agent", assigneeColor: "#a78bfa", borderColor: "#a78bfa", priority: "high" },
  ],
  progress: [
    { id: "p1", title: "Configure channels", assigneeColor: "#4ade80", borderColor: "#4ade80", priority: "high" },
    { id: "p2", title: "Test chat flow", assigneeColor: "#facc15", borderColor: "#facc15", priority: "medium" },
    { id: "p3", title: "Review analytics", assigneeColor: "#fb923c", borderColor: "#fb923c", priority: "low" },
  ],
  done: [
    { id: "d1", title: "Deploy support agent", assigneeColor: "#34d399", borderColor: "#34d399", priority: "high" },
    { id: "d2", title: "Connect WhatsApp", assigneeColor: "#60a5fa", borderColor: "#60a5fa", priority: "medium" },
  ],
};

const columnLabels: Record<string, string> = {
  todo: "To Do",
  progress: "In Progress",
  done: "Done",
};

function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-md border border-border bg-[#222222] p-2 text-[10px]"
      style={{ borderLeftWidth: 3, borderLeftColor: task.borderColor }}
    >
      <div className="flex items-center justify-between">
        <span className="text-foreground">{task.title}</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: task.assigneeColor }}
        />
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: priorityColors[task.priority] }}
        />
        <span className="text-[9px] text-muted-foreground capitalize">{task.priority}</span>
      </div>
    </motion.div>
  );
}

export function KanbanMockup() {
  const [columns, setColumns] = useState(initialColumns);
  const [fading, setFading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const moveCard = useCallback(() => {
    setColumns((prev) => {
      const progress = [...prev.progress];
      if (progress.length === 0) {
        // Fade out then reset instead of visual jump
        setFading(true);
        timeoutRef.current = setTimeout(() => {
          setColumns(initialColumns);
          setFading(false);
        }, 400);
        return prev;
      }
      const card = progress.shift()!;
      return {
        ...prev,
        progress,
        done: [card, ...prev.done],
      };
    });
  }, []);

  useEffect(() => {
    const id = setInterval(moveCard, 3000);
    return () => {
      clearInterval(id);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [moveCard]);

  return (
    <div
      className="w-full max-w-lg mx-auto font-mono transition-opacity duration-400"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <div className="grid grid-cols-3 gap-2">
        {(["todo", "progress", "done"] as const).map((col) => (
          <div key={col} className="rounded-lg border border-border bg-card p-2">
            <div className="flex items-center gap-1.5 mb-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    col === "todo" ? "#60a5fa" : col === "progress" ? "#f59e0b" : "#22c55e",
                }}
              />
              <span className="text-[10px] text-foreground font-medium">{columnLabels[col]}</span>
              <span className="text-[9px] text-muted-foreground ml-auto">{columns[col].length}</span>
            </div>
            <div className="space-y-1.5 min-h-[100px]">
              <AnimatePresence mode="popLayout">
                {columns[col].map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
