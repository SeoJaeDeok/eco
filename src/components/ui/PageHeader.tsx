import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  metaClassName?: string;
  actionsClassName?: string;
}

const renderSlot = (content: ReactNode, className?: string) => {
  if (content === null || content === undefined || content === false) return null;
  return className ? <div className={className}>{content}</div> : content;
};

export const PageHeader = ({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
  className,
  contentClassName,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  metaClassName,
  actionsClassName,
}: PageHeaderProps) => {
  const content = (
    <>
      {renderSlot(eyebrow, eyebrowClassName)}
      {renderSlot(title, titleClassName)}
      {renderSlot(description, descriptionClassName)}
      {renderSlot(meta, metaClassName)}
      {children}
    </>
  );

  return (
    <header className={className}>
      {contentClassName ? <div className={contentClassName}>{content}</div> : content}
      {renderSlot(actions, actionsClassName)}
    </header>
  );
};
