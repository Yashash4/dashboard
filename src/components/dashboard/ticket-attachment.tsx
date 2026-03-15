"use client";

import { useState, useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface AttachmentFile {
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface UploadedAttachment {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  url: string;
}

interface TicketAttachmentUploadProps {
  ticketId: string;
  onAttached: (attachment: UploadedAttachment) => void;
}

const MAX_FILES = 5;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * File upload widget for ticket creation/reply.
 * Uploads to Supabase Storage bucket `ticket-attachments`.
 */
export function TicketAttachmentUpload({ ticketId, onAttached }: TicketAttachmentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate
    for (const file of files) {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} is too large. Max size is 10MB.`);
        return;
      }
    }

    if (pendingFiles.length + files.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} files per message.`);
      return;
    }

    setPendingFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("ticket_id", ticketId);

        const res = await fetch("/api/tickets/attachment", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          toast.error(data.error || `Failed to upload ${file.name}`);
          continue;
        }

        const data = await res.json();
        onAttached(data.attachment);
      }

      setPendingFiles([]);
      toast.success("Files uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip className="mr-1 h-3 w-3" />
          Attach
        </Button>
        {pendingFiles.length > 0 && (
          <Button
            type="button"
            size="sm"
            className="h-7 text-xs"
            onClick={uploadAll}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : null}
            Upload {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}
          </Button>
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {pendingFiles.map((file, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-2 py-1 border border-border text-xs"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-3 w-3 text-muted-foreground" />
              ) : (
                <FileText className="h-3 w-3 text-muted-foreground" />
              )}
              <span className="truncate max-w-32">{file.name}</span>
              <span className="text-muted-foreground">
                ({formatFileSize(file.size)})
              </span>
              <button
                type="button"
                onClick={() => removePending(i)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept="image/*,.pdf,.txt,.csv,.md,.doc,.docx"
        onChange={handleFileSelect}
      />
    </div>
  );
}

/**
 * Display an attached file with download link.
 * Images render inline, other files show as download links.
 */
export function TicketAttachmentDisplay({
  attachment,
}: {
  attachment: UploadedAttachment;
}) {
  const isImage = attachment.file_type.startsWith("image/");

  if (isImage) {
    return (
      <div className="mt-2">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={attachment.url}
            alt={attachment.file_name}
            className="max-w-xs max-h-48 border border-border object-contain"
          />
        </a>
        <p className="text-[10px] text-muted-foreground mt-1">
          {attachment.file_name} ({formatFileSize(attachment.file_size)})
        </p>
      </div>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 px-2 py-1 border border-border text-xs hover:bg-muted/50 transition-colors"
    >
      <Download className="h-3 w-3 text-muted-foreground" />
      <span>{attachment.file_name}</span>
      <span className="text-muted-foreground">
        ({formatFileSize(attachment.file_size)})
      </span>
    </a>
  );
}
