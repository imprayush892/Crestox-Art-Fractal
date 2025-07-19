'use client';

import Image, { type ImageProps } from 'next/image';
import React from 'react';

// This component has been simplified to remove the fallback logic.
// It now directly wraps the Next.js Image component. If an image
// fails to load, the browser's default broken image indicator will be shown.
export function SafeImage(props: ImageProps) {
  return <Image {...props} />;
}
