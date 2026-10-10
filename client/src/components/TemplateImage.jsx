import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/** Thumbnail with a neutral placeholder when the image is missing or fails to load. */
export function TemplateImage({ src, alt }) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-zinc-100 text-zinc-400" role="img" aria-label={alt}>
        <ImageOff className="size-6" aria-hidden="true" />
        <span className="text-xs font-medium">Preview unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
    />
  );
}
