import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ObservationListPage } from '../../src/components/ObservationListPage.tsx';
import { ObservationDetail } from '../../src/components/ObservationDetail.tsx';
import { paginateMockObservations } from '../../src/utils/observationPagination.ts';
import { createPaginationObservations } from './observation-pagination.mjs';
import '../../src/index.css';

const rows = createPaginationObservations(47);
const repository = {
  async listPublicObservationsPage(query, signal) {
    signal?.throwIfAborted();
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
