import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button.jsx";
import Modal from "@/components/common/Modal.jsx";
import { registerInputs } from "@/api/services.js";

import fields from "./ServiceModalFields.module.css";

function newLine() {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
    description: "",
    quantity: "1",
    unit: "ud",
  };
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   serviceId: string,
 *   runMutation: (key: string, fn: () => Promise<unknown>) => Promise<boolean>,
 * }} props
 */
export default function RegisterInputsModal({ open, onClose, serviceId, runMutation }) {
  const [lines, setLines] = useState(() => [newLine(), newLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLines([newLine(), newLine()]);
    setLocalError(null);
  }, [open]);

  const updateLine = useCallback((id, patch) => {
    setLines((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const addLine = useCallback(() => {
    setLines((prev) => [...prev, newLine()]);
  }, []);

  const removeLine = useCallback((id) => {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }, []);

  const submit = useCallback(async () => {
    setLocalError(null);
    const items = [];
    for (const row of lines) {
      const desc = row.description.trim();
      if (!desc) continue;
      const q = Number.parseFloat(String(row.quantity).replace(",", "."));
      if (Number.isNaN(q) || q <= 0) {
        setLocalError("Cada línea con descripción debe tener cantidad numérica mayor que cero.");
        return;
      }
      const unit = row.unit.trim() || "ud";
      items.push({ description: desc, quantity: q, unit });
    }
    if (items.length === 0) {
      setLocalError("Añade al menos un insumo con descripción.");
      return;
    }

    setSubmitting(true);
    try {
      const body = { items };
      const ok = await runMutation("inputs", () => registerInputs(serviceId, body));
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }, [lines, onClose, runMutation, serviceId]);

  const footer = (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
        Cerrar
      </Button>
      <Button variant="secondary" size="sm" type="button" onClick={addLine} disabled={submitting}>
        Añadir línea
      </Button>
      <Button variant="primary" size="sm" type="button" loading={submitting} onClick={() => void submit()}>
        Registrar
      </Button>
    </>
  );

  return (
    <Modal open={open} title="Registrar insumos" onClose={onClose} footer={footer}>
      <p className={`muted ${fields.hint}`}>
        Se envía <code className={fields.code}>POST /services/{"{id}"}/inputs</code> con cuerpo{" "}
        <code className={fields.code}>{"{ items: [{ description, quantity, unit }] }"}</code> (ajustar
        cuando el backend fije el schema definitivo).
      </p>

      {lines.map((row) => (
        <div key={row.id} className={fields.lineRow}>
          <div className={`${fields.field} ${fields.descGrow}`}>
            <label className={fields.label} htmlFor={`ins-desc-${row.id}`}>
              Descripción
            </label>
            <input
              id={`ins-desc-${row.id}`}
              className={fields.textInput}
              type="text"
              value={row.description}
              onChange={(e) => updateLine(row.id, { description: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className={`${fields.field} ${fields.qnarrow}`}>
            <label className={fields.label} htmlFor={`ins-q-${row.id}`}>
              Cant.
            </label>
            <input
              id={`ins-q-${row.id}`}
              className={fields.textInput}
              type="text"
              inputMode="decimal"
              value={row.quantity}
              onChange={(e) => updateLine(row.id, { quantity: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className={`${fields.field} ${fields.unarrow}`}>
            <label className={fields.label} htmlFor={`ins-u-${row.id}`}>
              Ud.
            </label>
            <input
              id={`ins-u-${row.id}`}
              className={fields.textInput}
              type="text"
              value={row.unit}
              onChange={(e) => updateLine(row.id, { unit: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className={fields.rmCell}>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={submitting || lines.length <= 1}
              onClick={() => removeLine(row.id)}
            >
              Quitar
            </Button>
          </div>
        </div>
      ))}

      {localError ? (
        <p className={fields.error} role="alert">
          {localError}
        </p>
      ) : null}
    </Modal>
  );
}
