import Button from "@/components/common/Button.jsx";

import styles from "./Toast.module.css";

/**
 * @param {{
 *   message: string,
 *   variant?: 'info' | 'success' | 'warning' | 'danger',
 *   onDismiss: () => void,
 * }} props
 */
export default function Toast({ message, variant = "info", onDismiss }) {
  const v = styles[variant] ?? styles.info;

  return (
    <div className={[styles.root, v].filter(Boolean).join(" ")} role="status" aria-live="polite">
      <p className={styles.msg}>{message}</p>
      <Button variant="ghost" size="sm" type="button" onClick={onDismiss}>
        Cerrar
      </Button>
    </div>
  );
}
