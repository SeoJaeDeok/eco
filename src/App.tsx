import { useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './components/AppRoutes';
import { ObservationDetail } from './components/ObservationDetail';
import { mockObservationRepository } from './repositories/mockObservationRepository';
import type { Observation, PageId } from './types';

export default function App() {
  const observations = useMemo(() => mockObservationRepository.listObservations(), []);
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);

  const uniqueSpeciesCount = useMemo(() => {
    return mockObservationRepository.countUniqueSpecies();
  }, []);

  const navigate = (page: PageId) => {
    setCurrentPage(page);
    setSelectedObservation(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-white" id="app-root">
      {currentPage === 'home' && (
        <div
          className="fixed inset-0 z-0 opacity-20 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000")' }}
        />
      )}

      <Navbar onNavigate={navigate} observationCount={observations.length} uniqueSpeciesCount={uniqueSpeciesCount} />

      <main className="relative z-10">
        <AppRoutes
          currentPage={currentPage}
          observations={observations}
          onNavigate={navigate}
          onSelectObservation={setSelectedObservation}
        />
      </main>

      <AnimatePresence>
        {selectedObservation && <ObservationDetail observation={selectedObservation} onClose={() => setSelectedObservation(null)} />}
      </AnimatePresence>
    </div>
  );
}
