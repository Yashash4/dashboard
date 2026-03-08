import { EventEmitter } from "events";

// Singleton event bus that persists across Next.js hot reloads
const globalBus = (globalThis as Record<string, unknown>).__mc_event_bus as
  | EventEmitter
  | undefined;
const eventBus = globalBus || new EventEmitter();
eventBus.setMaxListeners(100);
(globalThis as Record<string, unknown>).__mc_event_bus = eventBus;

export { eventBus };

// SSE event types
export type MCStreamEvent =
  | "task_created"
  | "task_updated"
  | "task_deleted"
  | "agent_status_changed"
  | "new_event"
  | "session_updated"
  | "ping";

export function emitMCEvent(
  userId: string,
  type: MCStreamEvent,
  data?: Record<string, unknown>
) {
  eventBus.emit(`mc:${userId}`, { type, data, timestamp: Date.now() });
}
