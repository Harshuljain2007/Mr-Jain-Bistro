import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Star,
} from 'lucide-react';
import type { CustomerReview } from '../data/coffeeData';
import { createCustomerReview } from '../services/coffeeDb';

interface TestimonialsSectionProps {
  reviews: CustomerReview[];
  isLoading: boolean;
  isAdmin: boolean;
}

type LayoutMode = 'grid' | 'carousel';

export function TestimonialsSection({
  reviews,
  isLoading,
  isAdmin,
}: TestimonialsSectionProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('carousel');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showForm, setShowForm] = useState(false);

  // Review submission state
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [favoriteItem, setFavoriteItem] = useState('');
  const [rating, setRating] = useState(5);
  const [quote, setQuote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visiblePerSlide = 3;
  const maxStartIndex = Math.max(0, reviews.length - visiblePerSlide);

  useEffect(() => {
    if (carouselIndex > maxStartIndex) {
      setCarouselIndex(0);
    }
  }, [carouselIndex, maxStartIndex]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const displayedReviews = useMemo(() => {
    if (layoutMode === 'grid') return reviews;
    if (reviews.length <= visiblePerSlide) return reviews;
    return reviews.slice(carouselIndex, carouselIndex + visiblePerSlide);
  }, [layoutMode, reviews, carouselIndex]);

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev <= 0 ? maxStartIndex : prev - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1));
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!authorName.trim() || !authorRole.trim() || !favoriteItem.trim()) {
      setFormError('Please fill in your name, neighborhood or role, and favorite item.');
      return;
    }
    if (quote.trim().length < 10) {
      setFormError('Please write a brief review (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerReview({
        authorName,
        authorRole,
        rating,
        quote,
        favoriteItem,
        isApproved: isAdmin,
        sortOrder: reviews.length * 10 + 10,
      });

      setFormSuccess(
        isAdmin
          ? 'Review published directly to the live Firestore collection.'
          : 'Thank you — your review was saved to Firestore and will appear once approved by the shop owner.'
      );
      setAuthorName('');
      setAuthorRole('');
      setFavoriteItem('');
      setRating(5);
      setQuote('');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Unable to save review right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (score: number) => (
    <div className="flex items-center gap-0.5" aria-label={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-3.5 w-3.5 ${
            value <= score
              ? 'fill-[#1C4A38] text-[#1C4A38]'
              : 'fill-transparent text-zinc-300'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );

  return (
    <section id="reviews" className="border-b border-zinc-200/80 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header & Controls */}
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#1C4A38] uppercase">
              Guest Reviews
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl text-balance">
              Voices from our morning counter.
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-600">
              {renderStars(Math.round(Number(averageRating)))}
              <span className="font-semibold text-zinc-900 tabular-nums">
                {averageRating} / 5.0
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Layout Switch: Carousel / Grid */}
            <div
              role="group"
              aria-label="Review layout view"
              className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1"
            >
              <button
                type="button"
                aria-pressed={layoutMode === 'carousel'}
                onClick={() => setLayoutMode('carousel')}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  layoutMode === 'carousel'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Carousel
              </button>
              <button
                type="button"
                aria-pressed={layoutMode === 'grid'}
                onClick={() => setLayoutMode('grid')}
                className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  layoutMode === 'grid'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                All Reviews
              </button>
            </div>

            {layoutMode === 'carousel' && reviews.length > visiblePerSlide && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous reviews"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next reviews"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowForm((prev) => !prev);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-900 transition-colors hover:bg-zinc-50 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
            >
              {showForm ? 'Close Form' : 'Leave a Review'}
            </button>
          </div>
        </div>

        {/* Inline Review Submission Form */}
        {showForm && (
          <form
            onSubmit={handleSubmitReview}
            className="mt-8 rounded-xl border border-zinc-200 bg-[#FAFAFA] p-6"
          >
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-display text-xl font-medium text-zinc-900">
                  Share your visit
                </h3>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Reviews are stored in Firestore and published after quick owner moderation.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-zinc-700">Rating:</span>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`Rate ${value} out of 5 stars`}
                    className="p-1 cursor-pointer"
                  >
                    <Star
                      className={`h-4 w-4 transition-colors ${
                        value <= rating
                          ? 'fill-[#1C4A38] text-[#1C4A38]'
                          : 'fill-transparent text-zinc-300 hover:text-zinc-500'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="review-name"
                  className="block text-xs font-medium text-zinc-800"
                >
                  Your Name
                </label>
                <input
                  id="review-name"
                  type="text"
                  maxLength={80}
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Priya Verma"
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="review-role"
                  className="block text-xs font-medium text-zinc-800"
                >
                  Neighborhood or Role
                </label>
                <input
                  id="review-role"
                  type="text"
                  maxLength={80}
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  placeholder="Designer, Sitapura"
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="review-favorite"
                  className="block text-xs font-medium text-zinc-800"
                >
                  Favorite Drink or Pastry
                </label>
                <input
                  id="review-favorite"
                  type="text"
                  maxLength={80}
                  value={favoriteItem}
                  onChange={(e) => setFavoriteItem(e.target.value)}
                  placeholder="House Cortado"
                  className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor="review-quote"
                  className="block text-xs font-medium text-zinc-800"
                >
                  Your Review
                </label>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {quote.trim().length} / 400
                </span>
              </div>
              <textarea
                id="review-quote"
                rows={3}
                maxLength={400}
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Tell future guests what stood out during your visit..."
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
              />
            </div>

            {formError && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formError}</span>
              </p>
            )}
            {formSuccess && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#1C4A38]">
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{formSuccess}</span>
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#1C4A38] px-5 py-2 text-xs font-medium text-white transition-colors hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {/* Review Cards Grid / Carousel */}
        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-56 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50 p-6"
              />
            ))}
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="mt-10 rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm font-medium text-zinc-900">
              No published reviews yet.
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Be the first guest to share a note about your visit.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {displayedReviews.map((review) => (
              <article
                key={review.id}
                className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-[#FAFAFA] p-6"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    {renderStars(review.rating)}
                    <span className="text-xs font-medium text-zinc-500 tabular-nums">
                      {review.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-zinc-700">
                    &ldquo;{review.quote}&rdquo;
                  </p>
                </div>

                <div className="mt-6 border-t border-zinc-200/80 pt-4">
                  <p className="text-sm font-semibold text-zinc-900">
                    {review.authorName}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {review.authorRole}
                    <span aria-hidden="true"> · </span>
                    Favorite: {review.favoriteItem}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Carousel Slide Counter */}
        {layoutMode === 'carousel' && reviews.length > visiblePerSlide && (
          <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
            <span className="tabular-nums">
              Showing {carouselIndex + 1}–{Math.min(carouselIndex + visiblePerSlide, reviews.length)} of{' '}
              {reviews.length} reviews
            </span>
            <div className="flex items-center gap-2">
              {Array.from({ length: maxStartIndex + 1 }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCarouselIndex(idx)}
                  aria-label={`View review group ${idx + 1}`}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === carouselIndex
                      ? 'w-6 bg-[#1C4A38]'
                      : 'w-2 bg-zinc-300 hover:bg-zinc-400'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
