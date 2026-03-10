import { useState, useEffect, useCallback } from "react";
import {
  getRecipes,
  calculateCost,
  getFixedCosts,
  createFixedCost,
  updateFixedCost,
  deleteFixedCost,
  Recipe,
  CostResult,
  FixedCost,
} from "../services/api";

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UNIT: "Unidad",
};

function CalculatorPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [margin, setMargin] = useState(30);
  const [result, setResult] = useState<CostResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fixed costs state
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [showFixedCosts, setShowFixedCosts] = useState(false);
  const [newFcName, setNewFcName] = useState("");
  const [newFcAmount, setNewFcAmount] = useState("");
  const [editingFcId, setEditingFcId] = useState<number | null>(null);
  const [editFcName, setEditFcName] = useState("");
  const [editFcAmount, setEditFcAmount] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [recipesData, fcData] = await Promise.all([
          getRecipes(),
          getFixedCosts(),
        ]);
        setRecipes(recipesData);
        setFixedCosts(fcData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoadingRecipes(false);
      }
    }
    loadData();
  }, []);

  const calculate = useCallback(async (recipeId: number, marginPercent: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculateCost(recipeId, marginPercent);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate cost");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleRecipeSelect(recipeId: number) {
    setSelectedRecipeId(recipeId);
    calculate(recipeId, margin);
  }

  function handleMarginChange(newMargin: number) {
    setMargin(newMargin);
    if (selectedRecipeId) {
      calculate(selectedRecipeId, newMargin);
    }
  }

  async function handleAddFixedCost() {
    if (!newFcName.trim() || !newFcAmount) return;
    try {
      const fc = await createFixedCost({
        name: newFcName.trim(),
        amount: Number(newFcAmount),
      });
      setFixedCosts([...fixedCosts, fc]);
      setNewFcName("");
      setNewFcAmount("");
      if (selectedRecipeId) calculate(selectedRecipeId, margin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create fixed cost");
    }
  }

  async function handleUpdateFixedCost(id: number) {
    if (!editFcName.trim() || !editFcAmount) return;
    try {
      const updated = await updateFixedCost(id, {
        name: editFcName.trim(),
        amount: Number(editFcAmount),
      });
      setFixedCosts(fixedCosts.map((fc) => (fc.id === id ? updated : fc)));
      setEditingFcId(null);
      if (selectedRecipeId) calculate(selectedRecipeId, margin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update fixed cost");
    }
  }

  async function handleDeleteFixedCost(id: number) {
    try {
      await deleteFixedCost(id);
      setFixedCosts(fixedCosts.filter((fc) => fc.id !== id));
      if (selectedRecipeId) calculate(selectedRecipeId, margin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete fixed cost");
    }
  }

  function startEditing(fc: FixedCost) {
    setEditingFcId(fc.id);
    setEditFcName(fc.name);
    setEditFcAmount(String(Number(fc.amount)));
  }

  if (loadingRecipes) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Calculadora de costos</h1>
      <p className="page-subtitle">
        Seleccion&aacute; una receta para calcular su costo de producci&oacute;n
      </p>

      {error && <p className="error-message">{error}</p>}

      {/* Fixed costs management */}
      <div className="card fixed-costs-card">
        <div className="fixed-costs-header">
          <h2>Gastos fijos</h2>
          <button
            className="btn-toggle"
            onClick={() => setShowFixedCosts(!showFixedCosts)}
          >
            {showFixedCosts ? "Ocultar" : "Editar"}
          </button>
        </div>

        {fixedCosts.length > 0 && !showFixedCosts && (
          <p className="fixed-costs-summary">
            {fixedCosts.length} gasto{fixedCosts.length !== 1 ? "s" : ""} fijo{fixedCosts.length !== 1 ? "s" : ""} — Total: $
            {fixedCosts.reduce((sum, fc) => sum + Number(fc.amount), 0).toFixed(2)}
          </p>
        )}

        {showFixedCosts && (
          <div className="fixed-costs-list">
            {fixedCosts.map((fc) => (
              <div key={fc.id} className="fixed-cost-row">
                {editingFcId === fc.id ? (
                  <>
                    <input
                      type="text"
                      value={editFcName}
                      onChange={(e) => setEditFcName(e.target.value)}
                      className="fixed-cost-input-name"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editFcAmount}
                      onChange={(e) => setEditFcAmount(e.target.value)}
                      className="fixed-cost-input-amount"
                    />
                    <button className="btn-save-sm" onClick={() => handleUpdateFixedCost(fc.id)}>
                      Guardar
                    </button>
                    <button className="btn-cancel-sm" onClick={() => setEditingFcId(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="fixed-cost-name">{fc.name}</span>
                    <span className="fixed-cost-amount">${Number(fc.amount).toFixed(2)}</span>
                    <button className="btn-edit-sm" onClick={() => startEditing(fc)}>
                      Editar
                    </button>
                    <button className="btn-remove" onClick={() => handleDeleteFixedCost(fc.id)}>
                      ✕
                    </button>
                  </>
                )}
              </div>
            ))}

            {/* Add new */}
            <div className="fixed-cost-row fixed-cost-add">
              <input
                type="text"
                placeholder="Nombre (ej: Gas, Luz)"
                value={newFcName}
                onChange={(e) => setNewFcName(e.target.value)}
                className="fixed-cost-input-name"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Monto"
                value={newFcAmount}
                onChange={(e) => setNewFcAmount(e.target.value)}
                className="fixed-cost-input-amount"
              />
              <button className="btn-add" onClick={handleAddFixedCost}>
                + Agregar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recipe selector */}
      <div className="calc-recipe-selector">
        {recipes.map((recipe) => (
          <button
            key={recipe.id}
            className={`calc-recipe-chip ${selectedRecipeId === recipe.id ? "active" : ""}`}
            onClick={() => handleRecipeSelect(recipe.id)}
          >
            {recipe.image && (
              <img src={recipe.image} alt={recipe.name} className="calc-recipe-chip-img" />
            )}
            <span>{recipe.name}</span>
          </button>
        ))}
      </div>

      {recipes.length === 0 && (
        <p className="empty-state">No hay recetas cargadas. Cre&aacute; una receta primero.</p>
      )}

      {result && (
        <div className="calc-results">
          {/* Margin slider */}
          <div className="calc-margin-card card">
            <label className="calc-margin-label">
              Margen de ganancia: <strong>{margin}%</strong>
            </label>
            <input
              type="range"
              min="0"
              max="200"
              value={margin}
              onChange={(e) => handleMarginChange(Number(e.target.value))}
              className="calc-slider"
            />
            <div className="calc-margin-range">
              <span>0%</span>
              <span>100%</span>
              <span>200%</span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="calc-summary">
            <div className="calc-summary-card">
              <span className="calc-summary-label">Ingredientes</span>
              <span className="calc-summary-value">${result.ingredientsCost.toFixed(2)}</span>
            </div>
            <div className="calc-summary-card">
              <span className="calc-summary-label">Gastos fijos</span>
              <span className="calc-summary-value">${result.fixedCostsTotal.toFixed(2)}</span>
            </div>
            <div className="calc-summary-card">
              <span className="calc-summary-label">Costo total</span>
              <span className="calc-summary-value">${result.totalCost.toFixed(2)}</span>
              <span className="calc-summary-sub">
                por {result.yield} {result.yieldUnit}
              </span>
            </div>
            <div className="calc-summary-card">
              <span className="calc-summary-label">Costo por unidad</span>
              <span className="calc-summary-value">${result.costPerUnit.toFixed(2)}</span>
              <span className="calc-summary-sub">por cada {result.yieldUnit.replace(/s$/, "")}</span>
            </div>
            <div className="calc-summary-card highlight">
              <span className="calc-summary-label">Precio de venta sugerido</span>
              <span className="calc-summary-value">${result.suggestedPrice.toFixed(2)}</span>
              <span className="calc-summary-sub">con {margin}% de margen</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="card">
            <h2 className="calc-breakdown-title">Desglose de costos</h2>
            <div className="calc-breakdown">
              {result.breakdown.map((item, index) => {
                const percentage = result.totalCost > 0
                  ? (item.subtotal / result.totalCost) * 100
                  : 0;
                return (
                  <div key={index} className="calc-breakdown-row">
                    <div className="calc-breakdown-info">
                      <span className="calc-breakdown-name">{item.ingredientName}</span>
                      <span className="calc-breakdown-detail">
                        {item.quantity} {UNIT_LABELS[item.unit] || item.unit} × ${item.unitPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="calc-breakdown-bar-container">
                      <div
                        className="calc-breakdown-bar"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="calc-breakdown-subtotal">${item.subtotal.toFixed(2)}</span>
                  </div>
                );
              })}

              {/* Fixed costs in breakdown */}
              {result.fixedCosts.map((fc, index) => {
                const percentage = result.totalCost > 0
                  ? (fc.amount / result.totalCost) * 100
                  : 0;
                return (
                  <div key={`fc-${index}`} className="calc-breakdown-row">
                    <div className="calc-breakdown-info">
                      <span className="calc-breakdown-name">{fc.name}</span>
                      <span className="calc-breakdown-detail">Gasto fijo</span>
                    </div>
                    <div className="calc-breakdown-bar-container">
                      <div
                        className="calc-breakdown-bar fixed-cost-bar"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="calc-breakdown-subtotal">${fc.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {loading && <p className="calc-loading">Calculando...</p>}
    </div>
  );
}

export default CalculatorPage;
