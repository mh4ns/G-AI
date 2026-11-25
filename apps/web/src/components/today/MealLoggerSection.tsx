"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Trash2, Utensils } from "lucide-react";
import { api, ApiFoodItem, ApiMealLog, MealType } from "@/lib/api-client";

interface MacroSplit {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface MealLoggerSectionProps {
  isSignedIn: boolean;
  macroTarget: MacroSplit;
  meals: ApiMealLog[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  onMealLogged: (meal: ApiMealLog) => void;
  onMealDeleted: (mealId: number) => void;
  onError?: (message: string) => void;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Sáng" },
  { value: "lunch", label: "Trưa" },
  { value: "dinner", label: "Tối" },
  { value: "snack", label: "Ăn nhẹ" },
];

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Ăn nhẹ",
};

const GUEST_FALLBACK_FOODS: ApiFoodItem[] = [
  {
    id: -1,
    name: "Phở bò tái",
    canonical_name: "pho bo tai",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 450,
    calories_per_100g: 115,
    protein_g_100g: 7.8,
    carbs_g_100g: 13.5,
    fat_g_100g: 3.0,
    is_active: true,
    created_at: "",
  },
  {
    id: -2,
    name: "Cơm tấm sườn nướng",
    canonical_name: "com tam suon nuong",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 380,
    calories_per_100g: 182,
    protein_g_100g: 10.4,
    carbs_g_100g: 21.5,
    fat_g_100g: 6.0,
    is_active: true,
    created_at: "",
  },
  {
    id: -3,
    name: "Ức gà áp chảo (không da)",
    canonical_name: "uc ga ap chao (khong da)",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 150,
    calories_per_100g: 165,
    protein_g_100g: 31.0,
    carbs_g_100g: 0.0,
    fat_g_100g: 3.6,
    is_active: true,
    created_at: "",
  },
  {
    id: -4,
    name: "Cơm gạo lứt",
    canonical_name: "com gao lut",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 150,
    calories_per_100g: 112,
    protein_g_100g: 2.6,
    carbs_g_100g: 23.5,
    fat_g_100g: 0.9,
    is_active: true,
    created_at: "",
  },
  {
    id: -5,
    name: "Trứng gà luộc",
    canonical_name: "trung ga luoc",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 100,
    calories_per_100g: 155,
    protein_g_100g: 12.6,
    carbs_g_100g: 1.1,
    fat_g_100g: 10.6,
    is_active: true,
    created_at: "",
  },
  {
    id: -6,
    name: "Sữa chua Hy Lạp không đường",
    canonical_name: "sua chua hy lap khong duong",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 150,
    calories_per_100g: 59,
    protein_g_100g: 10.2,
    carbs_g_100g: 3.6,
    fat_g_100g: 0.4,
    is_active: true,
    created_at: "",
  },
  {
    id: -7,
    name: "Khoai lang luộc",
    canonical_name: "khoai lang luoc",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 150,
    calories_per_100g: 86,
    protein_g_100g: 1.6,
    carbs_g_100g: 20.1,
    fat_g_100g: 0.1,
    is_active: true,
    created_at: "",
  },
  {
    id: -8,
    name: "Cá hồi áp chảo",
    canonical_name: "ca hoi ap chao",
    brand: null,
    barcode: null,
    source: "curated",
    default_serving_g: 150,
    calories_per_100g: 208,
    protein_g_100g: 20.4,
    carbs_g_100g: 0.0,
    fat_g_100g: 13.4,
    is_active: true,
    created_at: "",
  },
];

function normalizeText(value: string): string {
  return value
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function MealLoggerSection({
  isSignedIn,
  macroTarget,
  meals,
  totalCalories,
  totalProteinG,
  totalCarbsG,
  totalFatG,
  onMealLogged,
  onMealDeleted,
  onError,
}: MealLoggerSectionProps) {
  const [query, setQuery] = useState("");
  const [foods, setFoods] = useState<ApiFoodItem[]>(GUEST_FALLBACK_FOODS);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<ApiFoodItem | null>(null);
  const [servingGrams, setServingGrams] = useState<string>("150");
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    if (!isSignedIn) {
      const needle = normalizeText(trimmed);
      const filtered = needle
        ? GUEST_FALLBACK_FOODS.filter((f) => f.canonical_name.includes(needle))
        : GUEST_FALLBACK_FOODS;
      setFoods(filtered);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.nutrition.searchFoods(trimmed, 12);
        if (!cancelled) {
          setFoods(results);
          setLocalError(null);
        }
      } catch {
        if (!cancelled) {
          setLocalError("Không tải được danh sách món ăn.");
        }
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isSignedIn]);

  const handleSelectFood = (food: ApiFoodItem) => {
    setSelectedFood(food);
    setServingGrams(String(Math.round(food.default_serving_g)));
    setLocalError(null);
  };

  const parsedGrams = Number(servingGrams);
  const validGrams = Number.isFinite(parsedGrams) && parsedGrams > 0 && parsedGrams <= 5000;
  const previewFactor = selectedFood && validGrams ? parsedGrams / 100 : 0;
  const previewCalories = selectedFood ? Math.round(selectedFood.calories_per_100g * previewFactor) : 0;
  const previewProtein = selectedFood ? Math.round(selectedFood.protein_g_100g * previewFactor * 10) / 10 : 0;

  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood || !validGrams) {
      setLocalError("Vui lòng chọn món ăn và nhập khối lượng hợp lệ (gram).");
      return;
    }

