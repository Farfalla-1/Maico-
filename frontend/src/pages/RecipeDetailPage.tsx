import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRecipe, Recipe } from "../services/api";

const UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  G: "g",
  L: "L",
  ML: "ml",
  UNIT: "Unidad",
};

function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getRecipe(Number(id));
        setRecipe(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load recipe");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!recipe) return null;

  return (
    <div className="recipe-detail">
      <button className="btn-back" onClick={() => navigate("/recipes")}>
        ← Volver a recetas
      </button>

      {recipe.image && (
        <div className="recipe-detail-image">
          <img src={recipe.image} alt={recipe.name} />
        </div>
      )}

      <div className="recipe-detail-header">
        <h1>{recipe.name}</h1>
        <button className="btn-primary" onClick={() => navigate(`/recipes/${recipe.id}/edit`)}>
          Editar
        </button>
      </div>

      {recipe.description && (
        <p className="recipe-detail-desc">{recipe.description}</p>
      )}

      <div className="recipe-detail-meta">
        <span>Rinde: {recipe.yield} {recipe.yieldUnit}</span>
      </div>

      <section className="recipe-section">
        <h2>Ingredientes</h2>
        <div className="ingredient-tags">
          {recipe.ingredients.map((ri) => (
            <span key={ri.id} className="ingredient-tag">
              <span className="ingredient-tag-qty">
                {Number(ri.quantity)} {UNIT_LABELS[ri.ingredient.unit] || ri.ingredient.unit}
              </span>
              {ri.ingredient.name}
            </span>
          ))}
        </div>
      </section>

      <section className="recipe-section">
        <h2>Preparación</h2>
        <ol className="recipe-steps-list">
          {recipe.steps.map((step) => (
            <li key={step.id}>
              <div className="step-number">Paso {step.stepNumber}</div>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export default RecipeDetailPage;
