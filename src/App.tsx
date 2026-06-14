import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { AppRoutes } from './components/AppRoutes';
import { ObservationDetail } from './components/ObservationDetail';
import { activeObservationRepository } from './repositories/observationRepositoryProvider';
import type { Observation, PageId } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [observations, setObservations] = useState<Observation[]>([]);
  const [uniqueSpeciesCount, setUniqueSpeciesCount] = useState(0);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isLoadingObservations, setIsLoadingObservations] = useState(true);
  const [observationLoadError, setObservationLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadObservations = async () => {
      try {
        setIsLoadingObservations(true);
        setObservationLoadError(null);
        const [nextObservations, nextUniqueSpeciesCount] = await Promise.all([
          activeObservationRepository.listObservations(),
          activeObservationRepository.countUniqueSpecies(),
        ]);

        if (!isCurrent) return;
        setObservations(nextObservations);
        setUniqueSpeciesCount(nextUniqueSpeciesCount);
      } catch {
        if (!isCurrent) return;
        setObservationLoadError('관찰 데이터를 불러오지 못했습니다.');
      } finally {
        if (isCurrent) {
          setIsLoadingObservations(false);
        }
      }
    };

    void loadObservations();

    return () => {
      isCurrent = false;
    };
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
        {isLoadingObservations && <p className="sr-only">관찰 데이터를 불러오는 중입니다.</p>}
        {observationLoadError && (
          <div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 border border-zinc-200 bg-white px-4 py-2 text-xs text-zinc-600 shadow-sm">
            {observationLoadError}
          </div>
        )}
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
