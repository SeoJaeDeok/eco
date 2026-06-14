import type { CSSProperties } from 'react';
import { getTaxonColor, getTaxonStyles, normalizeTaxon } from '../constants/taxon';
import type { Taxon } from '../types';

type TaxonBadgeVariant = 'pill' | 'legend' | 'marker' | 'text';

interface TaxonBadgeProps {
  taxon: Taxon | string;
  variant?: TaxonBadgeVariant;
  className?: string;
  style?: CSSProperties;
}

const joinClassNames = (...classNames: Array<string | undefined>) => {
  return classNames.filter(Boolean).join(' ');
};

export const TaxonBadge = ({ taxon, variant = 'pill', className, style }: TaxonBadgeProps) => {
  const label = normalizeTaxon(taxon);
  const styles = getTaxonStyles(label);
  const color = getTaxonColor(label);

  if (variant === 'text') {
    return (
      <span className={className} style={style}>
        {label}
      </span>
    );
  }

  if (variant === 'marker') {
    return (
      <span
        className={className}
        style={{ ...style, backgroundColor: color }}
      />
    );
  }

  if (variant === 'legend') {
    return (
      <span className={joinClassNames('flex items-center gap-2', className)} style={style}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-[9px] font-light opacity-70 leading-none">{label}</span>
      </span>
    );
  }

  return (
    <span className={joinClassNames('inline-flex items-center gap-1.5 text-[9px] px-2 py-1 rounded-full border', styles.bg, className)} style={style}>
      <span className={joinClassNames('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {label}
    </span>
  );
};
