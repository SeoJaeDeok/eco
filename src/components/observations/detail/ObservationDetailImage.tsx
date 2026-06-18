import { useEffect, useState } from 'react';
import type { Observation } from '../../../types';
import { ImageFrame } from '../../ui/ImageFrame';

interface ObservationDetailImageProps {
  observation: Observation;
  onImageLoadError?: (observation: Observation) => void;
}

export const ObservationDetailImage = ({ observation, onImageLoadError }: ObservationDetailImageProps) => {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = observation.imageUrl.trim();
  const displayImageUrl = imageUrl && failedImageUrl !== imageUrl ? imageUrl : '';

  useEffect(() => {
    setFailedImageUrl(null);
  }, [observation.id, observation.imagePath, observation.imageUrl]);

  const handleImageError = () => {
    setFailedImageUrl(imageUrl || null);
    onImageLoadError?.(observation);
  };

  return (
    <ImageFrame
      src={displayImageUrl}
      alt={observation.name}
      className="aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center"
      imageClassName="max-w-full max-h-full object-contain"
      placeholder={<div className="text-zinc-300 font-serif text-xs italic">No Photo</div>}
      onError={handleImageError}
    />
  );
};
