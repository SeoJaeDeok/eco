import type { Observation } from '../../../types';
import { ImageFrame } from '../../ui/ImageFrame';

interface ObservationDetailImageProps {
  observation: Observation;
  onImageLoadError?: (observation: Observation) => void;
}

export const ObservationDetailImage = ({ observation, onImageLoadError }: ObservationDetailImageProps) => {
  return (
    <ImageFrame
      src={observation.imageUrl}
      alt={observation.name}
      className="aspect-square bg-zinc-50 border border-zinc-100 overflow-hidden flex items-center justify-center"
      imageClassName="max-w-full max-h-full object-contain"
      placeholder={<div className="text-zinc-300 font-serif text-xs italic">No Photo</div>}
      onError={() => onImageLoadError?.(observation)}
    />
  );
};
