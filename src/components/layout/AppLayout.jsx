import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext.jsx";

import styles from "./AppLayout.module.css";

const MQ_MOBILE = "(max-width: 767px)";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(MQ_MOBILE);
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !drawerOpen) {
      return undefined;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, drawerOpen]);

  const sidebarClass = [
    styles.sidebar,
    !isMobile && sidebarCollapsed ? styles.sidebarCollapsed : "",
    isMobile ? styles.sidebarMobile : "",
    isMobile && drawerOpen ? styles.sidebarOpen : "",
  ]
    .filter(Boolean)
    .join(" ");

  const onNavigate = isMobile ? closeDrawer : undefined;

  return (
    <div className={styles.shell}>
      {isMobile && drawerOpen ? (
        <button type="button" className={styles.backdrop} aria-label="Cerrar menú" onClick={closeDrawer} />
      ) : null}

      <aside id="app-sidebar" className={sidebarClass} aria-label="Navegación lateral">
        <div className={styles.sidebarHeader}>
          <span className={styles.brand}>PROGIO</span>
          {!isMobile ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              {sidebarCollapsed ? "»" : "«"}
            </button>
          ) : (
            <button type="button" className={styles.iconBtn} onClick={closeDrawer} aria-label="Cerrar menú">
              ✕
            </button>
          )}
        </div>

        <nav className={styles.nav} aria-label="Principal">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
            onClick={onNavigate}
          >
            <span className={styles.navIcon} aria-hidden>
              🏠
            </span>
            <span className={styles.navLabel}>Inicio</span>
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) =>
              isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
            }
            onClick={onNavigate}
          >
            <span className={styles.navIcon} aria-hidden>
              📋
            </span>
            <span className={styles.navLabel}>Servicios</span>
          </NavLink>
        </nav>

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutBtn} onClick={() => void logout()}>
            Salir
          </button>
        </div>
      </aside>

      <div className={styles.mainWrap}>
        <header className={styles.topBar}>
          {isMobile ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setDrawerOpen(true)}
              aria-expanded={drawerOpen}
              aria-controls="app-sidebar"
              title="Abrir menú"
            >
              ☰
            </button>
          ) : null}
          <p className={styles.userHint}>{user?.full_name ?? user?.email ?? ""}</p>
        </header>

        <div className={styles.content} id="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
