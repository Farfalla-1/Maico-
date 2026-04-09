import { useState, useEffect, useRef, FormEvent } from "react";
import {
  getStockItems,
  deleteStockItem,
  addStockMovement,
  getStockMovements,
  StockItem,
  StockMovement,
  StockType,
  MovementType,
} from "../services/api";
import { useAuth } from "../auth/AuthContext";

function formatQty(value: number | string) {
  const n = Number(value);
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function DropdownMenu({
  onDelete,
  onMovement,
  onHistory,
}: {
  onDelete: () => void;
  onMovement: () => void;
  onHistory: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="ing-dropdown" ref={ref}>
      <button
        className="ing-dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Acciones"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="ing-dropdown-menu">
          <button onClick={() => { setOpen(false); onMovement(); }}>Registrar movimiento</button>
          <button onClick={() => { setOpen(false); onHistory(); }}>Ver historial</button>
          <button className="ing-dropdown-danger" onClick={() => { setOpen(false); onDelete(); }}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function StockPage() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StockType>("RAW_MATERIAL");

  // Movement modal
  const [movementItem, setMovementItem] = useState<StockItem | null>(null);
  const [movType, setMovType] = useState<MovementType>("IN");
  const [movQty, setMovQty] = useState("");
  const [movReason, setMovReason] = useState("");
  const [movError, setMovError] = useState<string | null>(null);
  const [movSubmitting, setMovSubmitting] = useState(false);

  // History modal
  const [historyItem, setHistoryItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function loadItems() {
    try {
      setLoading(true);
      const data = await getStockItems(activeTab);
      setItems(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar stock");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [activeTab]);

  async function handleDelete(item: StockItem) {
    if (!confirm(`¿Eliminar "${item.name}" del stock?`)) return;
    try {
      await deleteStockItem(item.id);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // Movement
  function openMovement(item: StockItem) {
    setMovementItem(item);
    setMovType("IN");
    setMovQty("");
    setMovReason("");
    setMovError(null);
  }

  async function handleMovementSubmit(e: FormEvent) {
    e.preventDefault();
    if (!movementItem) return;
    setMovError(null);
    setMovSubmitting(true);

    const qty = Number(movQty);
    if (isNaN(qty) || qty <= 0) {
      setMovError("Cantidad debe ser un número positivo");
      setMovSubmitting(false);
      return;
    }

    try {
      await addStockMovement(movementItem.id, {
        movementType: movType,
        quantity: qty,
        reason: movReason || (movType === "IN" ? "Entrada manual" : "Salida manual"),
      });
      setMovementItem(null);
      await loadItems();
    } catch (err) {
      setMovError(err instanceof Error ? err.message : "Error al registrar movimiento");
    } finally {
      setMovSubmitting(false);
    }
  }

  // History
  async function openHistory(item: StockItem) {
    setHistoryItem(item);
    setHistoryLoading(true);
    try {
      const data = await getStockMovements(item.id);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="ing-page">
      <div className="page-header">
        <div>
          <h1>Stock</h1>
          <p className="ing-page-count">{items.length} items en stock</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="stock-tabs">
        <button
          className={`stock-tab ${activeTab === "RAW_MATERIAL" ? "stock-tab-active" : ""}`}
          onClick={() => setActiveTab("RAW_MATERIAL")}
        >
          Materia Prima
        </button>
        <button
          className={`stock-tab ${activeTab === "FINISHED_PRODUCT" ? "stock-tab-active" : ""}`}
          onClick={() => setActiveTab("FINISHED_PRODUCT")}
        >
          Productos Terminados
        </button>
      </div>

      {/* Auto-sync hint */}
      <p className="stock-auto-hint">
        {activeTab === "RAW_MATERIAL"
          ? "El stock de materia prima se genera automáticamente al crear un ingrediente."
          : "El stock de productos se genera automáticamente al crear una receta. La unidad se toma del rendimiento de la receta."}
      </p>

      {/* List */}
      {items.length === 0 ? (
        <p className="empty-state">
          No hay items de {activeTab === "RAW_MATERIAL" ? "materia prima" : "productos terminados"} en stock.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <table className="data-table ing-table-desktop">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Stock actual</th>
                <th>Unidad</th>
                <th>Última actualización</th>
                {isAdmin && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="ing-name-cell">{item.name}</td>
                  <td>
                    <span
                      className={`stock-qty ${Number(item.currentStock) === 0 ? "stock-qty-zero" : ""}`}
                    >
                      {formatQty(item.currentStock)}
                    </span>
                  </td>
                  <td>
                    <span className="ing-unit-badge">{item.unit}</span>
                  </td>
                  <td className="ing-date-cell">
                    {new Date(item.updatedAt).toLocaleDateString("es-AR")}
                  </td>
                  {isAdmin && (
                    <td className="action-buttons">
                      <button className="btn-secondary-small" onClick={() => openMovement(item)}>
                        Movimiento
                      </button>
                      <button className="btn-secondary-small" onClick={() => openHistory(item)}>
                        Historial
                      </button>
                      <button className="btn-danger-small" onClick={() => handleDelete(item)}>
                        Eliminar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="ing-cards-mobile">
            {items.map((item) => (
              <div key={item.id} className="ing-card">
                <div className="ing-card-top">
                  <div className="ing-card-info">
                    <h3>{item.name}</h3>
                    <span className="ing-unit-badge">{item.unit}</span>
                  </div>
                  {isAdmin && (
                    <DropdownMenu
                      onDelete={() => handleDelete(item)}
                      onMovement={() => openMovement(item)}
                      onHistory={() => openHistory(item)}
                    />
                  )}
                </div>
                <div className="ing-card-bottom">
                  <span
                    className={`stock-qty ${Number(item.currentStock) === 0 ? "stock-qty-zero" : ""}`}
                  >
                    {formatQty(item.currentStock)} {item.unit}
                  </span>
                  <span className="ing-card-date">
                    {new Date(item.updatedAt).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Movement modal */}
      {movementItem && (
        <div className="modal-overlay" onClick={() => setMovementItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Registrar movimiento — {movementItem.name}</h2>
            <p style={{ color: "#888", marginBottom: 16 }}>
              Stock actual: {formatQty(movementItem.currentStock)} {movementItem.unit}
            </p>
            <form onSubmit={handleMovementSubmit}>
              <div className="form-group">
                <label>Tipo</label>
                <div className="stock-mov-type-toggle">
                  <button
                    type="button"
                    className={`stock-mov-btn ${movType === "IN" ? "stock-mov-btn-active stock-mov-in" : ""}`}
                    onClick={() => setMovType("IN")}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    className={`stock-mov-btn ${movType === "OUT" ? "stock-mov-btn-active stock-mov-out" : ""}`}
                    onClick={() => setMovType("OUT")}
                  >
                    Salida
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="mov-qty">Cantidad</label>
                <input
                  id="mov-qty"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="mov-reason">Motivo</label>
                <input
                  id="mov-reason"
                  type="text"
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ej: Ajuste de inventario"
                />
              </div>
              {movError && <p className="error-message">{movError}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-secondary-small" onClick={() => setMovementItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={movSubmitting}>
                  {movSubmitting ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyItem && (
        <div className="modal-overlay" onClick={() => setHistoryItem(null)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>Historial — {historyItem.name}</h2>
            <p style={{ color: "#888", marginBottom: 16 }}>
              Stock actual: {formatQty(historyItem.currentStock)} {historyItem.unit}
            </p>
            {historyLoading ? (
              <p>Cargando...</p>
            ) : movements.length === 0 ? (
              <p className="empty-state">No hay movimientos registrados.</p>
            ) : (
              <div className="stock-history-list">
                {movements.map((mov) => (
                  <div key={mov.id} className="stock-history-item">
                    <div className="stock-history-left">
                      <span
                        className={`stock-history-badge ${
                          mov.movementType === "IN" ? "stock-history-in" : "stock-history-out"
                        }`}
                      >
                        {mov.movementType === "IN" ? "+" : "-"}{formatQty(mov.quantity)}
                      </span>
                      <span className="stock-history-reason">{mov.reason}</span>
                    </div>
                    <div className="stock-history-right">
                      {mov.ledgerEntry && (
                        <span className="stock-history-ledger">Caja #{mov.ledgerEntry.id}</span>
                      )}
                      <span className="stock-history-date">
                        {new Date(mov.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button className="btn-secondary-small" onClick={() => setHistoryItem(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockPage;
