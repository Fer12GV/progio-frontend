import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Button from "@/components/common/Button.jsx";
import Input from "@/components/common/Input.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

/** Partes locales seed distintas del admin (mismo orden que `USER_SPECS` en el backend). */
const OTHER_SEED_LOCALS = ["admin.contrato", "coordinador", "supervisor", "operario"];

export default function LoginPage() {
  const { accessToken, login, error, loading } = useAuth();
  const navigate = useNavigate();

  const viteLoginEmail = import.meta.env.VITE_LOGIN_EMAIL?.trim() ?? "";
  const viteSeedDomain = import.meta.env.VITE_SEED_EMAIL_DOMAIN?.trim() ?? "";
  const domainFromLogin = viteLoginEmail.includes("@")
    ? (viteLoginEmail.split("@").pop() ?? "").toLowerCase()
    : "";
  const domainForSecondaries = (domainFromLogin || viteSeedDomain).toLowerCase();

  const secondaryEmails = useMemo(() => {
    if (!domainForSecondaries) {
      return [];
    }
    return OTHER_SEED_LOCALS.map((local) => `${local}@${domainForSecondaries}`);
  }, [domainForSecondaries]);

  const [email, setEmail] = useState(viteLoginEmail);
  const [password, setPassword] = useState("");

  if (accessToken) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/", { replace: true });
    } catch {
      /* el error ya está en context */
    }
  }

  return (
    <main className="auth-layout">
      <form className="card" onSubmit={onSubmit}>
        <h1>PROGIO</h1>
        <p className="muted">Iniciar sesión</p>
        <details className="login-hint muted">
          <summary>Credenciales y variables de entorno</summary>
          <p>
            El correo y la contraseña deben coincidir con un usuario existente en el backend (p. ej.
            creado por <code>seed</code>). En el servidor, el admin seed usa{" "}
            <code>EMAIL_USERNAME</code> (correo completo o parte local + <code>SEED_EMAIL_DOMAIN</code>
            ) y <code>SEED_DEMO_PASSWORD</code> para todos los usuarios seed.
          </p>
          <p>
            En este frontend, <code>VITE_LOGIN_EMAIL</code> (en <code>.env</code>) puede rellenar el
            campo de correo al cargar; debe ser el mismo valor que uses en el login contra la API.
          </p>
          <p>
            <strong>No</strong> pongas la contraseña en variables <code>VITE_*</code>: el bundle del
            navegador es público y quedaría expuesta. La contraseña sólo existe en el{" "}
            <code>.env</code> del backend como <code>SEED_DEMO_PASSWORD</code> (o la que definas en
            producción).
          </p>
          {viteLoginEmail ? (
            <p>
              Valor actual de <code>VITE_LOGIN_EMAIL</code>: <code>{viteLoginEmail}</code>
            </p>
          ) : (
            <p className="login-hint-tip">
              Opcional: define <code>VITE_LOGIN_EMAIL</code> igual que el correo con el que inicias
              sesión (p. ej. el mismo <code>EMAIL_USERNAME</code> completo del backend).
            </p>
          )}
          {secondaryEmails.length > 0 ? (
            <>
              <p>Otros usuarios seed (misma contraseña que <code>SEED_DEMO_PASSWORD</code>):</p>
              <ul className="login-hint-list">
                {secondaryEmails.map((addr) => (
                  <li key={addr}>
                    <code>{addr}</code>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p>
            <code>tenant_slug</code> en la API es opcional; este cliente no lo envía (el servidor usa
            el slug por defecto).
          </p>
        </details>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <Button type="submit" fullWidth loading={loading}>
          Entrar
        </Button>
      </form>
    </main>
  );
}
