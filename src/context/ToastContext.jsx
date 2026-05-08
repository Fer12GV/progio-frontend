import { useCallback, useMemo, useRef, useState } from "react";

import Toast from "@/components/common/Toast.jsx";
import { ToastContext } from "@/context/toastContext.js";

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const pushToast = useCallback(
    (message, variant = "info") => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      setToast({ message, variant });
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, 4200);
    },
    [],
  );

  const value = useMemo(
    () => ({ pushToast, dismissToast }),
    [pushToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      ) : null}
    </ToastContext.Provider>
  );
}
