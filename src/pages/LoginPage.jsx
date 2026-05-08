import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import Button from "@/components/common/Button.jsx";
import Input from "@/components/common/Input.jsx";
import { useAuth } from "@/context/AuthContext.jsx";

export default function LoginPage() {
  const { accessToken, login, error, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
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
