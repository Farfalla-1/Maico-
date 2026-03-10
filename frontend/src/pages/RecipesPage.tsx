import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRecipes, deleteRecipe, Recipe } from "../services/api";

function RecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRecipes() {
    try {
      setLoading(true);
      const data = await getRecipes();
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  async function handleDelete(e: React.MouseEvent, recipe: Recipe) {
    e.stopPropagation();
    if (!confirm(`¿Eliminar "${recipe.name}"?`)) return;
    try {
      await deleteRecipe(recipe.id);
      await loadRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe");
    }
  }

  if (loading) return <p>Cargando...</p>;
  if (error) return <p className="error-message">{error}</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Recetas</h1>
        <button className="btn-primary" onClick={() => navigate("/recipes/new")}>
          Nueva receta
        </button>
      </div>

      {recipes.length === 0 ? (
        <p className="empty-state">No hay recetas cargadas.</p>
      ) : (
        <div className="recipe-grid">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-card"
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <div className="recipe-card-image">
                {recipe.image ? (
                  <img src={recipe.image} alt={recipe.name} />
                ) : (
                  <div className="recipe-card-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="recipe-card-body">
                <h3>{recipe.name}</h3>
                {recipe.description && (
                  <p className="recipe-card-desc">{recipe.description}</p>
                )}
                <div className="recipe-card-meta">
                  <span>Rinde: {recipe.yield} {recipe.yieldUnit}</span>
                </div>
              </div>
              <button
                className="btn-danger-small recipe-card-delete"
                onClick={(e) => handleDelete(e, recipe)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RecipesPage;
