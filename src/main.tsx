import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { consumeAuthRefreshReturn } from './features/auth/publicAuthRefresh';
import './index.css';

const authRefreshReturn = consumeAuthRefreshReturn();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App authRefreshReturn={authRefreshReturn} />
  </StrictMode>,
);
