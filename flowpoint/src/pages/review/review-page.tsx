import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppointment } from "@/hooks/repository-hooks/appointment/use-appointment";
import { useGetOrganizationById } from "@/hooks/repository-hooks/organization/use-organization";
import {
  useCreateReview,
  useReviewsByAppointment,
} from "@/hooks/repository-hooks/review/use-review";
import { CheckCircle2, Star, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const organizationId = searchParams.get("organizationId");

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Fetch data using hooks
  const { data: organization, isLoading: isLoadingOrg } =
    useGetOrganizationById(organizationId || "");

  const {
    data: appointment,
    isLoading: isLoadingAppointment,
    error: appointmentError,
  } = useAppointment(appointmentId || "", organizationId || undefined);

  const { data: existingReviews, isLoading: isLoadingReviews } =
    useReviewsByAppointment(appointmentId || "", organizationId || undefined);

  const createReview = useCreateReview();

  // Check if a review already exists
  const existingReview =
    existingReviews && existingReviews.length > 0 ? existingReviews[0] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating) {
      setError("Please select a rating");
      return;
    }

    if (!appointmentId || !organizationId || !appointment) {
      setError("Missing required information");
      return;
    }

    if (existingReview) {
      setError("A review has already been submitted for this appointment.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createReview.mutateAsync({
        organizationId,
        data: {
          appointmentId,
          organizationId,
          customerId: appointment.customerId,
          rating,
          comment: comment.trim() || undefined,
        },
      });

      setSubmitted(true);

      // If rating is 5/5, redirect to Google reviews
      if (rating === 5 && organization?.settings?.googlePlacesId) {
        setTimeout(() => {
          window.location.href = `https://search.google.com/local/writereview?placeid=${organization.settings.googlePlacesId}`;
        }, 2000);
      }
    } catch (err) {
      setError("Failed to submit review. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAppointment || isLoadingOrg || isLoadingReviews) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Skeleton key={star} className="h-10 w-10 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointmentError || (!appointment && appointmentId && organizationId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold font-sans">
              Error
            </CardTitle>
            <CardDescription className="mt-2">
              {appointmentError
                ? "Failed to load appointment"
                : "Appointment not found"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!appointmentId || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold font-sans">
              Error
            </CardTitle>
            <CardDescription className="mt-2">
              Missing appointment or organization ID
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-sans">
              Thank You!
            </CardTitle>
            <CardDescription className="text-base">
              Your review has been submitted successfully.
              {rating === 5 && organization?.settings?.googlePlacesId && (
                <span className="block mt-3 text-sm text-muted-foreground">
                  Redirecting you to Google Reviews...
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show existing review if one exists
  if (existingReview) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-accent p-4">
                <CheckCircle2 className="h-12 w-12 text-accent-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-sans">
              Review Already Submitted
            </CardTitle>
            <CardDescription className="text-base">
              You have already submitted a review for this appointment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 transition-colors ${
                    star <= existingReview.rating
                      ? "fill-primary text-primary"
                      : "fill-muted text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            {existingReview.comment && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Your comment:</p>
                <div className="bg-muted border border-border rounded-lg p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {existingReview.comment}
                  </p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center pt-2">
              Thank you for your feedback!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold font-sans">
            Share Your Experience
          </CardTitle>
          <CardDescription className="text-base">
            {organization?.name && (
              <span>
                How was your experience with{" "}
                <span className="font-medium text-foreground">
                  {organization.name}
                </span>
                ?
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block text-center">
                Rate your experience
              </label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full transition-all hover:scale-110 active:scale-95"
                    aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-12 w-12 transition-all ${
                        star <= (hoveredRating || rating)
                          ? "fill-primary text-primary scale-110"
                          : "fill-muted text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {rating === 5
                    ? "Excellent!"
                    : rating === 4
                      ? "Great!"
                      : rating === 3
                        ? "Good"
                        : rating === 2
                          ? "Fair"
                          : "Poor"}
                </p>
              )}
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-foreground"
              >
                Tell us more <span className="text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the service..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  {comment.length}/1000 characters
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !rating}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Submitting...</span>
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
