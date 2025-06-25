import React from 'react';
import ReactDOM from 'react-dom/client';
import PhaserGameEngine from './PhaserGameEngine';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <PhaserGameEngine title="Harry Potter Game" />
  </React.StrictMode>
); 