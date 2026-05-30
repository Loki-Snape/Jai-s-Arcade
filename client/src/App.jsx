import { Navigate, Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';

const Lobby = lazy(() => import('./pages/Lobby'));
const Auth = lazy(() => import('./pages/Auth'));
const Game = lazy(() => import('./pages/Game'));
const Game01Felix = lazy(() => import('./games/game1-felix'));

export default function App() {
  return (
    <Suspense fallback={<div className="loading-shell">Loading Jai&apos;s Arcade...</div>}>
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/games/:slug" element={<Game />} />
        <Route path="/play/:gameId" element={<Game01Felix />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
