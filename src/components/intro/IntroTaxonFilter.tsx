import { ALL_TAXON_FILTER, getTaxonStyles, TAXA, type TaxonFilter } from '../../constants/taxon';
import type { Taxon } from '../../types';
import { TaxonFilterButton } from '../ui/TaxonFilterButton';
import type { SpeciesSummary } from './SpeciesCard';

interface IntroTaxonFilterProps {
  groupedSpecies: Record<Taxon, SpeciesSummary[]>;
  activeTaxonFilter: TaxonFilter;
  onSelectTaxon: (taxon: TaxonFilter) => void;
}

export const IntroTaxonFilter = ({
  groupedSpecies,
  activeTaxonFilter,
  onSelectTaxon,
}: IntroTaxonFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-12">
      <TaxonFilterButton
        label="전체"
        active={activeTaxonFilter === ALL_TAXON_FILTER}
        onClick={() => onSelectTaxon(ALL_TAXON_FILTER)}
        className="px-4 py-1.5 rounded-full text-[11px] border transition-all"
        activeClassName="bg-black text-white border-black"
        inactiveClassName="bg-white text-zinc-500 border-zinc-200 hover:border-black"
      />
      {TAXA.map((taxon) => {
        const styles = getTaxonStyles(taxon);
        return (
          <TaxonFilterButton
            key={taxon}
            label={taxon}
            active={activeTaxonFilter === taxon}
            onClick={() => onSelectTaxon(taxon)}
            count={groupedSpecies[taxon]?.length || 0}
            className="px-4 py-1.5 rounded-full text-[11px] border transition-all"
            activeClassName="bg-black text-white border-black"
            inactiveClassName={styles.bg}
          />
        );
      })}
    </div>
  );
};
