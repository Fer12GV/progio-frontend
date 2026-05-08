import { useCallback, useState } from "react";

import Button from "@/components/common/Button.jsx";
import { useToast } from "@/hooks/useToast.js";
import { useRole } from "@/hooks/useRole.js";
import {
  cancelService,
  closeService,
  pauseService,
  resumeService,
  startService,
} from "@/api/services.js";
import { getCanonicalServiceStatus } from "@/utils/serviceState.js";

import styles from "./ServiceActionBar.module.css";

function formatApiError(err) {
  const d = err?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg ?? JSON.stringify(x)).join(" — ");
  return err?.message ?? "Error en la operación";
}

/**
 * Acciones mutadoras según estado del servicio + RBAC (eventos inmutables).
 *
 * @param {{
 *   serviceId: string,
 *   service: Record<string, unknown>,
 *   onAfterMutation?: () => void | Promise<void>,
 * }} props
 */
export default function ServiceActionBar({ serviceId, service, onAfterMutation }) {
  const { pushToast } = useToast();
  const { hasAny } = useRole();
  const [busyKey, setBusyKey] = useState(null);

  const canonical = getCanonicalServiceStatus(service);

  const operativo = hasAny([
    "operario",
    "admin_general",
    "admin_contrato",
    "coordinador_operaciones",
    "supervisor",
  ]);
  const canAssign = hasAny(["admin_general", "admin_contrato", "coordinador_operaciones"]);
  const canCancel = hasAny(["admin_general", "admin_contrato", "coordinador_operaciones"]);
  const canReprocess = hasAny(["admin_general", "admin_contrato"]);
  const canUnblock = hasAny(["admin_general"]);
  const canSupervise = hasAny([
    "supervisor",
    "admin_general",
    "admin_contrato",
    "coordinador_operaciones",
  ]);

  const run = useCallback(
    async (key, fn) => {
      setBusyKey(key);
      try {
        await fn();
        pushToast("Operación registrada correctamente.", "success");
        await onAfterMutation?.();
      } catch (err) {
        pushToast(formatApiError(err), "danger");
      } finally {
        setBusyKey(null);
      }
    },
    [onAfterMutation, pushToast],
  );

  const onPlaceholder = useCallback(
    (label) => () => {
      pushToast(`${label}: modal en POC.4.5.`, "info");
    },
    [pushToast],
  );

  if (hasAny(["interventor"])) {
    return (
      <div className={styles.bar} role="region" aria-label="Acciones del servicio">
        <p className={`muted ${styles.readOnly}`}>Perfil interventor: solo lectura.</p>
      </div>
    );
  }

  /** @type {import('react').ReactNode[]} */
  const nodes = [];

  const btn = (key, node) => (
    <div className={styles.actionWrap} key={key}>
      {node}
    </div>
  );

  if (canonical === "pending") {
    if (canAssign) {
      nodes.push(
        btn(
          "assign",
          <Button variant="secondary" size="sm" onClick={onPlaceholder("Asignar operador")}>
            Asignar operador
          </Button>,
        ),
      );
    }
    if (operativo) {
      nodes.push(
        btn(
          "start",
          <Button
            variant="primary"
            size="sm"
            loading={busyKey === "start"}
            onClick={() => run("start", () => startService(serviceId))}
          >
            Iniciar
          </Button>,
        ),
      );
    }
    if (canCancel) {
      nodes.push(
        btn(
          "cancel",
          <Button
            variant="danger"
            size="sm"
            loading={busyKey === "cancel"}
            onClick={() => {
              const reason = window.prompt("Motivo de cancelación (opcional):");
              if (reason === null) return;
              void run("cancel", () =>
                cancelService(serviceId, reason.trim() ? { reason: reason.trim() } : {}),
              );
            }}
          >
            Cancelar
          </Button>,
        ),
      );
    }
  }

  if (canonical === "in_progress") {
    if (operativo) {
      nodes.push(
        btn(
          "pause",
          <Button
            variant="secondary"
            size="sm"
            loading={busyKey === "pause"}
            onClick={() => run("pause", () => pauseService(serviceId, {}))}
          >
            Pausar
          </Button>,
        ),
      );
      nodes.push(
        btn(
          "inputs",
          <Button variant="secondary" size="sm" onClick={onPlaceholder("Registrar insumos")}>
            Insumos
          </Button>,
        ),
      );
    }
    if (canSupervise) {
      nodes.push(
        btn(
          "supervise",
          <Button variant="secondary" size="sm" onClick={onPlaceholder("Supervisión")}>
            Supervisión
          </Button>,
        ),
      );
    }
    if (operativo) {
      nodes.push(
        btn(
          "close",
          <Button
            variant="primary"
            size="sm"
            loading={busyKey === "close"}
            onClick={() => run("close", () => closeService(serviceId))}
          >
            Cerrar
          </Button>,
        ),
      );
    }
    if (canCancel) {
      nodes.push(
        btn(
          "cancelSvc",
          <Button
            variant="danger"
            size="sm"
            loading={busyKey === "cancelSvc"}
            onClick={() => {
              const reason = window.prompt("Motivo de cancelación (opcional):");
              if (reason === null) return;
              void run("cancelSvc", () =>
                cancelService(serviceId, reason.trim() ? { reason: reason.trim() } : {}),
              );
            }}
          >
            Cancelar servicio
          </Button>,
        ),
      );
    }
  }

  if (canonical === "on_hold") {
    if (operativo) {
      nodes.push(
        btn(
          "resume",
          <Button
            variant="primary"
            size="sm"
            loading={busyKey === "resume"}
            onClick={() => run("resume", () => resumeService(serviceId))}
          >
            Reanudar
          </Button>,
        ),
      );
    }
    if (canCancel) {
      nodes.push(
        btn(
          "cancelHold",
          <Button
            variant="danger"
            size="sm"
            loading={busyKey === "cancelHold"}
            onClick={() => {
              const reason = window.prompt("Motivo de cancelación (opcional):");
              if (reason === null) return;
              void run("cancelHold", () =>
                cancelService(serviceId, reason.trim() ? { reason: reason.trim() } : {}),
              );
            }}
          >
            Cancelar
          </Button>,
        ),
      );
    }
  }

  if (canonical === "done" || canonical === "cancelled") {
    if (canReprocess) {
      nodes.push(
        btn(
          "reprocess",
          <Button variant="secondary" size="sm" onClick={onPlaceholder("Reproceso")}>
            Reproceso
          </Button>,
        ),
      );
    }
    nodes.push(
      btn(
        "audit",
        <Button
          variant="ghost"
          size="sm"
          onClick={() => pushToast("Vista de auditoría en fase posterior.", "info")}
        >
          Ver auditoría
        </Button>,
      ),
    );
  }

  if (canonical === "reprocessed") {
    nodes.push(
      btn(
        "audit2",
        <Button
          variant="ghost"
          size="sm"
          onClick={() => pushToast("Vista de auditoría en fase posterior.", "info")}
        >
          Ver auditoría
        </Button>,
      ),
    );
  }

  if (canonical === "blocked") {
    if (service?.block_reason != null || service?.blocked_reason != null) {
      nodes.push(
        <p key="blockedReason" className={styles.blockNote}>
          Motivo del bloqueo:{" "}
          <strong>{String(service.block_reason ?? service.blocked_reason)}</strong>
        </p>,
      );
    }
    if (canUnblock) {
      nodes.push(
        btn(
          "unblock",
          <Button
            variant="secondary"
            size="sm"
            onClick={() => pushToast("Desbloqueo: coordinar endpoint en backend.", "info")}
          >
            Desbloquear
          </Button>,
        ),
      );
    }
  }

  if (canonical === "unknown") {
    nodes.push(
      <p key="unknown" className={`muted ${styles.readOnly}`}>
        Estado no reconocido ({String(service?.status ?? service?.state ?? "—")}).
      </p>,
    );
  }

  if (nodes.length === 0) {
    return (
      <div className={styles.bar} role="region" aria-label="Acciones del servicio">
        <p className={`muted ${styles.readOnly}`}>No hay acciones para este estado y rol.</p>
      </div>
    );
  }

  return (
    <div className={styles.bar} role="region" aria-label="Acciones del servicio">
      <div className={styles.actions}>{nodes}</div>
    </div>
  );
}
