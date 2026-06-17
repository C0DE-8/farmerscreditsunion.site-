import { useCallback, useState } from "react";
import styles from "./GlassToast.module.css";

export function useGlassToast() {
  const [toasts, setToasts] = useState([]);

  const notify = useCallback((message, type = "info", title) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        title:
          title ||
          (type === "success" ? "Success" : type === "error" ? "Action needed" : "Notice"),
        message,
      },
    ]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, notify, dismissToast };
}

export default function GlassToast({ toasts, onDismiss }) {
  return (
    <div className={styles.toastStack} aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          className={`${styles.toast} ${
            toast.type === "success"
              ? styles.toastSuccess
              : toast.type === "error"
                ? styles.toastError
                : styles.toastInfo
          }`}
          key={toast.id}
        >
          <div className={styles.toastIcon}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "!" : "i"}
          </div>
          <div>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
