// Category constants and helpers
// CENTRALIZED - import from here instead of defining locally

export const CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "household", "snack", "drinks"];

// Categories that can be used as meal ingredients (excludes household items)
export const EDIBLE_CATEGORIES = ["vegetable", "herbs", "fruit", "grains", "meat", "dairy", "snack", "drinks"];
export const NON_EDIBLE_CATEGORIES = ["household"];

// Helper to check if an item can be used in meals
export const isEdible = (item) => !NON_EDIBLE_CATEGORIES.includes(item?.category);

// Helper to check if a category is edible
export const isCategoryEdible = (category) => !NON_EDIBLE_CATEGORIES.includes(category);

export const CATEGORY_COLORS = {
  vegetable: "#228B22",
  herbs: "#8B7355",
  fruit: "#9ACD32",
  grains: "#DAA520",
  meat: "#F08080",
  dairy: "#FFFAF0",
  household: "#ADD8E6",
  drinks: "#BDB76B",
  snack: "#FF6347",
  other: "#ddd",
};

export const STORAGE_LOCATIONS = ["counter", "pantry", "fridge", "freezer", "closet"];

export const STORAGE_COLORS = {
  counter: "#f5deb3",
  pantry: "#d2b48c",
  fridge: "#add8e6",
  freezer: "#b0e0e6",
  closet: "#dda0dd",
};

// Dish/Meal related constants
export const DISH_TYPE_LABELS = {
  main: "🍽️ Main Dish",
  side: "🥗 Side Dish",
  dessert: "🍰 Dessert",
};

export const MEAL_CATEGORY_LABELS = {
  breakfast: "🌅 Breakfast",
  lunch: "☀️ Lunch",
  dinner: "🌙 Dinner",
  snack: "🍿 Snack",
};

export const STORAGE_OPTIONS = [
  { value: "none", label: "No leftovers" },
  { value: "pint", label: "Pint" },
  { value: "quart", label: "Quart" },
  { value: "half_gallon", label: "Half gallon" },
  { value: "gallon", label: "Gallon" },
];

export const STORAGE_LOCATION_OPTIONS = [
  { value: "fridge", label: "Fridge" },
  { value: "freezer", label: "Freezer" },
  { value: "counter", label: "Counter" },
];

export const DISH_TYPE_OPTIONS = [
  { value: "main", label: "🍽️ Main Dish" },
  { value: "side", label: "🥗 Side Dish" },
  { value: "dessert", label: "🍰 Dessert" },
];

export const MEAL_CATEGORY_OPTIONS = [
  { value: "breakfast", label: "🌅 Breakfast" },
  { value: "lunch", label: "☀️ Lunch" },
  { value: "dinner", label: "🌙 Dinner" },
  { value: "snack", label: "🍿 Snack" },
];
