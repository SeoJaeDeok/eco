import { getTaxonStyles } from '../../constants/taxon';
import type { Taxon, Observation } from '../../types';
import { SpeciesCard, type SpeciesSummary } from './SpeciesCard';

interface SpeciesGridProps {
  groupedSpecies: Record<Taxon, SpeciesSummary[]>;
  visibleTaxa: readonly Taxon[];
  onSelectSpecimen: (observation: Observation) => void;
}

export const SpeciesGrid = ({
  groupedSpecies,
  visibleTaxa,
  onSelectSpecimen,
}: SpeciesGridProps) => {
  return (
    <div className="space-y-16">
      {visibleTaxa.map((taxon) => {
        const list = groupedSpecies[taxon] || [];

        if (!list.length) return null;
        const styles = getTaxonStyles(taxon);

        return (
          <section key={taxon}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
              <h2 className="font-serif text-2xl text-zinc-900">{taxon}</h2>
              <span className="text-[10px] text-zinc-400 tracking-wider uppercase">{list.length} species</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((species, index) => (
                <SpeciesCard
                  key={`${species.name}-${species.scientificName}`}
                  species={species}
                  index={index}
                  onSelectSpecimen={onSelectSpecimen}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
