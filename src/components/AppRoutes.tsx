import { AnimatePresence, motion } from 'motion/react';
import { Hero } from './Hero';
import { IntroPage } from './IntroPage';
import { MapPage } from './MapPage';
import { ObservationListPage } from './ObservationListPage';
import { UploadMockPage } from './UploadMockPage';
import type { Observation, PageId } from '../types';

interface AppRoutesProps {
  currentPage: PageId;
  observations: Observation[];
  onNavigate: (page: PageId) => void;
  onSelectObservation: (obs: Observation) => void;
}

export const AppRoutes = ({ currentPage, observations, onNavigate, onSelectObservation }: AppRoutesProps) => {
  return (
    <AnimatePresence mode="wait">
      {currentPage === 'home' && (
        <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Hero />
        </motion.div>
      )}
      {currentPage === 'intro' && (
        <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <IntroPage observations={observations} onSelectSpecimen={onSelectObservation} onNavigate={onNavigate} />
        </motion.div>
      )}
      {currentPage === 'observations' && (
        <motion.div key="observations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ObservationListPage observations={observations} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'map' && (
        <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <MapPage observations={observations} onSelect={onSelectObservation} />
        </motion.div>
      )}
      {currentPage === 'upload' && (
        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <UploadMockPage onCancel={() => onNavigate('observations')} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
