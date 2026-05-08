import styles from "./Spinner.module.css";

/**
 * @param {{ size?: 'sm' | 'md' | 'lg', className?: string, label?: string }} props
 */
export default function Spinner({ size = "md", className = "", label = "Cargando" }) {
  const sizeClass = styles[size] ?? styles.md;

  return (
    <span className={[styles.wrap, className].filter(Boolean).join(" ")} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <span className={[styles.ring, sizeClass].join(" ")} aria-hidden />
    </span>
  );
}
