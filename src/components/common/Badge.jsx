import styles from "./Badge.module.css";

/**
 * @param {{
 *   variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral',
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export default function Badge({ variant = "default", children, className = "" }) {
  const v = styles[variant] ?? styles.default;

  return <span className={[styles.root, v, className].filter(Boolean).join(" ")}>{children}</span>;
}
