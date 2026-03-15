"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AgentRatingProps {
  agentId: string;
  isOwned: boolean;
}

interface Review {
  id: string;
  rating: number;
  text: string;
  created_at: string;
  user_name: string;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "sm",
}: {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={cn(
            "transition-colors",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          )}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        >
          <Star
            className={cn(
              sizeClass,
              (hovered || value) >= star
                ? "fill-yellow-500 text-yellow-500"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export function AgentRating({ agentId, isOwned }: AgentRatingProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReviews = async () => {
    if (loaded) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`);
      if (res.status === 404) {
        setComingSoon(true);
        setLoaded(true);
        return;
      }
      if (!res.ok) {
        setComingSoon(true);
        setLoaded(true);
        return;
      }
      const data = await res.json();
      setReviews(data.reviews || []);
      setAverageRating(data.average_rating || 0);
      setReviewCount(data.review_count || 0);
      setLoaded(true);
    } catch {
      setComingSoon(true);
      setLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (newRating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/agents/${agentId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, text: newText.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to submit review");
        return;
      }

      toast.success("Review submitted!");
      setShowForm(false);
      setNewRating(0);
      setNewText("");
      setLoaded(false);
      fetchReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load reviews on first render
  if (!loaded && !isLoading) {
    fetchReviews();
  }

  if (comingSoon) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span className="text-sm">Reviews coming soon</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !loaded) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading reviews...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Reviews</CardTitle>
            <div className="flex items-center gap-1.5">
              <StarRating value={Math.round(averageRating)} readonly />
              <span className="text-sm text-muted-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
                {reviewCount > 0 && ` (${reviewCount})`}
              </span>
            </div>
          </div>
          {isOwned && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              Write a Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review form */}
        {showForm && (
          <div className="border border-border p-4 space-y-3">
            <div>
              <p className="text-sm font-medium mb-1.5">Your Rating</p>
              <StarRating
                value={newRating}
                onChange={setNewRating}
                size="md"
              />
            </div>
            <div>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Share your experience with this agent (optional)"
                rows={3}
                maxLength={500}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || newRating === 0}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                )}
                Submit Review
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setNewRating(0);
                  setNewText("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <StarRating value={review.rating} readonly />
                <span className="text-xs text-muted-foreground">
                  {review.user_name}
                </span>
              </div>
              {review.text && (
                <p className="text-sm text-muted-foreground">{review.text}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
