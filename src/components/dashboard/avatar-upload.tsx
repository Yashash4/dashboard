"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

const EMOJI_OPTIONS = [
  "😊", "🚀", "💻", "🤖", "🎯", "⚡", "🌟", "🔥",
  "🎨", "📊", "🛡️", "🧠", "💡", "🎮", "🌍", "🦾",
];

export function AvatarUpload({ name, email, avatarUrl }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const initials = name?.[0]?.toUpperCase() || email[0].toUpperCase();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/account/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to upload avatar");
        return;
      }

      const data = await res.json();
      setCurrentAvatar(data.avatar_url);
      toast.success("Avatar updated");
      router.refresh();
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEmojiSelect = async (emoji: string) => {
    setUploading(true);
    setShowEmojiPicker(false);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to set avatar");
        return;
      }

      setCurrentAvatar(null); // Emoji avatars use a different display
      toast.success("Avatar updated");
      router.refresh();
    } catch {
      toast.error("Failed to set avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed to remove avatar");
        return;
      }
      setCurrentAvatar(null);
      toast.success("Avatar removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove avatar");
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Profile Photo</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            {currentAvatar && <AvatarImage src={currentAvatar} alt={name || "Avatar"} />}
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-mono">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="mr-2 h-3.5 w-3.5" />
                )}
                Upload Photo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                Choose Emoji
              </Button>
              {currentAvatar && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removing}
                  onClick={handleRemove}
                  className="text-muted-foreground"
                >
                  {removing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, or GIF. Max 5MB.
            </p>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="mt-4 p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-2">Choose an emoji avatar</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="w-10 h-10 text-xl flex items-center justify-center border border-border hover:bg-muted/50 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}
