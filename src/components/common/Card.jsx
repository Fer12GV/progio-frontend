import styles from "./Card.module.css";

/**
 * Contenedor tipo tarjeta (no sustituye utilidades globales `.card` en login legacy).
 *
 * @param {{
 *   title?: string,
 *   actions?: import('react').ReactNode,
 *   children: import('react').ReactNode,
 *   className?: string,
 * }} props
 */
export default function Card({ title, actions, children, className = "" }) {
  const showHeader = Boolean(title) || Boolean(actions);

  return (
    <section className={[styles.root, className].filter(Boolean).join(" ")}>
      {showHeader ? (
        <header className={styles.header}>
          {title ? <h2 className={styles.title}>{title}</h2> : <span />}
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={styles.body}>{children}</div>
    </section>
  );
}
