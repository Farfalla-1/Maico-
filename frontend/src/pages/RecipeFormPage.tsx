import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getRecipe,
  getIngredients,
  createRecipe,
  updateRecipe,
  uploadRecipeImage,
  Ingredient,
} from "../services/api";

interface StepForm {
  description: string;
}

interface IngredientForm {
  ingredientId: number;
  quantity: string;
}

function RecipeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = id !== undefined && id !== "new";

  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [recipeYield, setRecipeYield] = useState("");
  const [yieldUnit, setYieldUnit] = useState("unidades");
  const [ingredients, setIngredients] = useState<IngredientForm[]>([
    { ingredientId: 0, quantity: "" },
  ]);
  const [steps, setSteps] = useState<StepForm[]>([{ description: "" }]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const ingredientsData = await getIngredients();
        setAllIngredients(ingredientsData);

        if (isEditing) {
          const recipe = await getRecipe(Number(id));
          setName(recipe.name);
          setDescription(recipe.description || "");
          setImage(recipe.image);
          setRecipeYield(String(recipe.yield));
          setYieldUnit(recipe.yieldUnit);
          setIngredients(
            recipe.ingredients.map((ri) => ({
              ingredientId: ri.ingredient.id,
              quantity: String(Number(ri.quantity)),
            }))
          );
          setSteps(
            recipe.steps.map((s) => ({ description: s.description }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, isEditing]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const imageUrl = await uploadRecipeImage(file);
      setImage(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function addIngredient() {
    setIngredients([...ingredients, { ingredientId: 0, quantity: "" }]);
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function updateIngredientField(index: number, field: keyof IngredientForm, value: string | number) {
    const updated = [...ingredients];
    if (field === "ingredientId") {
      updated[index] = { ...updated[index], ingredientId: Number(value) };
    } else {
      updated[index] = { ...updated[index], quantity: String(value) };
    }
    setIngredients(updated);
  }

  function addStep() {
    setSteps([...steps, { description: "" }]);
  }

  function removeStep(index: number) {
    setSteps(steps.filter((_, i) => i !== index));
  }

  function updateStep(index: number, description: string) {
    const updated = [...steps];
    updated[index] = { description };
    setSteps(updated);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      name,
      description: description || undefined,
      image: image || undefined,
      yield: Number(recipeYield),
      yieldUnit,
      ingredients: ingredients
        .filter((ing) => ing.ingredientId > 0 && Number(ing.quantity) > 0)
        .map((ing) => ({
          ingredientId: ing.ingredientId,
          quantity: Number(ing.quantity),
        })),
      steps: steps
        .filter((s) => s.description.trim() !== "")
        .map((s, i) => ({
          stepNumber: i + 1,
          description: s.description.trim(),
        })),
    };

    if (payload.ingredients.length === 0) {
      setError("Agrega al menos un ingrediente");
      setSubmitting(false);
      return;
    }

    if (payload.steps.length === 0) {
      setError("Agrega al menos un paso");
      setSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await updateRecipe(Number(id), payload);
        navigate(`/recipes/${id}`);
      } else {
        const recipe = await createRecipe(payload);
        navigate(`/recipes/${recipe.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div>
      <button className="btn-back" onClick={() => navigate("/recipes")}>
        ← Volver a recetas
      </button>

      <h1>{isEditing ? "Editar receta" : "Nueva receta"}</h1>

      <form onSubmit={handleSubmit} className="recipe-form">
        {/* Basic info */}
        <div className="card form-card">
          <div className="form-group">
            <label htmlFor="recipe-name">Nombre</label>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Medialunas"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipe-desc">Descripción</label>
            <textarea
              id="recipe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción de la receta..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="recipe-image">Imagen</label>
            <input
              id="recipe-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            {uploading && <p className="upload-status">Subiendo imagen...</p>}
            {image && (
              <div className="image-preview">
                <img src={image} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="recipe-yield">Rendimiento</label>
              <input
                id="recipe-yield"
                type="number"
                min="1"
                value={recipeYield}
                onChange={(e) => setRecipeYield(e.target.value)}
                placeholder="12"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="recipe-yield-unit">Unidad de rendimiento</label>
              <input
                id="recipe-yield-unit"
                type="text"
                value={yieldUnit}
                onChange={(e) => setYieldUnit(e.target.value)}
                placeholder="unidades"
                required
              />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div className="card form-card">
          <h2>Ingredientes</h2>
          {ingredients.map((ing, index) => (
            <div key={index} className="form-row dynamic-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label>Ingrediente</label>
                <select
                  value={ing.ingredientId}
                  onChange={(e) => updateIngredientField(index, "ingredientId", e.target.value)}
                >
                  <option value={0}>Seleccionar...</option>
                  {allIngredients.map((ai) => (
                    <option key={ai.id} value={ai.id}>{ai.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={ing.quantity}
                  onChange={(e) => updateIngredientField(index, "quantity", e.target.value)}
                  placeholder="0"
                />
              </div>
              {ingredients.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeIngredient(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add" onClick={addIngredient}>
            + Agregar ingrediente
          </button>
        </div>

        {/* Steps */}
        <div className="card form-card">
          <h2>Pasos de preparación</h2>
          {steps.map((step, index) => (
            <div key={index} className="step-form-row">
              <span className="step-form-number">{index + 1}</span>
              <div className="form-group" style={{ flex: 1 }}>
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`Describir paso ${index + 1}...`}
                  rows={2}
                />
              </div>
              {steps.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeStep(index)}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn-add" onClick={addStep}>
            + Agregar paso
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear receta"}
        </button>
      </form>
    </div>
  );
}

export default RecipeFormPage;
