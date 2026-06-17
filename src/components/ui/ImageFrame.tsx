import type { ImgHTMLAttributes, ReactNode } from 'react';

interface ImageFrameProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  placeholder?: ReactNode;
  overlay?: ReactNode;
  children?: ReactNode;
  loading?: ImgHTMLAttributes<HTMLImageElement>['loading'];
  onError?: ImgHTMLAttributes<HTMLImageElement>['onError'];
}

export const ImageFrame = ({
  src,
  alt,
  className,
  imageClassName,
  placeholder,
  overlay,
  children,
  loading,
  onError,
}: ImageFrameProps) => {
  return (
    <div className={className}>
      {src ? <img src={src} alt={alt} className={imageClassName} loading={loading} onError={onError} /> : placeholder}
      {overlay}
      {children}
    </div>
  );
};
