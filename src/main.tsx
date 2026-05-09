import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AppShell from './AppShell';
import App from './App';
import ArpeggioPracticePage from './pages/ArpeggioPracticePage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/guitar-skills">
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<App />} />
          <Route path="arpeggios" element={<ArpeggioPracticePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
