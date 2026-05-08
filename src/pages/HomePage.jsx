import { useAuth } from "@/context/AuthContext.jsx";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <main className="page">
      <header className="topbar">
        <h1>Panel</h1>
        <button type="button" onClick={() => void logout()}>
          Salir
        </button>
      </header>
      <section className="card">
        <p>
          Hola, <strong>{user?.full_name}</strong>
        </p>
        <p className="muted">Email: {user?.email}</p>
        <p className="muted">Tenant: {user?.tenant_id}</p>
        <p className="muted">Roles: {(user?.roles || []).join(", ")}</p>
      </section>
    </main>
  );
}
