import React from 'react';
import { createRoot } from 'react-dom/client';
import { MapPage } from '../../src/components/MapPage.tsx';
import { StaticEcoMap } from '../../src/components/map/StaticEcoMap.tsx';
import { createMapMonthFixture } from './map-month-filter.mjs';
import '../../src/index.css';

// Explicit local dependencies: configured Supabase/Kakao providers are never mounted or called.
export const mountMapMonthFixture = (container, { onReady, onRenderError }) => {
  const fixture = createMapMonthFixture();
  function Fixture() {
    const [selected, setSelected] = React.useState(null);
    React.useEffect(onReady, []);
    return React.createElement(React.Fragment, null,
      React.createElement('p', { className: 'absolute top-2 left-4 right-4 text-xs', role: 'status' },
        selected ? `선택: ${selected.name}` : '로컬 합성 자료 / 공개 33건, 5월 27건, 4월과 5월 28건'),
      React.createElement(MapPage, {
        observations: fixture.observations,
        onSelect: setSelected,
        taxonomyRepository: fixture.repository,
        MapComponent: StaticEcoMap,
      }));
  }
  const root = createRoot(container, { onUncaughtError: onRenderError });
  root.render(React.createElement(Fixture));
  return root;
};
