import type { Taxon } from '../types';

export const TAXA = ['식물', '포유류', '조류', '곤충', '양서/파충류', '균류', '기타'] as const satisfies readonly Taxon[];

export const ALL_TAXON_FILTER = '전체';

export type TaxonFilter = typeof ALL_TAXON_FILTER | Taxon;

export const TAXON_FILTERS = [ALL_TAXON_FILTER, ...TAXA] as const satisfies readonly TaxonFilter[];

interface TaxonStyle {
  bg: string;
  dot: string;
  color: string;
}

const TAXON_STYLES: Record<Taxon, TaxonStyle> = {
  식물: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', dot: 'bg-emerald-500', color: '#10b981' },
  포유류: { bg: 'bg-amber-50 text-amber-800 border-amber-100', dot: 'bg-amber-700', color: '#b45309' },
  조류: { bg: 'bg-blue-50 text-blue-800 border-blue-100', dot: 'bg-blue-600', color: '#2563eb' },
  곤충: { bg: 'bg-purple-50 text-purple-800 border-purple-100', dot: 'bg-purple-500', color: '#a855f7' },
  '양서/파충류': { bg: 'bg-teal-50 text-teal-800 border-teal-100', dot: 'bg-teal-500', color: '#14b8a6' },
  균류: { bg: 'bg-orange-50 text-orange-800 border-orange-100', dot: 'bg-orange-500', color: '#f97316' },
  기타: { bg: 'bg-zinc-100 text-zinc-800 border-zinc-200', dot: 'bg-zinc-500', color: '#6b7280' },
};

const TAXON_ALIASES: Record<string, Taxon> = {
  plant: '식물',
  plants: '식물',
  mammal: '포유류',
  mammals: '포유류',
  bird: '조류',
  birds: '조류',
  새: '조류',
  insect: '곤충',
  insects: '곤충',
  amphibian: '양서/파충류',
  reptile: '양서/파충류',
  fungi: '균류',
  fungus: '균류',
};

export const isTaxon = (value: string): value is Taxon => {
  return (TAXA as readonly string[]).includes(value);
};

export const normalizeTaxon = (taxon: Taxon | string): Taxon => {
  const value = taxon.trim();
  if (isTaxon(value)) return value;
  return TAXON_ALIASES[value.toLowerCase()] ?? '기타';
};

export const getTaxonStyles = (taxon: Taxon | string): TaxonStyle => {
  return TAXON_STYLES[normalizeTaxon(taxon)];
};

export const getTaxonColor = (taxon: Taxon | string) => {
  return getTaxonStyles(taxon).color;
};
