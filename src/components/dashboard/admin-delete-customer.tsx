"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  userId: string;
  email: string;
  name: string | null;
}

export function AdminDeleteCustomer({ userId, email, name }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const isConfirmed = confirmText === "confirm";

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/customers/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete customer");
        return;
      }

      toast.success(`Customer ${name || email} deleted`);
      setOpen(false);
      router.push("/admin/customers");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-red-600/30">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-red-500">
          Danger Zone
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-red-500" />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Permanently delete this customer account and all associated data
          (subscription, VPS, agents, channels, tickets, chat history).
          This action cannot be undone.
        </p>

        <Dialog open={open} onOpenChange={(v) => { setOpen(v); setConfirmText(""); }}>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {name || "Customer"}?</DialogTitle>
              <DialogDescription>
                This will permanently delete <strong>{email}</strong> and all
                their data including subscription, VPS instance, agents,
                channels, support tickets, and chat history.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <p className="text-sm">
                Type <code className="bg-muted px-1.5 py-0.5 text-xs font-mono">confirm</code> to
                proceed:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type confirm"
                className="font-mono"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!isConfirmed || deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}
                Delete Permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
