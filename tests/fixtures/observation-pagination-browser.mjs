import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ObservationListPage } from '../../src/components/ObservationListPage.tsx';
import { ObservationDetail } from '../../src/components/ObservationDetail.tsx';
import { paginateMockObservations } from '../../src/utils/observationPagination.ts';
import { createPaginationObservations } from './observation-pagination.mjs';
import '../../src/index.css';

const rows = createPaginationObservations(47);
const params = new URLSearchParams(window.location.search);
const delay = params.get('delay') === '800' ? 800 : 0;
let failPageTwo = params.get('failPage') === '2';
const repository = {
  async listPublicObservationsPage(query, signal) {
    signal?.throwIfAborted();
    if (delay) await new Promise((resolve, reject) => {
      const onAbort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, delay);
      signal?.addEventListener('abort', onAbort, { once: true });
    });
    signal?.throwIfAborted();
    if (failPageTwo && query.page === 2) {
      failPageTwo = false;
      throw new Error('Synthetic one-time page failure');
    }
    return paginateMockObservations(rows, query);
  },
};

function Fixture() {
  const [selected, setSelected] = useState(null);
  return React.createElement(React.Fragment, null,
    React.createElement(ObservationListPage, { repository, onSelect: setSelected }),
    selected && React.createElement(ObservationDetail, { observation: selected, onClose: () => setSelected(null) }),
  );
}

createRoot(document.getElementById('root')).render(React.createElement(Fixture));
