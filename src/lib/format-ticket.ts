export function formatTicketNumber(id: string): string {
  // Use last 6 chars of UUID as a short reference
  return `#${id.slice(-6).toUpperCase()}`;
}
