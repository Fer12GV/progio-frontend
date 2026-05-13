import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/common/Button.jsx";
import Modal from "@/components/common/Modal.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { assignOperator } from "@/api/services.js";
import { listUsers } from "@/api/users.js";

import fields from "./ServiceModalFields.module.css";

function normalizeUserList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function userLabel(u) {
  const email = u?.email ?? u?.username ?? "";
  const name = u?.full_name ?? u?.name ?? "";
  if (name && email) return `${name} (${email})`;
  return email || name || String(u?.id ?? "");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   serviceId: string,
 *   runMutation: (key: string, fn: () => Promise<unknown>) => Promise<boolean>,
 * }} props
 */
export default function AssignOperatorModal({ open, onClose, serviceId, runMutation }) {
  const [users, setUsers] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [manualId, setManualId] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setLocalError(null);
    setSelectedId("");
    setManualId("");
    setUseManual(false);
    setLoadError(null);
    setUsers([]);

    const controller = new AbortController();
    setLoadingUsers(true);
    void (async () => {
      try {
        const data = await listUsers(
          { page: 1, per_page: 80, role: "operario", is_active: true },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;
        const list = normalizeUserList(data);
        setUsers(list);
        if (list.length === 0) {
          try {
            const data2 = await listUsers(
              { page: 1, per_page: 80, is_active: true },
              { signal: controller.signal },
            );
            if (controller.signal.aborted) return;
            const list2 = normalizeUserList(data2);
            setUsers(list2);
            if (list2.length === 0) setUseManual(true);
          } catch {
            if (!controller.signal.aborted) setUseManual(true);
          }
        }
      } catch {
        if (controller.signal.aborted) return;
        setLoadError("No se pudo cargar el listado de usuarios.");
        setUseManual(true);
      } finally {
        if (!controller.signal.aborted) setLoadingUsers(false);
      }
    })();

    return () => controller.abort();
  }, [open]);

  const effectiveOperatorId = useMemo(() => {
    if (useManual) return manualId.trim();
    return selectedId.trim();
  }, [useManual, manualId, selectedId]);

  const submit = useCallback(async () => {
    setLocalError(null);
    const id = effectiveOperatorId;
    if (!id) {
      setLocalError("Selecciona un operador o introduce un UUID válido.");
      return;
    }
    if (!UUID_RE.test(id)) {
      setLocalError("El identificador debe ser un UUID válido.");
      return;
    }

    setSubmitting(true);
    try {
      const body = { assigned_user_id: id };
      const ok = await runMutation("assign", () => assignOperator(serviceId, body));
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }, [effectiveOperatorId, onClose, runMutation, serviceId]);

  const footer = (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
        Cancelar
      </Button>
      <Button variant="primary" size="sm" type="button" loading={submitting} onClick={() => void submit()}>
        Asignar
      </Button>
    </>
  );

  return (
    <Modal open={open} title="Asignar operador" onClose={onClose} footer={footer}>
      <p className={`muted ${fields.hint}`}>
        El cuerpo de <code className={fields.code}>POST /services/{"{id}"}/assign</code> usa{" "}
        <code className={fields.code}>assigned_user_id</code> (UUID del usuario operador).
      </p>

      {loadingUsers ? (
        <div aria-busy="true">
          <Spinner label="Cargando usuarios" />
        </div>
      ) : null}

      {loadError ? (
        <p className={fields.error} role="status">
          {loadError}
        </p>
      ) : null}

      {!loadingUsers && users.length > 0 ? (
        <div className={fields.field}>
          <label className={fields.label} htmlFor="assign-operator-select">
            Operador
          </label>
          <select
            id="assign-operator-select"
            className={fields.select}
            value={useManual ? "" : selectedId}
            onChange={(e) => {
              setUseManual(false);
              setSelectedId(e.target.value);
              setLocalError(null);
            }}
            disabled={useManual || submitting}
          >
            <option value="">— Elegir —</option>
            {users.map((u) => (
              <option key={String(u.id)} value={String(u.id)}>
                {userLabel(u)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`${fields.hint} ${fields.linkBtn}`}
            onClick={() => {
              setUseManual(true);
              setSelectedId("");
            }}
          >
            Introducir UUID manualmente
          </button>
        </div>
      ) : null}

      {useManual || (!loadingUsers && users.length === 0) ? (
        <div className={fields.field}>
          <label className={fields.label} htmlFor="assign-operator-manual">
            UUID del usuario (operador)
          </label>
          <input
            id="assign-operator-manual"
            className={fields.textInput}
            type="text"
            autoComplete="off"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={manualId}
            onChange={(e) => {
              setManualId(e.target.value);
              setLocalError(null);
            }}
            disabled={submitting}
          />
          {users.length > 0 ? (
            <button
              type="button"
              className={`${fields.hint} ${fields.linkBtn}`}
              onClick={() => {
                setUseManual(false);
                setManualId("");
              }}
            >
              Volver al listado
            </button>
          ) : null}
        </div>
      ) : null}

      {localError ? (
        <p className={fields.error} role="alert">
          {localError}
        </p>
      ) : null}
    </Modal>
  );
}
