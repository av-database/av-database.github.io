type SkeletonVariant = "video" | "actress" | "genre";

const GRID_CLASS: Record<SkeletonVariant, string> = {
  video: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6",
  actress: "grid grid-cols-3 lg:grid-cols-6 gap-4",
  genre: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3",
};

const DEFAULT_COUNT: Record<SkeletonVariant, number> = {
  video: 12,
  actress: 12,
  genre: 24,
};

function VideoSkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
      <div className="w-full aspect-[16/10] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
      </div>
      <div className="px-3 pb-3">
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function ActressSkeletonCard() {
  return (
    <div className="border rounded-lg overflow-hidden animate-pulse">
      <div className="w-full aspect-square bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-28 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

function GenreSkeletonCard() {
  return (
    <div className="border rounded-lg p-4 flex items-center justify-center animate-pulse">
      <div className="h-4 w-16 bg-gray-200 rounded" />
    </div>
  );
}

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <span className={`block bg-gray-200 rounded animate-pulse ${className}`} />;
}

interface SkeletonGridProps {
  variant?: SkeletonVariant;
  count?: number;
}

export function SkeletonItems({ variant = "video", count }: SkeletonGridProps) {
  const total = count ?? DEFAULT_COUNT[variant];
  const Card = variant === "actress" ? ActressSkeletonCard : variant === "genre" ? GenreSkeletonCard : VideoSkeletonCard;

  return (
    <>
      {Array.from({ length: total }).map((_, i) => (
        <Card key={i} />
      ))}
    </>
  );
}

export default function SkeletonGrid({ variant = "video", count }: SkeletonGridProps) {
  return (
    <div className={GRID_CLASS[variant]} aria-hidden="true">
      <SkeletonItems variant={variant} count={count} />
    </div>
  );
}