    setLocalError(null);
    if (!isSignedIn) {
      const factor = parsedGrams / 100;
      const nowIso = new Date().toISOString();
      const guestMeal: ApiMealLog = {
        id: -Date.now(),
        food_item_id: selectedFood.id,
        meal_type: mealType,
        food_name_snapshot: selectedFood.name,
        serving_grams: parsedGrams,
        calories: Math.round(selectedFood.calories_per_100g * factor),
        protein_g: Math.round(selectedFood.protein_g_100g * factor * 10) / 10,
        carbs_g: Math.round(selectedFood.carbs_g_100g * factor * 10) / 10,
        fat_g: Math.round(selectedFood.fat_g_100g * factor * 10) / 10,
        local_date: nowIso.slice(0, 10),
        logged_at: nowIso,
        created_at: nowIso,
      };
      onMealLogged(guestMeal);
      setSelectedFood(null);
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.nutrition.logMeal({
        food_item_id: selectedFood.id,
        meal_type: mealType,
        serving_grams: parsedGrams,
      });
      onMealLogged(created);
      setSelectedFood(null);
    } catch {
      const msg = "Chưa ghi nhận được bữa ăn. Vui lòng thử lại.";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (mealId: number) => {
    if (!isSignedIn) {
      onMealDeleted(mealId);
      return;
    }
    setDeletingId(mealId);
    setLocalError(null);
    try {
      await api.nutrition.deleteMeal(mealId);
      onMealDeleted(mealId);
    } catch {
      const msg = "Chưa xóa được bữa ăn khỏi máy chủ.";
      setLocalError(msg);
      onError?.(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const macros = [
    { label: "Đạm (Protein)", current: totalProteinG, target: Math.max(1, macroTarget.proteinG), unit: "g" },
    { label: "Tinh bột (Carbs)", current: totalCarbsG, target: Math.max(1, macroTarget.carbsG), unit: "g" },
    { label: "Chất béo (Fat)", current: totalFatG, target: Math.max(1, macroTarget.fatG), unit: "g" },
  ];

  return (
    <section aria-labelledby="nutrition-title" className="border-t border-line pb-12 pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id="nutrition-title" className="text-lg font-semibold text-ink">
            Nhật ký bữa ăn &amp; Macro
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tìm món ăn quen thuộc theo gram để tính calo và tự động cộng vào ngân sách hôm nay.
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink">
          {totalCalories.toLocaleString("vi-VN")} kcal từ bữa ăn
        </span>
      </div>

      {/* Macro progress bars */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {macros.map((m) => {
          const pct = Math.min(100, Math.round((m.current / m.target) * 100));
          const over = m.current > m.target * 1.1;
          return (
            <div key={m.label} className="rounded-xl border border-line bg-surface px-3.5 py-3">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-medium text-ink-muted">{m.label}</span>
                <span className={`font-semibold tabular-nums ${over ? "text-danger" : "text-ink"}`}>
                  {Math.round(m.current)} / {Math.round(m.target)}
                  {m.unit}
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={m.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-sunken"
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    over ? "bg-danger" : pct >= 85 ? "bg-positive" : "bg-ink"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and log meal */}
      <div className="mt-5 rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm món ăn (vd: pho bo, uc ga, com tam)..."
            aria-label="Tìm kiếm món ăn"
            className="h-11 w-full rounded-xl border border-line bg-page pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {searching ? (
            <span className="text-xs text-ink-muted">Đang tìm món ăn...</span>
          ) : foods.length === 0 ? (
            <span className="text-xs text-ink-muted">Không thấy món phù hợp. Thử từ khóa ngắn hơn.</span>
          ) : (
            foods.slice(0, 8).map((food) => {
              const active = selectedFood?.id === food.id;
              return (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => handleSelectFood(food)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "border-brand-text bg-brand/15 text-ink"
                      : "border-line bg-sunken/70 text-ink hover:bg-sunken"
                  }`}
                >
                  <span>{food.name}</span>
                  <span className="tabular-nums text-ink-muted">{food.calories_per_100g} kcal/100g</span>
                </button>
              );
            })
          )}
        </div>

        {selectedFood && (
          <form onSubmit={handleLogMeal} className="mt-4 border-t border-line pt-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1">
                <label htmlFor="meal-food-name" className="block text-xs font-medium text-ink-muted">
                  Món đã chọn
                </label>
                <p id="meal-food-name" className="mt-1 text-sm font-semibold text-ink">
                  {selectedFood.name}
                </p>
              </div>

              <div className="w-28">
                <label htmlFor="meal-grams" className="block text-xs font-medium text-ink-muted">
                  Khối lượng (g)
                </label>
                <input
                  id="meal-grams"
                  type="number"
                  min={1}
                  max={5000}
                  step="any"
                  value={servingGrams}
                  onChange={(e) => setServingGrams(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-page px-3 text-sm tabular-nums text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                />
              </div>

              <div className="w-32">
                <label htmlFor="meal-type" className="block text-xs font-medium text-ink-muted">
                  Bữa ăn
                </label>
                <select
                  id="meal-type"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType)}
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-page px-2.5 text-sm text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
                >
                  {MEAL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !validGrams}
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-brand-contrast transition-colors hover:bg-brand-soft disabled:opacity-60"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {submitting ? "Đang lưu..." : `Thêm (${previewCalories} kcal · ${previewProtein}g đạm)`}
              </button>
            </div>
          </form>
        )}

        {localError && (
          <p role="alert" className="mt-3 text-xs font-medium text-danger">
            {localError}
          </p>
        )}

        {/* Logged meals list */}
        {meals.length > 0 ? (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {meals.map((meal) => (
              <li key={meal.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{meal.food_name_snapshot}</span>
                    <span className="rounded-full bg-sunken px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                      {MEAL_TYPE_LABEL[meal.meal_type] ?? meal.meal_type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs tabular-nums text-ink-muted">
                    {Math.round(meal.serving_grams)}g · P {meal.protein_g}g · C {meal.carbs_g}g · F {meal.fat_g}g
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-ink">{meal.calories} kcal</span>
                  <button
                    type="button"
                    disabled={deletingId === meal.id}
                    onClick={() => handleDelete(meal.id)}
                    aria-label={`Xóa ${meal.food_name_snapshot}`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted">
            <Utensils className="h-4 w-4 shrink-0" aria-hidden />
            <span>Chưa có bữa ăn nào hôm nay. Chọn một món ở trên để ghi nhanh.</span>
          </div>
        )}
      </div>
    </section>
  );
}
