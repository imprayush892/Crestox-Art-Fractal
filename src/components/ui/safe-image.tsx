'use client';

import Image, { type ImageProps } from 'next/image';
import { useState, useEffect } from 'react';

const placeholderUrl = 'https://placehold.co/400x400.png';

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

export function SafeImage({ src, fallbackSrc = placeholderUrl, ...props }: SafeImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset state when the src prop changes
    setCurrentSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    // Prevent an infinite loop if the fallback image also fails
    if (!hasError) {
      setCurrentSrc(fallbackSrc);
      setHasError(true);
    }
  };

  // If the src is a static import, it's an object. It shouldn't fail to load.
  // We only apply the error handling for string URLs.
  const isStringSrc = typeof src === 'string';

  return (
    <Image
      {...props}
      src={currentSrc}
      onError={isStringSrc ? handleError : undefined}
    />
  );
}
