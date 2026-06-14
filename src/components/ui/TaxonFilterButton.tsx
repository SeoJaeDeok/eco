interface TaxonFilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  countClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}

const joinClassNames = (...classNames: Array<string | undefined>) => {
  return classNames.filter(Boolean).join(' ');
};

export const TaxonFilterButton = ({
  label,
  active,
  onClick,
  count,
  className,
  activeClassName,
  inactiveClassName,
  countClassName,
  ariaLabel,
  disabled = false,
  title,
}: TaxonFilterButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={joinClassNames(className, active ? activeClassName : inactiveClassName)}
    >
      {label}
      {count !== undefined && (
        <>
          {' '}
          <span className={countClassName}>{count}</span>
        </>
      )}
    </button>
  );
};
