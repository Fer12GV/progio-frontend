import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button.jsx";
import Modal from "@/components/common/Modal.jsx";
import { reprocessService } from "@/api/services.js";

import fields from "./ServiceModalFields.module.css";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   serviceId: string,
 *   runMutation: (key: string, fn: () => Promise<unknown>) => Promise<boolean>,
 * }} props
 */
export default function ReprocessModal({ open, onClose, serviceId, runMutation }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setReason("");
    setLocalError(null);
  }, [open]);

  const submit = useCallback(async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setLocalError("El motivo de reproceso es obligatorio.");
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      const ok = await runMutation("reprocess", () => reprocessService(serviceId, { reason: trimmed }));
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }, [onClose, reason, runMutation, serviceId]);

  const footer = (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
        Cerrar
      </Button>
      <Button variant="primary" size="sm" type="button" loading={submitting} onClick={() => void submit()}>
        Registrar reproceso
      </Button>
    </>
  );

  return (
    <Modal open={open} title="Reproceso" onClose={onClose} footer={footer}>
      <p className={`muted ${fields.hint}`}>
        Se crea un evento nuevo de tipo reproceso; los eventos anteriores no se modifican.
      </p>
      <div className={fields.field}>
        <label className={fields.label} htmlFor="reprocess-reason">
          Motivo (obligatorio)
        </label>
        <textarea
          id="reprocess-reason"
          className={fields.textarea}
          rows={5}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setLocalError(null);
          }}
          disabled={submitting}
          placeholder="Describe por qué se solicita el reproceso…"
        />
      </div>
      {localError ? (
        <p className={fields.error} role="alert">
          {localError}
        </p>
      ) : null}
    </Modal>
  );
}
