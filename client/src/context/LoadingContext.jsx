import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useLocation } from "react-router-dom";
import { subscribeToApiLoading, getApiLoadingState } from "../services/api";
import TopLoadingBar from "../components/common/TopLoadingBar";

const LoadingContext = createContext({
  isLoading: false,
  apiLoading: false,
  navLoading: false,
  activeRequests: 0,
  startLoading: () => {},
  stopLoading: () => {},
});

export function LoadingProvider({ children }) {
  const location = useLocation();
  const [apiLoading, setApiLoading] = useState(() => getApiLoadingState().isLoading);
  const [activeRequests, setActiveRequests] = useState(() => getApiLoadingState().activeCount);
  const [navLoading, setNavLoading] = useState(false);
  const [manualCount, setManualCount] = useState(0);

  const isInitialMount = useRef(true);
  const navTimerRef = useRef(null);

  // Subscribe to API request tracker
  useEffect(() => {
    const unsubscribe = subscribeToApiLoading((loading, count) => {
      setApiLoading(loading);
      setActiveRequests(count);
    });

    const handleCustomEvent = (e) => {
      if (e.detail) {
        setApiLoading(Boolean(e.detail.isLoading));
        setActiveRequests(Number(e.detail.activeCount) || 0);
      }
    };

    window.addEventListener("api:loading", handleCustomEvent);

    return () => {
      unsubscribe();
      window.removeEventListener("api:loading", handleCustomEvent);
    };
  }, []);

  // Track navigation route changes to trigger navigation loading animation
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setNavLoading(true);

    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
    }

    navTimerRef.current = setTimeout(() => {
      setNavLoading(false);
    }, 400);

    return () => {
      if (navTimerRef.current) {
        clearTimeout(navTimerRef.current);
      }
    };
  }, [location.pathname, location.search]);

  const startLoading = useCallback(() => {
    setManualCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setManualCount((prev) => Math.max(0, prev - 1));
  }, []);

  const isLoading = apiLoading || navLoading || manualCount > 0;

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        apiLoading,
        navLoading,
        activeRequests,
        startLoading,
        stopLoading,
      }}
    >
      <TopLoadingBar isLoading={isLoading} />
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    return {
      isLoading: false,
      apiLoading: false,
      navLoading: false,
      activeRequests: 0,
      startLoading: () => {},
      stopLoading: () => {},
    };
  }
  return context;
}

export default LoadingContext;
