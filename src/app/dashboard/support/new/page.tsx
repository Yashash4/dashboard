"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketAttachmentUpload } from "@/components/dashboard/ticket-attachment";

const TICKET_CATEGORIES = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing" },
  { value: "technical", label: "Technical" },
  { value: "account", label: "Account" },
  { value: "channels", label: "Channels" },
  { value: "agents", label: "Agents" },
  { value: "feature", label: "Feature Request" },
];

const ticketSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200, "Subject must be 200 characters or less"),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description must be 5000 characters or less"),
  priority: z.enum(["low", "medium", "high"]),
  category: z.string().optional(),
});

export default function NewTicketPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ticketId, setTicketId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = ticketSchema.safeParse({ subject, description, priority, category });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, priority, category }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create ticket");
        return;
      }

      toast.success("Ticket created");
      setTicketId(data.ticket_id);
      router.push(`/support/${data.ticket_id}`);
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2"
          onClick={() => router.push("/support")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Support
        </Button>
        <h1 className="text-2xl font-bold mb-1">New Ticket</h1>
        <p className="text-muted-foreground">
          Describe your issue and we&apos;ll get back to you.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
              />
              {errors.subject && (
                <p className="text-xs text-destructive">{errors.subject}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TICKET_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your issue in detail..."
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">{description.length}/5000</p>
            </div>

            {/* UX_06: File attachments -- only shown after ticket is created */}
            {ticketId && (
              <div className="space-y-2">
                <Label>Attachments</Label>
                <TicketAttachmentUpload ticketId={ticketId} onAttached={() => {}} />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Ticket
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/support")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
