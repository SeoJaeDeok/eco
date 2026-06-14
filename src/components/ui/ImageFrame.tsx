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
}: ImageFrameProps) => {
  return (
    <div className={className}>
      {src ? <img src={src} alt={alt} className={imageClassName} loading={loading} /> : placeholder}
      {overlay}
      {children}
    </div>
  );
};
