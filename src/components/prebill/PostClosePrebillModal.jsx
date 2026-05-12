import Button from "@/components/common/Button.jsx";
import Modal from "@/components/common/Modal.jsx";
import PrebillView from "@/components/prebill/PrebillView.jsx";

import styles from "./PostClosePrebillModal.module.css";

/**
 * Tras un cierre exitoso (`POST /services/{id}/close`): muestra la prefactura ya refrescada en página.
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   prebill: Record<string, unknown> | null,
 *   service: Record<string, unknown> | null,
 *   prebillLoading?: boolean,
 *   prebillError?: string | null,
 * }} props
 */
export default function PostClosePrebillModal({
  open,
  onClose,
  prebill,
  service,
  prebillLoading = false,
  prebillError = null,
}) {
  return (
    <Modal
      open={open}
      title="Servicio cerrado"
      size="wide"
      onClose={onClose}
      footer={
        <Button variant="primary" size="sm" type="button" onClick={onClose}>
          Entendido
        </Button>
      }
    >
      <p className={`muted ${styles.intro}`}>
        El cierre se registró correctamente. Resumen de la prefactura asociada (también visible en la
        tarjeta Prefactura de esta página):
      </p>
      <PrebillView
        prebill={prebill}
        service={service}
        loading={prebillLoading}
        error={prebillError}
        className={styles.prebill}
      />
    </Modal>
  );
}
