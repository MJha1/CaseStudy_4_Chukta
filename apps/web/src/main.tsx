import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import { AppLayout } from '@/components/AppLayout';
import { ToastProvider } from '@/components/Toast';
import { HomePage } from '@/pages/HomePage';
import { ChallansPage } from '@/pages/ChallansPage';
import { DisputesPage } from '@/pages/DisputesPage';
import { ProPage } from '@/pages/ProPage';
import { DrafterPage } from '@/pages/DrafterPage';
import { AddVehiclePage } from '@/pages/AddVehiclePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/challans" element={<ChallansPage />} />
            <Route path="/disputes" element={<DisputesPage />} />
            <Route path="/pro" element={<ProPage />} />
            <Route path="/dispute/new" element={<DrafterPage />} />
            <Route path="/vehicles/new" element={<AddVehiclePage />} />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
