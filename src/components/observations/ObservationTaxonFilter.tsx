import { TAXON_FILTERS, type TaxonFilter } from '../../constants/taxon';
import { countObservationsByTaxon } from '../../utils/observationFilters';
import type { Observation } from '../../types';
import { TaxonFilterButton } from '../ui/TaxonFilterButton';

interface ObservationTaxonFilterProps {
  observations: Observation[];
  selectedTaxon: TaxonFilter;
  onSelectTaxon: (taxon: TaxonFilter) => void;
}

export const ObservationTaxonFilter = ({
  observations,
  selectedTaxon,
  onSelectTaxon,
}: ObservationTaxonFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-10 mt-6">
      {TAXON_FILTERS.map((taxon) => {
        const count = countObservationsByTaxon(observations, taxon);
        const isSelected = selectedTaxon === taxon;
        return (
          <TaxonFilterButton
            key={taxon}
            label={taxon}
            active={isSelected}
            onClick={() => onSelectTaxon(taxon)}
            count={count}
            className="px-4 py-1.5 rounded-full text-[11px] font-sans tracking-wide transition-all border"
            activeClassName="bg-black text-white border-black shadow-sm font-semibold"
            inactiveClassName="bg-zinc-50 text-zinc-600 border-zinc-100 hover:bg-zinc-100 hover:border-zinc-300"
            countClassName={`text-[10px] ml-1 font-medium ${isSelected ? 'text-zinc-300' : 'text-zinc-400'}`}
          />
        );
      })}
    </div>
  );
};
