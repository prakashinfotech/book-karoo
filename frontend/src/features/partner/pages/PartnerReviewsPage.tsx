import { useState } from 'react';
import { Star, EyeOff, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { PartnerLayout } from '../components/PartnerLayout';
import { usePartnerReviews, useHidePartnerReview, useRestorePartnerReview, usePartnerVenues } from '../api/usePartner';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import type { PartnerReviewResponse } from '../types';

const STATUS_BADGE: Record<string, string> = {
  Published: 'bg-semantic-success/15 text-semantic-success',
  Hidden:    'bg-bg-surface3 text-text-muted',
  Reported:  'bg-amber-500/15 text-amber-400',
};

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={12}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-bg-surface3'}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, onHide, onRestore, isLoading }: {
  review: PartnerReviewResponse;
  onHide: (id: string) => void;
  onRestore: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-base p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-text-primary text-sm">{review.userName}</span>
            {review.isVerifiedBooking && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-semantic-success/15 text-semantic-success font-medium">Verified</span>
            )}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGE[review.status] ?? 'bg-bg-surface2 text-text-muted'}`}>
              {review.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarDisplay rating={review.rating} />
            <span className="text-[11px] text-text-muted">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {review.status !== 'Hidden' ? (
            <button
              onClick={() => onHide(review.id)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-default text-text-muted text-[11px] hover:text-semantic-error hover:border-semantic-error/50 transition-colors disabled:opacity-50"
              aria-label="Hide review"
            >
              <EyeOff size={12} /> Hide
            </button>
          ) : (
            <button
              onClick={() => onRestore(review.id)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border-default text-text-muted text-[11px] hover:text-semantic-success hover:border-semantic-success/50 transition-colors disabled:opacity-50"
              aria-label="Restore review"
            >
              <Eye size={12} /> Restore
            </button>
          )}
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">{review.movieTitle} · {review.venueName}</p>
        {review.title && <p className="text-sm font-semibold text-text-primary">{review.title}</p>}
        {review.body && <p className="text-sm text-text-secondary mt-1 line-clamp-3">{review.body}</p>}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-text-muted pt-1 border-t border-border-default/50">
        <span className="flex items-center gap-1"><ThumbsUp size={11} /> {review.thumbsUp}</span>
        <span className="flex items-center gap-1"><ThumbsDown size={11} /> {review.thumbsDown}</span>
      </div>
    </div>
  );
}

export default function PartnerReviewsPage() {
  const [venueId, setVenueId] = useState('');
  const [status,  setStatus]  = useState('');
  const [sort,    setSort]    = useState('newest');
  const [page,    setPage]    = useState(1);

  const { data: venues } = usePartnerVenues();
  const { data, isLoading, isError, refetch } = usePartnerReviews({
    venueId: venueId || undefined,
    status:  status  || undefined,
    sort,
    page,
    pageSize: 12,
  });
  const hideReview    = useHidePartnerReview();
  const restoreReview = useRestorePartnerReview();

  const reviews = data?.items ?? [];
  const isMutating = hideReview.isPending || restoreReview.isPending;

  return (
    <PartnerLayout>
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <header>
          <h1 className="text-2xl font-display font-bold text-text-primary">
            Reviews
            {data && <span className="ml-2 text-base font-normal text-text-muted">({data.total})</span>}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Manage customer reviews for your venues.</p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={venueId}
            onChange={(e) => { setVenueId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
          >
            <option value="">All Venues</option>
            {venues?.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
          >
            <option value="">All Statuses</option>
            <option value="Published">Published</option>
            <option value="Hidden">Hidden</option>
            <option value="Reported">Reported</option>
          </select>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo [color-scheme:light]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={180} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-semantic-error/30 bg-semantic-error/08 p-4 text-sm text-semantic-error flex items-center justify-between">
            <span>Failed to load reviews.</span>
            <button onClick={() => refetch()} className="underline hover:opacity-80">Retry</button>
          </div>
        )}

        {!isLoading && reviews.length === 0 && (
          <div className="rounded-lg border border-border-default bg-bg-base p-8 text-center">
            <Star size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-muted text-sm">No reviews found for the selected filters.</p>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.map((r: PartnerReviewResponse) => (
              <ReviewCard
                key={r.id}
                review={r}
                onHide={(id) => hideReview.mutate(id)}
                onRestore={(id) => restoreReview.mutate(id)}
                isLoading={isMutating}
              />
            ))}
          </div>
        )}

        {data && data.total > 12 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-text-muted">{data.total} reviews</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">← Prev</button>
              <span className="px-3 py-1 text-sm text-text-primary">Page {page}</span>
              <button disabled={reviews.length < 12} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded-lg border border-border-default text-sm text-text-secondary disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </PartnerLayout>
  );
}
