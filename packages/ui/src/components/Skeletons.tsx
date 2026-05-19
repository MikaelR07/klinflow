/**
 * Loading skeleton components for content placeholders
 */
export function SkeletonCard() {
  return (
    <div className="card space-y-3 animate-pulse">
      <div className="skeleton h-4 w-3/4" />
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4 animate-pulse">
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonKPI() {
  return (
    <div className="card space-y-2 animate-pulse">
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-8 w-3/4" />
      <div className="skeleton h-3 w-1/3" />
    </div>
  );
}

export default {
  SkeletonCard,
  SkeletonRow,
  SkeletonKPI
};
