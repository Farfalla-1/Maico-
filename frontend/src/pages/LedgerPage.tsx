import { useState, useEffect, FormEvent, useRef } from "react";
import {
  getLedgerEntries,
  getLedgerSummary,
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
  LedgerEntry,
  LedgerSummary,
  LedgerType,
} from "../services/api";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const CATEGORIES = [
  "Ventas",
  "Materia prima",
  "Sueldos",
  "Alquiler",
  "Servicios",
  "Transporte",
  "Impuestos",
  "Mantenimiento",
  "Otros",
];

function formatCurrency(value: number | string) {
  return Number(value).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function exportToCSV(entries: LedgerEntry[], summary: LedgerSummary | null, period: string) {
  const BOM = "\uFEFF";
  const header = "Fecha,Tipo,Descripción,Categoría,Monto\n";
  const rows = entries.map((e) => {
    const date = new Date(e.date).toLocaleDateString("es-AR");
    const type = e.type === "INCOME" ? "Ingreso" : "Egreso";
    const desc = `"${e.description.replace(/"/g, '""')}"`;
    const cat = e.category || "";
    const sign = e.type === "INCOME" ? "" : "-";
    const amount = `${sign}${Number(e.amount).toFixed(2)}`;
    return `${date},${type},${desc},${cat},${amount}`;
  }).join("\n");

  let summaryBlock = "";
  if (summary) {
    summaryBlock = `\n\n,,,"Total Ingresos",${summary.totalIncome.toFixed(2)}\n,,,"Total Egresos",-${summary.totalExpense.toFixed(2)}\n,,,"Balance",${summary.balance.toFixed(2)}`;
  }

  const csv = BOM + header + rows + summaryBlock;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `libro-caja-${period}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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

function LedgerPage() {
  const now = new Date();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<string>("");

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formType, setFormType] = useState<LedgerType>("INCOME");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(now.toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const params: { month?: number; year?: number; type?: string } = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      if (filterType) params.type = filterType;

      const [entriesData, summaryData] = await Promise.all([
        getLedgerEntries(params),
        getLedgerSummary({ month: filterMonth || undefined, year: filterYear || undefined }),
      ]);
      setEntries(entriesData);
      setSummary(summaryData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar movimientos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, filterType]);

  function resetForm() {
    setDescription("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("");
    setFormType("INCOME");
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  }

  function handleEdit(entry: LedgerEntry) {
    setFormType(entry.type);
    setDescription(entry.description);
    setAmount(String(Number(entry.amount)));
    setDate(entry.date.split("T")[0]);
    setCategory(entry.category ?? "");
    setEditingId(entry.id);
    setFormError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("El monto debe ser un número positivo");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        type: formType,
        description,
        amount: amountNum,
        date,
        category: category || undefined,
      };

      if (editingId) {
        await updateLedgerEntry(editingId, payload);
      } else {
        await createLedgerEntry(payload);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(entry: LedgerEntry) {
    if (!confirm(`¿Eliminar "${entry.description}"?`)) return;
    try {
      await deleteLedgerEntry(entry.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  // Generate year options (current year ± 2)
  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
    yearOptions.push(y);
  }

  if (loading && entries.length === 0) return <p>Cargando...</p>;
  if (error && entries.length === 0) return <p className="error-message">{error}</p>;

  return (
    <div className="ledger-page">
      <div className="page-header">
        <div>
          <h1>Libro de Caja</h1>
          <p className="ing-page-count">Ingresos y egresos del negocio</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          {showForm ? "Cancelar" : "+ Nuevo movimiento"}
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="ledger-summary">
          <div className="ledger-summary-card ledger-income">
            <span className="ledger-summary-label">Ingresos</span>
            <span className="ledger-summary-value">{formatCurrency(summary.totalIncome)}</span>
          </div>
          <div className="ledger-summary-card ledger-expense">
            <span className="ledger-summary-label">Egresos</span>
            <span className="ledger-summary-value">{formatCurrency(summary.totalExpense)}</span>
          </div>
          <div className={`ledger-summary-card ${summary.balance >= 0 ? "ledger-positive" : "ledger-negative"}`}>
            <span className="ledger-summary-label">Balance</span>
            <span className="ledger-summary-value">{formatCurrency(summary.balance)}</span>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {summary && (summary.totalIncome > 0 || summary.totalExpense > 0) && (() => {
        const total = summary.totalIncome + summary.totalExpense;
        const ratio = total > 0 ? summary.totalIncome / total : 0;
        const percent = Math.round(ratio * 100);
        const isPositive = summary.balance >= 0;
        return (
          <div className="ledger-progress">
            <div className="ledger-progress-bar">
              <div
                className={`ledger-progress-fill ${isPositive ? "progress-green" : "progress-red"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="ledger-progress-labels">
              <span className="ledger-progress-pct">{percent}% ingresos</span>
              <span className="ledger-progress-pct">{100 - percent}% egresos</span>
            </div>
          </div>
        );
      })()}

      {/* Filters */}
      <div className="ledger-filters">
        <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))}>
          <option value={0}>Todos los meses</option>
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">Todos</option>
          <option value="INCOME">Ingresos</option>
          <option value="EXPENSE">Egresos</option>
        </select>
        <button
          className="btn-secondary-small ledger-export-btn"
          onClick={() => {
            const monthName = filterMonth ? MONTHS[filterMonth - 1] : "todos";
            exportToCSV(entries, summary, `${monthName}-${filterYear}`);
          }}
          disabled={entries.length === 0}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card form-card">
          <h2>{editingId ? "Editar movimiento" : "Nuevo movimiento"}</h2>

          <div className="ledger-type-toggle">
            <button
              type="button"
              className={`ledger-type-btn ${formType === "INCOME" ? "active-income" : ""}`}
              onClick={() => setFormType("INCOME")}
            >
              Ingreso
            </button>
            <button
              type="button"
              className={`ledger-type-btn ${formType === "EXPENSE" ? "active-expense" : ""}`}
              onClick={() => setFormType("EXPENSE")}
            >
              Egreso
            </button>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label htmlFor="ledger-desc">Descripción</label>
              <input
                id="ledger-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Venta de tortas"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ledger-amount">Monto ($)</label>
              <input
                id="ledger-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ledger-date">Fecha</label>
              <input
                id="ledger-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="ledger-category">Categoría</label>
              <select
                id="ledger-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="error-message">{formError}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar movimiento"}
          </button>
        </form>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <p className="empty-state">No hay movimientos para el período seleccionado.</p>
      ) : (
        <>
          {/* Desktop table */}
          <table className="data-table ledger-table-desktop">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="ledger-date-cell">
                    {new Date(entry.date).toLocaleDateString("es-AR")}
                  </td>
                  <td>
                    <span className={`ledger-type-badge ${entry.type === "INCOME" ? "badge-income" : "badge-expense"}`}>
                      {entry.type === "INCOME" ? "Ingreso" : "Egreso"}
                    </span>
                  </td>
                  <td className="ledger-desc-cell">{entry.description}</td>
                  <td className="ledger-cat-cell">{entry.category || "—"}</td>
                  <td className={`ledger-amount-cell ${entry.type === "INCOME" ? "amount-income" : "amount-expense"}`}>
                    {entry.type === "INCOME" ? "+" : "−"} {formatCurrency(entry.amount)}
                  </td>
                  <td className="action-buttons">
                    <button className="btn-secondary-small" onClick={() => handleEdit(entry)}>
                      Editar
                    </button>
                    <button className="btn-danger-small" onClick={() => handleDelete(entry)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="ledger-cards-mobile">
            {entries.map((entry) => (
              <div key={entry.id} className={`ledger-card ${entry.type === "INCOME" ? "ledger-card-income" : "ledger-card-expense"}`}>
                <div className="ledger-card-top">
                  <div className="ledger-card-info">
                    <span className={`ledger-type-badge ${entry.type === "INCOME" ? "badge-income" : "badge-expense"}`}>
                      {entry.type === "INCOME" ? "Ingreso" : "Egreso"}
                    </span>
                    {entry.category && (
                      <span className="ledger-card-cat">{entry.category}</span>
                    )}
                  </div>
                  <DropdownMenu
                    onEdit={() => handleEdit(entry)}
                    onDelete={() => handleDelete(entry)}
                  />
                </div>
                <p className="ledger-card-desc">{entry.description}</p>
                <div className="ledger-card-bottom">
                  <span className={`ledger-card-amount ${entry.type === "INCOME" ? "amount-income" : "amount-expense"}`}>
                    {entry.type === "INCOME" ? "+" : "−"} {formatCurrency(entry.amount)}
                  </span>
                  <span className="ledger-card-date">
                    {new Date(entry.date).toLocaleDateString("es-AR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default LedgerPage;
