import { useState } from 'react';
import { Coffee } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
  containerClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = 'h-full w-full object-cover',
  containerClassName = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 via-stone-100 to-zinc-200 p-6 text-center text-zinc-500 ${containerClassName}`}
      >
        <Coffee className="mb-2 h-7 w-7 text-zinc-400" strokeWidth={1.5} aria-hidden="true" />
        <span className="text-xs font-medium tracking-wide text-zinc-600">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
