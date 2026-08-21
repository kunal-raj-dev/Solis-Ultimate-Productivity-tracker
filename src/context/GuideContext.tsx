import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuideSessionState, GuideSessionMap } from '../types/guide';
import { GuideCenterModal } from '../features/guides/GuideCenterModal';

interface GuideContextValue {
  isGuideOpen: boolean;
  openGuide: (guideId?: string) => void;
  closeGuide: () => void;
  
  activeGuideId?: string;
  
  activeStepIndex: number;
  setActiveStepIndex: (index: number) => void;
  
  completedSteps: Record<string, number[]>;
  markStepComplete: (guideId: string, stepNumber: number) => void;
  isStepComplete: (guideId: string, stepNumber: number) => boolean;
  
  navigateToGuide: (guideId?: string) => void;
  
  isDeepMode: boolean;
  toggleDeepMode: () => void;
  
  guideSessionMap: GuideSessionMap;
  saveGuideSession: (guideId: string) => void;
  getGuideSession: (guideId: string) => GuideSessionState | undefined;
  
  returnGuideId?: string;
  setReturnGuideId: (guideId: string | undefined) => void;
}

const GuideContext = createContext<GuideContextValue | undefined>(undefined);

const SESSION_KEY = 'solis-guide-session';

export const GuideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [activeGuideId, setActiveGuideId] = useState<string | undefined>(undefined);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>({});
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [guideSessionMap, setGuideSessionMap] = useState<GuideSessionMap>({});
  const [returnGuideId, setReturnGuideId] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps);
        if (parsed.guideSessionMap) setGuideSessionMap(parsed.guideSessionMap);
      }
    } catch (e) {
      console.error('Failed to load guide session', e);
    }
  }, []);

  // Save to sessionStorage when critical state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        completedSteps,
        guideSessionMap
      }));
    } catch (e) {
      console.error('Failed to save guide session', e);
    }
  }, [completedSteps, guideSessionMap]);

  const openGuide = useCallback((guideId?: string) => {
    setActiveGuideId(guideId);
    setIsGuideOpen(true);
  }, []);

  const closeGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  const markStepComplete = useCallback((guideId: string, stepNumber: number) => {
    setCompletedSteps(prev => {
      const current = prev[guideId] || [];
      if (current.includes(stepNumber)) return prev;
      return { ...prev, [guideId]: [...current, stepNumber] };
    });
  }, []);

  const isStepComplete = useCallback((guideId: string, stepNumber: number) => {
    const current = completedSteps[guideId] || [];
    return current.includes(stepNumber);
  }, [completedSteps]);

  const navigateToGuide = useCallback((guideId?: string) => {
    setIsGuideOpen(false);
    if (guideId) {
      navigate(`/app/guides/${guideId}`);
    } else {
      navigate('/app/guides');
    }
  }, [navigate]);

  const toggleDeepMode = useCallback(() => {
    setIsDeepMode(prev => !prev);
  }, []);

  const saveGuideSession = useCallback((guideId: string) => {
    setGuideSessionMap(prev => ({
      ...prev,
      [guideId]: {
        guideId,
        currentStep: activeStepIndex,
        completedSteps: completedSteps[guideId] || [],
        isDeepMode
      }
    }));
  }, [activeStepIndex, completedSteps, isDeepMode]);

  const getGuideSession = useCallback((guideId: string) => {
    return guideSessionMap[guideId];
  }, [guideSessionMap]);

  return (
    <GuideContext.Provider value={{
      isGuideOpen,
      openGuide,
      closeGuide,
      activeGuideId,
      activeStepIndex,
      setActiveStepIndex,
      completedSteps,
      markStepComplete,
      isStepComplete,
      navigateToGuide,
      isDeepMode,
      toggleDeepMode,
      guideSessionMap,
      saveGuideSession,
      getGuideSession,
      returnGuideId,
      setReturnGuideId
    }}>
      {children}
      <GuideCenterModal
        isOpen={isGuideOpen}
        onClose={closeGuide}
        initialGuideId={activeGuideId}
      />
    </GuideContext.Provider>
  );
};

export function useGuide(): GuideContextValue {
  const context = useContext(GuideContext);
  if (!context) {
    throw new Error('useGuide must be used within a GuideProvider');
  }
  return context;
}
