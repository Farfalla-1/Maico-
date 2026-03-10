const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const isAuthRoute = path.startsWith("/auth/login") || path.startsWith("/auth/refresh");

    if (response.status === 401 && !isAuthRoute && token) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      window.location.href = "/login?expired=1";
      throw new Error("Session expired");
    }

    const body = await response.json().catch(() => null);
    const message =
      body?.message ?? body?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Auth

export interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Users (admin only)

export interface User {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  createdAt: string;
}

interface UsersResponse {
  status: string;
  data: User[];
}

interface UserResponse {
  status: string;
  data: User;
}

export async function getUsers(): Promise<User[]> {
  const res = await apiFetch<UsersResponse>("/auth/users");
  return res.data;
}

export async function createUser(data: {
  email: string;
  password: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
}): Promise<User> {
  const res = await apiFetch<UserResponse>("/auth/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteUser(id: number): Promise<void> {
  await apiFetch<unknown>(`/auth/users/${id}`, { method: "DELETE" });
}

// Ingredients

export type Unit = "KG" | "G" | "L" | "ML" | "UNIT";

export interface Ingredient {
  id: number;
  name: string;
  unit: Unit;
  price: string;
  createdAt: string;
  updatedAt: string;
}

interface IngredientsResponse {
  status: string;
  data: Ingredient[];
}

interface IngredientResponse {
  status: string;
  data: Ingredient;
}

export async function getIngredients(): Promise<Ingredient[]> {
  const res = await apiFetch<IngredientsResponse>("/ingredients");
  return res.data;
}

export async function createIngredient(data: {
  name: string;
  unit: Unit;
  price: number;
}): Promise<Ingredient> {
  const res = await apiFetch<IngredientResponse>("/ingredients", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateIngredient(
  id: number,
  data: { name?: string; unit?: Unit; price?: number }
): Promise<Ingredient> {
  const res = await apiFetch<IngredientResponse>(`/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteIngredient(id: number): Promise<void> {
  await apiFetch<unknown>(`/ingredients/${id}`, { method: "DELETE" });
}

// Recipes

export interface RecipeStep {
  id: number;
  stepNumber: number;
  description: string;
}

export interface RecipeIngredient {
  id: number;
  quantity: string;
  ingredient: Ingredient;
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  yield: number;
  yieldUnit: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  createdAt: string;
  updatedAt: string;
}

interface RecipesResponse {
  status: string;
  data: Recipe[];
}

interface RecipeResponse {
  status: string;
  data: Recipe;
}

export async function getRecipes(): Promise<Recipe[]> {
  const res = await apiFetch<RecipesResponse>("/recipes");
  return res.data;
}

export async function getRecipe(id: number): Promise<Recipe> {
  const res = await apiFetch<RecipeResponse>(`/recipes/${id}`);
  return res.data;
}

export async function createRecipe(data: {
  name: string;
  description?: string;
  image?: string;
  yield: number;
  yieldUnit: string;
  ingredients: { ingredientId: number; quantity: number }[];
  steps: { stepNumber: number; description: string }[];
}): Promise<Recipe> {
  const res = await apiFetch<RecipeResponse>("/recipes", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateRecipe(
  id: number,
  data: {
    name?: string;
    description?: string;
    image?: string;
    yield?: number;
    yieldUnit?: string;
    ingredients?: { ingredientId: number; quantity: number }[];
    steps?: { stepNumber: number; description: string }[];
  }
): Promise<Recipe> {
  const res = await apiFetch<RecipeResponse>(`/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteRecipe(id: number): Promise<void> {
  await apiFetch<unknown>(`/recipes/${id}`, { method: "DELETE" });
}

export async function uploadRecipeImage(file: File): Promise<string> {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/recipes/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  const result = await response.json();
  return result.data.imageUrl;
}

// Calculator

export interface CostBreakdownItem {
  ingredientName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface CostResult {
  recipeName: string;
  yield: number;
  yieldUnit: string;
  totalCost: number;
  costPerUnit: number;
  marginPercent: number;
  suggestedPrice: number;
  breakdown: CostBreakdownItem[];
}

interface CostResponse {
  status: string;
  data: CostResult;
}

export async function calculateCost(
  recipeId: number,
  marginPercent: number
): Promise<CostResult> {
  const res = await apiFetch<CostResponse>("/calculator/calculate", {
    method: "POST",
    body: JSON.stringify({ recipeId, marginPercent }),
  });
  return res.data;
}
