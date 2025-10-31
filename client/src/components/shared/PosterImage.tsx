import { type CSSProperties } from 'react';

interface PosterImageProps {
  src: string | null;
  alt: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: CSSProperties;
}

/**
 * Reusable component for displaying movie posters with fallback
 * Handles "N/A" or null poster values by showing a placeholder
 */
export const PosterImage = ({
  src,
  alt,
  width = '100%',
  height = '100%',
  borderRadius = '4px',
  style = {},
}: PosterImageProps) => {
  const hasValidPoster = src && src !== 'N/A';

  if (hasValidPoster) {
    return (
      <img
        src={src}
        alt={alt}
        style={{
          width,
          height,
          objectFit: 'cover',
          borderRadius,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontSize: '0.8rem',
        ...style,
      }}
    >
      No Poster
    </div>
  );
};
