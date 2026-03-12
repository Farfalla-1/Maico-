import { useState, useEffect, useRef, FormEvent } from "react";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  bulkUpdatePrices,
  Ingredient,
  Unit,
} from "../services/api";

const UNIT_LABELS: Record<Unit, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UNIT: "Unidad",
};

const UNITS: Unit[] = ["KG", "G", "L", "ML", "UNIT"];

function formatPrice(value: number | string) {
  return Number(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function DropdownMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
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
          <button onClick={() => { setOpen(false); onEdit(); }}>Editar</button>
          <button className="ing-dropdown-danger" onClick={() => { setOpen(false); onDelete(); }}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("KG");
  const [price, setPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Bulk edit
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkPrices, setBulkPrices] = useState<Record<number, string>>({});
  const [bulkPercent, setBulkPercent] = useState("");
  const [bulkSelected, setBulkSelected] = useState<Set<number>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  async function loadIngredients() {
    try {
      setLoading(true);
      const data = await getIngredients();
      setIngredients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ingredients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIngredients();
  }, []);

  function resetForm() {
    setName("");
    setUnit("KG");
    setPrice("");
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  }

  function handleEdit(ingredient: Ingredient) {
    setName(ingredient.name);
    setUnit(ingredient.unit);
    setPrice(String(Number(ingredient.price)));
    setEditingId(ingredient.id);
    setFormError(null);
    setShowForm(true);
    setBulkMode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError("El precio debe ser un número positivo");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        await updateIngredient(editingId, { name, unit, price: priceNum });
      } else {
        await createIngredient({ name, unit, price: priceNum });
      }
      resetForm();
      await loadIngredients();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save ingredient");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ingredient: Ingredient) {
    if (!confirm(`¿Eliminar "${ingredient.name}"?`)) return;
    try {
      await deleteIngredient(ingredient.id);
      await loadIngredients();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ingredient");
    }
  }

  // Bulk edit functions
  function enterBulkMode() {
    setShowForm(false);
    setBulkMode(true);
    setBulkError(null);
    setBulkPercent("");
    const prices: Record<number, string> = {};
    for (const ing of ingredients) {
      prices[ing.id] = String(Number(ing.price));
    }
    setBulkPrices(prices);
    setBulkSelected(new Set(ingredients.map((i) => i.id)));
  }

  function exitBulkMode() {
    setBulkMode(false);
    setBulkPrices({});
    setBulkSelected(new Set());
    setBulkPercent("");
    setBulkError(null);
  }

  function toggleSelect(id: number) {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (bulkSelected.size === ingredients.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(ingredients.map((i) => i.id)));
    }
  }

  function applyPercent() {
    const pct = Number(bulkPercent);
    if (isNaN(pct) || pct === 0) return;

    setBulkPrices((prev) => {
      const next = { ...prev };
      for (const ing of ingredients) {
        if (bulkSelected.has(ing.id)) {
          const original = Number(ing.price);
          const newPrice = original * (1 + pct / 100);
          next[ing.id] = Math.round(newPrice * 100 / 100).toFixed(2);
        }
      }
      return next;
    });
  }

  async function saveBulkChanges() {
    const updates: { id: number; price: number }[] = [];
    for (const ing of ingredients) {
      const newPrice = Number(bulkPrices[ing.id]);
      if (isNaN(newPrice) || newPrice <= 0) {
        setBulkError(`Precio inválido para "${ing.name}"`);
        return;
      }
      if (newPrice !== Number(ing.price)) {
        updates.push({ id: ing.id, price: newPrice });
      }
    }

    if (updates.length === 0) {
      setBulkError("No hay cambios para guardar");
      return;
    }

    setBulkSaving(true);
    setBulkError(null);
    try {
      await bulkUpdatePrices(updates);
      exitBulkMode();
      await loadIngredients();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setBulkSaving(false);
    }
  }

  function getBulkChangeCount() {
    let count = 0;
    for (const ing of ingredients) {
      if (Number(bulkPrices[ing.id]) !== Number(ing.price)) count++;
    }
    return count;
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div className="ing-page">
      <div className="page-header">
        <div>
          <h1>Ingredientes</h1>
          <p className="ing-page-count">{ingredients.length} ingredientes cargados</p>
        </div>
        <div className="page-header-actions">
          {!bulkMode && ingredients.length > 0 && (
            <button className="btn-secondary-small bulk-edit-btn" onClick={enterBulkMode}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Ajuste masivo
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => {
              if (bulkMode) { exitBulkMode(); }
              else if (showForm) { resetForm(); }
              else { setShowForm(true); }
            }}
          >
            {bulkMode ? "Cancelar" : showForm ? "Cancelar" : "+ Nuevo ingrediente"}
          </button>
        </div>
      </div>

      {/* Single ingredient form */}
      {showForm && !bulkMode && (
        <form onSubmit={handleSubmit} className="card form-card">
          <h2>{editingId ? "Editar ingrediente" : "Nuevo ingrediente"}</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ing-name">Nombre</label>
              <input
                id="ing-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Harina"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ing-unit">Unidad</label>
              <select
                id="ing-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>{UNIT_LABELS[u]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="ing-price">Precio ($)</label>
              <input
                id="ing-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          {formError && <p className="error-message">{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Crear ingrediente"}
          </button>
        </form>
      )}

      {/* Bulk edit mode */}
      {bulkMode && (
        <div className="bulk-panel card">
          <h2>Ajuste masivo de precios</h2>

          <div className="bulk-percent-row">
            <div className="bulk-percent-input">
              <label>Aplicar porcentaje a seleccionados</label>
              <div className="bulk-percent-controls">
                <input
                  type="number"
                  step="0.1"
                  value={bulkPercent}
                  onChange={(e) => setBulkPercent(e.target.value)}
                  placeholder="Ej: 15"
                />
                <span className="bulk-percent-sign">%</span>
                <button type="button" className="btn-primary" onClick={applyPercent}>
                  Aplicar
                </button>
              </div>
            </div>
            <p className="bulk-hint">
              Usá valores negativos para bajar precios. Ej: -10 para un 10% menos.
            </p>
          </div>

          <div className="bulk-select-all">
            <label>
              <input
                type="checkbox"
                checked={bulkSelected.size === ingredients.length}
                onChange={toggleSelectAll}
              />
              Seleccionar todos ({bulkSelected.size}/{ingredients.length})
            </label>
          </div>

          <div className="bulk-table-wrap">
            <table className="data-table bulk-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Ingrediente</th>
                  <th>Precio actual</th>
                  <th>Nuevo precio</th>
                  <th>Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => {
                  const oldPrice = Number(ing.price);
                  const newPrice = Number(bulkPrices[ing.id]) || 0;
                  const diff = newPrice - oldPrice;
                  const diffPct = oldPrice > 0 ? ((diff / oldPrice) * 100).toFixed(1) : "0";
                  return (
                    <tr key={ing.id} className={bulkSelected.has(ing.id) ? "" : "bulk-row-unselected"}>
                      <td>
                        <input
                          type="checkbox"
                          checked={bulkSelected.has(ing.id)}
                          onChange={() => toggleSelect(ing.id)}
                        />
                      </td>
                      <td className="ing-name-cell">
                        {ing.name}
                        <span className="ing-unit-badge" style={{ marginLeft: 6 }}>{UNIT_LABELS[ing.unit]}</span>
                      </td>
                      <td className="bulk-old-price">{formatPrice(oldPrice)}</td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="bulk-price-input"
                          value={bulkPrices[ing.id] ?? ""}
                          onChange={(e) =>
                            setBulkPrices((prev) => ({ ...prev, [ing.id]: e.target.value }))
                          }
                        />
                      </td>
                      <td className={`bulk-diff ${diff > 0 ? "bulk-diff-up" : diff < 0 ? "bulk-diff-down" : ""}`}>
                        {diff !== 0 && (
                          <>
                            {diff > 0 ? "+" : ""}{formatPrice(diff)}
                            <span className="bulk-diff-pct">({diff > 0 ? "+" : ""}{diffPct}%)</span>
                          </>
                        )}
                        {diff === 0 && <span className="bulk-diff-none">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {bulkError && <p className="error-message">{bulkError}</p>}

          <div className="bulk-actions">
            <span className="bulk-change-count">
              {getBulkChangeCount()} cambio{getBulkChangeCount() !== 1 ? "s" : ""} pendiente{getBulkChangeCount() !== 1 ? "s" : ""}
            </span>
            <div className="bulk-actions-btns">
              <button type="button" className="btn-secondary-small" onClick={exitBulkMode}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveBulkChanges}
                disabled={bulkSaving || getBulkChangeCount() === 0}
              >
                {bulkSaving ? "Guardando..." : "Guardar todos los cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Normal view */}
      {!bulkMode && (
        <>
          {ingredients.length === 0 ? (
            <p className="empty-state">No hay ingredientes cargados.</p>
          ) : (
            <>
              {/* Desktop table */}
              <table className="data-table ing-table-desktop">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Unidad</th>
                    <th>Precio</th>
                    <th>Última actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ing) => (
                    <tr key={ing.id}>
                      <td className="ing-name-cell">{ing.name}</td>
                      <td>
                        <span className="ing-unit-badge">{UNIT_LABELS[ing.unit]}</span>
                      </td>
                      <td className="ing-price-cell">{formatPrice(ing.price)}</td>
                      <td className="ing-date-cell">
                        {new Date(ing.updatedAt).toLocaleDateString("es-AR")}
                      </td>
                      <td className="action-buttons">
                        <button className="btn-secondary-small" onClick={() => handleEdit(ing)}>
                          Editar
                        </button>
                        <button className="btn-danger-small" onClick={() => handleDelete(ing)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="ing-cards-mobile">
                {ingredients.map((ing) => (
                  <div key={ing.id} className="ing-card">
                    <div className="ing-card-top">
                      <div className="ing-card-info">
                        <h3>{ing.name}</h3>
                        <span className="ing-unit-badge">{UNIT_LABELS[ing.unit]}</span>
                      </div>
                      <DropdownMenu
                        onEdit={() => handleEdit(ing)}
                        onDelete={() => handleDelete(ing)}
                      />
                    </div>
                    <div className="ing-card-bottom">
                      <span className="ing-card-price">{formatPrice(ing.price)}</span>
                      <span className="ing-card-date">
                        {new Date(ing.updatedAt).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default IngredientsPage;
