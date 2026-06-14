import { motion } from 'motion/react';
import { Leaf } from 'lucide-react';
import type { Observation, Taxon } from '../../types';
import { TaxonBadge } from '../TaxonBadge';

export interface SpeciesSummary {
  name: string;
  scientificName: string;
  taxon: Taxon;
  count: number;
  representativeObs: Observation;
}

interface SpeciesCardProps {
  species: SpeciesSummary;
  index: number;
  onSelectSpecimen: (observation: Observation) => void;
}

export const SpeciesCard = ({ species, index, onSelectSpecimen }: SpeciesCardProps) => {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: index * 0.03 }}
      onClick={() => onSelectSpecimen(species.representativeObs)}
      className="group text-left border border-zinc-100 bg-white hover:border-black transition-all p-4 min-h-[132px] flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start gap-3 mb-3">
          <TaxonBadge taxon={species.taxon} />
          <Leaf size={14} className="text-zinc-200 group-hover:text-zinc-900 transition-colors" />
        </div>
        <h3 className="font-serif text-lg text-zinc-900 mb-1 group-hover:underline underline-offset-4 decoration-zinc-300">{species.name}</h3>
        <p className="text-[11px] italic text-zinc-400 leading-relaxed">{species.scientificName}</p>
      </div>
      <p className="mt-5 text-[10px] tracking-widest uppercase text-zinc-400">{species.count} observation records</p>
    </motion.button>
  );
};
