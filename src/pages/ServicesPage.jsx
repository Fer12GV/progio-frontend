import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import RoleGuard from "@/components/auth/RoleGuard.jsx";
import Button from "@/components/common/Button.jsx";
import Card from "@/components/common/Card.jsx";
import Select from "@/components/common/Select.jsx";
import Spinner from "@/components/common/Spinner.jsx";
import { listAssets } from "@/api/assets.js";
import { listContracts } from "@/api/contracts.js";
import { createService } from "@/api/services.js";
import { useToast } from "@/hooks/useToast.js";
import { useServices } from "@/hooks/useServices.js";
import { SERVICE_STATUS_FILTER_OPTIONS } from "@/constants/serviceStatusFilter.js";
import { formatApiDetail, isCanceledError } from "@/utils/serviceApiHelpers.js";

import styles from "./ServicesPage.module.css";

const PER_PAGE = 20;

export default function ServicesPage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const [contracts, setContracts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [catalogError, setCatalogError] = useState(null);
  const [assetsError, setAssetsError] = useState(null);
  const [creating, setCreating] = useState(false);

  const [status, setStatus] = useState("");
  const [contractId, setContractId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [page, setPage] = useState(1);

  const {
    items,
    total,
    loading: servicesLoading,
    error: servicesError,
    unavailable: servicesUnavailable,
    refetch,
  } = useServices({
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
      setAssetsError(null);
      try {
        const params = { page: 1, per_page: 100 };
        if (contractId) params.contract_id = contractId;
        const aData = await listAssets(params, { signal: controller.signal });
        if (cancelled) return;
        setAssets(Array.isArray(aData?.items) ? aData.items : []);
      } catch (err) {
        if (cancelled || isCanceledError(err)) return;
        setAssetsError(formatApiDetail(err));
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

  const onCreateDemoService = useCallback(async () => {
    setCreating(true);
    try {
      let pool = assets;
      if (pool.length === 0) {
        const aData = await listAssets({ page: 1, per_page: 100 });
        pool = Array.isArray(aData?.items) ? aData.items : [];
        setAssets(pool);
      }
      if (pool.length === 0) {
        pushToast(
          "No hay activos en el catálogo. En progio-backend ejecuta: make demo o make demo-seed.",
          "danger",
        );
        return;
      }
      const preferred =
        pool.find((a) => String(a.license_plate ?? "").toUpperCase() === "ABC123") ?? pool[0];
      const created = await createService({ asset_id: preferred.id });
      const id = created?.id;
      if (!id) {
        pushToast("El servicio se creó pero no se recibió el identificador.", "warning");
        await refetch();
        return;
      }
      pushToast("Servicio nuevo en estado pendiente.", "success");
      navigate(`/services/${id}`);
    } catch (err) {
      pushToast(formatApiDetail(err), "danger");
    } finally {
      setCreating(false);
    }
  }, [assets, navigate, pushToast, refetch]);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Servicios</h1>
          <p className={`muted ${styles.lead}`}>
            Ciclo operativo con línea de tiempo inmutable y prefactura. Para la demo al cliente,
            usa <strong>Nuevo servicio (demo)</strong> si ya recorriste el flujo y necesitas otro
            servicio en <em>pendiente</em>.
          </p>
        </div>
        <RoleGuard
          roles={["admin_general", "admin_contrato", "coordinador_operaciones"]}
        >
          <Button
            type="button"
            variant="primary"
            loading={creating}
            disabled={servicesUnavailable || creating}
            onClick={() => void onCreateDemoService()}
          >
            Nuevo servicio (demo)
          </Button>
        </RoleGuard>
      </div>

      {catalogError ? (
        <p className={styles.bannerError} role="alert">
          No se pudieron cargar los contratos para los filtros: {catalogError}
        </p>
      ) : null}
      {assetsError ? (
        <p className={styles.bannerError} role="alert">
          No se pudieron cargar los activos para los filtros: {assetsError}
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
            {SERVICE_STATUS_FILTER_OPTIONS.map((o) => (
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
