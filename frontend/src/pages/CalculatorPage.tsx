import { useState, useEffect, useCallback } from "react";
import {
  getRecipes,
  calculateCost,
  Recipe,
  CostResult,
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

  useEffect(() => {
    async function loadRecipes() {
      try {
        const data = await getRecipes();
        setRecipes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipes");
      } finally {
        setLoadingRecipes(false);
      }
    }
    loadRecipes();
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

  if (loadingRecipes) return <p>Cargando...</p>;

  return (
    <div>
      <h1>Calculadora de costos</h1>
      <p className="page-subtitle">
        Seleccioná una receta para calcular su costo de producción
      </p>

      {error && <p className="error-message">{error}</p>}

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
        <p className="empty-state">No hay recetas cargadas. Creá una receta primero.</p>
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
            </div>
          </div>
        </div>
      )}

      {loading && <p className="calc-loading">Calculando...</p>}
    </div>
  );
}

export default CalculatorPage;
