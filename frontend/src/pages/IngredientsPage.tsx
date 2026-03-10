import { useState, useEffect, FormEvent } from "react";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
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

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Ingredientes</h1>
        <button className="btn-primary" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
          {showForm ? "Cancelar" : "Nuevo ingrediente"}
        </button>
      </div>

      {showForm && (
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
              <label htmlFor="ing-price">Precio por unidad ($)</label>
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

      {ingredients.length === 0 ? (
        <p className="empty-state">No hay ingredientes cargados.</p>
      ) : (
        <table className="data-table">
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
                <td>{ing.name}</td>
                <td>{UNIT_LABELS[ing.unit]}</td>
                <td>${Number(ing.price).toFixed(2)}</td>
                <td>{new Date(ing.updatedAt).toLocaleDateString("es-AR")}</td>
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
      )}
    </div>
  );
}

export default IngredientsPage;
