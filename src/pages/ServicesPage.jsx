import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Card from "@/components/common/Card.jsx";
import Select from "@/components/common/Select.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { listAssets } from "@/api/assets.js";
import { listContracts } from "@/api/contracts.js";
import { useServices } from "@/hooks/useServices.js";
import { formatApiDetail, isCanceledError } from "@/utils/serviceApiHelpers.js";

import styles from "./ServicesPage.module.css";

/** Valores orientativos; el backend POC.4 puede usar otro vocabulario. */
const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "En Proceso", label: "En proceso" },
  { value: "En Espera", label: "En espera" },
  { value: "Finalizado", label: "Finalizado" },
  { value: "Cancelado", label: "Cancelado" },
  { value: "Reprocesado", label: "Reprocesado" },
  { value: "Bloqueado", label: "Bloqueado" },
];

const PER_PAGE = 20;

export default function ServicesPage() {
  const [contracts, setContracts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [catalogError, setCatalogError] = useState(null);

  const [status, setStatus] = useState("");
  const [contractId, setContractId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [page, setPage] = useState(1);

  const { items, total, loading: servicesLoading, error: servicesError, unavailable: servicesUnavailable } =
    useServices({
      page,
      perPage: PER_PAGE,
      status,
      contractId,
      assetId,
    });

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PER_PAGE)), [total]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadContracts() {
      setCatalogError(null);
      try {
        const cData = await listContracts({ page: 1, per_page: 100 }, { signal: controller.signal });
        if (cancelled) return;
        setContracts(Array.isArray(cData?.items) ? cData.items : []);
      } catch (err) {
        if (cancelled || isCanceledError(err)) return;
        setCatalogError(formatApiDetail(err));
        setContracts([]);
      }
    }

    void loadContracts();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function loadAssets() {
      try {
        const params = { page: 1, per_page: 200 };
        if (contractId) params.contract_id = contractId;
        const aData = await listAssets(params, { signal: controller.signal });
        if (cancelled) return;
        setAssets(Array.isArray(aData?.items) ? aData.items : []);
      } catch (err) {
        if (cancelled || isCanceledError(err)) return;
        setAssets([]);
      }
    }

    void loadAssets();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [contractId]);

  const onContractChange = (e) => {
    setContractId(e.target.value);
    setAssetId("");
    setPage(1);
  };

  const onFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Servicios</h1>
      <p className={`muted ${styles.lead}`}>
        Listado paginado con filtros por estado, contrato y activo. Requiere{" "}
        <code className={styles.mono}>GET /services</code> en el backend (POC.4).
      </p>

      {catalogError ? (
        <p className={styles.bannerError} role="alert">
          No se pudieron cargar los contratos para los filtros: {catalogError}
        </p>
      ) : null}

      <Card title="Filtros" className={styles.cardMargin}>
        <div className={styles.filters}>
          <Select
            label="Estado"
            value={status}
            onChange={onFilterChange(setStatus)}
            className={styles.filterField}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || "all"} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            label="Contrato"
            value={contractId}
            onChange={onContractChange}
            className={styles.filterField}
          >
            <option value="">Todos los contratos</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
          <Select
            label="Activo"
            value={assetId}
            onChange={onFilterChange(setAssetId)}
            className={styles.filterField}
          >
            <option value="">Todos los activos</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.license_plate} ({a.client_label})
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card title="Resultados" className={styles.cardMargin}>
        {servicesUnavailable ? (
          <p className={styles.bannerWarn} role="status">
            El endpoint de servicios aún no está disponible en la API (backend POC.4). Cuando exista{" "}
            <code className={styles.mono}>GET /services</code>, la tabla se llenará automáticamente.
          </p>
        ) : null}
        {servicesError ? (
          <p className={styles.bannerError} role="alert">
            {servicesError}
          </p>
        ) : null}

        {servicesLoading ? (
          <div className={styles.loading}>
            <Spinner label="Cargando servicios" />
          </div>
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Contrato</th>
                    <th scope="col">Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className={styles.emptyCell}>
                        {servicesUnavailable
                          ? "—"
                          : "No hay servicios que coincidan con los filtros."}
                      </td>
                    </tr>
                  ) : (
                    items.map((row) => (
                      <tr key={String(row.id)}>
                        <td className={styles.monoCell}>
                          <Link to={`/services/${row.id}`} className={styles.rowLink}>
                            {String(row.id)}
                          </Link>
                        </td>
                        <td>{row.status ?? row.state ?? "—"}</td>
                        <td className={styles.monoCell}>{String(row.contract_id ?? "—")}</td>
                        <td className={styles.monoCell}>{String(row.asset_id ?? "—")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!servicesUnavailable && total > 0 ? (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </button>
                <span className={styles.pageInfo}>
                  Página {page} de {totalPages} ({total} registros)
                </span>
                <button
                  type="button"
                  className={styles.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
