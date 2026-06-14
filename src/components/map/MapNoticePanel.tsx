import type { ReactNode } from 'react';

interface MapNoticePanelProps {
  title?: string;
  description: string;
  icon?: ReactNode;
  className: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const MapNoticePanel = ({
  title,
  description,
  icon,
  className,
  titleClassName = 'text-[10px] tracking-[0.24em] uppercase text-zinc-500 mb-1',
  descriptionClassName = 'text-[10px] leading-relaxed text-zinc-400',
}: MapNoticePanelProps) => {
  return (
    <div className={className}>
      {icon ? (
        <div className="flex items-center gap-2 mb-1">
          {icon}
          {title && <span className={titleClassName}>{title}</span>}
        </div>
      ) : (
        title && <p className={titleClassName}>{title}</p>
      )}
      <p className={descriptionClassName}>{description}</p>
    </div>
  );
};
