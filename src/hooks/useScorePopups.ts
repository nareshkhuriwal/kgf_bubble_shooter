import { useState, useCallback, useRef } from 'react';

export interface ScorePopupData {
  id: string;
  score: number;
  x: number;
  y: number;
}

export function useScorePopups() {
  const [popups, setPopups] = useState<ScorePopupData[]>([]);
  const counterRef = useRef(0);

  const addPopup = useCallback((score: number, x: number, y: number) => {
    if (score <= 0) return;
    const id = `popup-${Date.now()}-${counterRef.current++}`;
    setPopups(prev => [...prev, { id, score, x, y }]);
  }, []);

  const removePopup = useCallback((id: string) => {
    setPopups(prev => prev.filter(p => p.id !== id));
  }, []);

  return { popups, addPopup, removePopup };
}
