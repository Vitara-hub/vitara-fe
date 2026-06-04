export interface NutritionMacros {
  protein: number;
  carbs: number;
  fat: number;
}

export function estimateNutritionMacros(calories: number): NutritionMacros {
  const safeCalories = Number.isFinite(calories) && calories > 0 ? calories : 0;

  return {
    protein: Math.round(safeCalories * 0.05),
    carbs: Math.round(safeCalories * 0.12),
    fat: Math.round(safeCalories * 0.03),
  };
}

export function hasNutritionMacros(macros: NutritionMacros): boolean {
  return macros.protein > 0 || macros.carbs > 0 || macros.fat > 0;
}
