import { useCallback, useEffect, useState } from "react";

import Button from "@/components/common/Button.jsx";
import Modal from "@/components/common/Modal.jsx";
import { cancelService } from "@/api/services.js";

import fields from "./ServiceModalFields.module.css";

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   serviceId: string,
 *   title?: string,
 *   confirmLabel?: string,
 *   runMutation: (key: string, fn: () => Promise<unknown>) => Promise<boolean>,
 *   busyKey: string,
 * }} props
 */
export default function CancelModal({
  open,
  onClose,
  serviceId,
  title = "Cancelar servicio",
  confirmLabel = "Confirmar cancelación",
  runMutation,
  busyKey,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReason("");
  }, [open]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    try {
      const trimmed = reason.trim();
      const body = trimmed ? { reason: trimmed } : {};
      const ok = await runMutation(busyKey, () => cancelService(serviceId, body));
      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }, [busyKey, onClose, reason, runMutation, serviceId]);

  const footer = (
    <>
      <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={submitting}>
        Volver
      </Button>
      <Button variant="danger" size="sm" type="button" loading={submitting} onClick={() => void submit()}>
        {confirmLabel}
      </Button>
    </>
  );

  return (
    <Modal open={open} title={title} onClose={onClose} footer={footer}>
      <p className={`muted ${fields.hint}`}>El motivo es opcional; se envía en el cuerpo como{" "}
        <code className={fields.code}>reason</code> cuando hay texto.
      </p>
      <div className={fields.field}>
        <label className={fields.label} htmlFor="cancel-reason">
          Motivo (opcional)
        </label>
        <textarea
          id="cancel-reason"
          className={fields.textarea}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={submitting}
          placeholder="Describe el motivo de la cancelación…"
        />
      </div>
    </Modal>
  );
}
