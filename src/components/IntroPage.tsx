import { useMemo, useState } from 'react';
import { ALL_TAXON_FILTER, TAXA, type TaxonFilter } from '../constants/taxon';
import { IntroPageHeader } from './intro/IntroPageHeader';
import { IntroTaxonFilter } from './intro/IntroTaxonFilter';
import { IntroToolbar } from './intro/IntroToolbar';
import { SpeciesGrid } from './intro/SpeciesGrid';
import type { SpeciesSummary } from './intro/SpeciesCard';
import type { Observation, PageId, Taxon } from '../types';

interface IntroPageProps {
  observations: Observation[];
  onSelectSpecimen: (obs: Observation) => void;
  onNavigate: (page: PageId) => void;
}

export const IntroPage = ({ observations, onSelectSpecimen, onNavigate }: IntroPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTaxonFilter, setActiveTaxonFilter] = useState<TaxonFilter>(ALL_TAXON_FILTER);

  const groupedSpecies = useMemo(() => {
    const speciesMap = new Map<string, SpeciesSummary>();

    observations.forEach((obs) => {
      const cleanName = (obs.name || '').trim();
      if (!cleanName) return;
      const cleanScientific = (obs.scientificName || '').trim() || 'Scientific name unrecorded';
      const key = `${cleanName}__${cleanScientific}`;

      if (speciesMap.has(key)) {
        const existing = speciesMap.get(key)!;
        existing.count += 1;
        if (!existing.representativeObs.imageUrl && obs.imageUrl) {
          existing.representativeObs = obs;
        }
      } else {
        speciesMap.set(key, {
          name: cleanName,
          scientificName: cleanScientific,
          taxon: obs.taxon,
          count: 1,
          representativeObs: obs,
        });
      }
    });

    const groups = {} as Record<Taxon, SpeciesSummary[]>;

    TAXA.forEach((taxon) => {
      groups[taxon] = [];
    });

    Array.from(speciesMap.values()).forEach((species) => {
      groups[species.taxon].push(species);
    });

    return groups;
  }, [observations]);

  const totalSpeciesCount = useMemo(() => {
    const speciesSet = new Set(observations.map((obs) => (obs.name || '').trim()).filter(Boolean));
    return speciesSet.size;
  }, [observations]);

  const filteredGroupedSpecies = useMemo(() => {
    const groups = {} as Record<Taxon, SpeciesSummary[]>;
    const query = searchQuery.toLowerCase().trim();

    TAXA.forEach((taxon) => {
      const shouldShowTaxon = activeTaxonFilter === ALL_TAXON_FILTER || activeTaxonFilter === taxon;
      const list = shouldShowTaxon ? (groupedSpecies[taxon] || []) : [];

      groups[taxon] = list
        .filter((species) => {
          if (!query) return true;
          return species.name.toLowerCase().includes(query) || species.scientificName.toLowerCase().includes(query);
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    });

    return groups;
  }, [activeTaxonFilter, groupedSpecies, searchQuery]);

  const visibleTaxa = useMemo(() => {
    return TAXA.filter((taxon) => activeTaxonFilter === ALL_TAXON_FILTER || activeTaxonFilter === taxon);
  }, [activeTaxonFilter]);

  return (
    <div className="min-h-screen pt-32 px-6 md:px-10 pb-24 bg-white" id="intro-page">
      <div className="max-w-5xl mx-auto">
        <IntroPageHeader
          totalSpeciesCount={totalSpeciesCount}
          observationCount={observations.length}
          plantSpeciesCount={groupedSpecies['식물']?.length || 0}
        />

        <IntroToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNavigateMap={() => onNavigate('map')}
        />

        <IntroTaxonFilter
          groupedSpecies={groupedSpecies}
          activeTaxonFilter={activeTaxonFilter}
          onSelectTaxon={setActiveTaxonFilter}
        />

        <SpeciesGrid
          groupedSpecies={filteredGroupedSpecies}
          visibleTaxa={visibleTaxa}
          onSelectSpecimen={onSelectSpecimen}
        />
      </div>
    </div>
  );
};
