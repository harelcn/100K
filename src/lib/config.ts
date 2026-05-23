export const BASE_AMOUNT = 20_000;
export const MONTHLY_BUDGET = 3_500;
export const TARGET_AMOUNT = 100_000;
export const TARGET_DATE = "30 בספטמבר 2026";
export const DASHBOARD_START = "2026-05-23";
export const BUDGET_START = new Date(2026, 5, 1); // June 2026
export const INCOME_GOAL_START = new Date(2026, 5, 1); // June 2026
export const INCOME_GOAL_END = new Date(2026, 8, 30); // September 2026
export const MONTHLY_INCOME_TARGET = 15_000;

export const DB_IDS = {
  PAYMENTS: "2f97fd3b-679b-8067-8f5f-cd38c04bb7b8",
  EXPENSES: "2827fd3b-679b-80fb-b609-e1182a8b8633",
  CLOSINGS: "2dd7fd3b-679b-8034-b8d9-df3e7f3d0c3d",
} as const;

export const CATEGORY_BUDGETS = [
  { name: "עבודה",          budget: 900,  id: "2a07fd3b-679b-80ce-a555-f47b8839a061" },
  { name: "אוכלים בחוץ",   budget: 300,  id: "2827fd3b-679b-8147-a6df-d78c9bcb369b" },
  { name: "תחבורה",         budget: 400,  id: "2827fd3b-679b-81bd-9888-d4e40bf26379" },
  { name: "קניות באינטרנט", budget: 0,    id: "2827fd3b-679b-8157-aa4b-df810e9a95dd" },
  { name: "בילויים",        budget: 150,  id: "2827fd3b-679b-8193-8690-e2bc627f4dd2" },
  { name: "מנויים",         budget: 700,  id: "2827fd3b-679b-815b-9f30-fbc84b20f359" },
  { name: "בריאות וכושר",  budget: 0,    id: "2827fd3b-679b-8116-8684-ef36069bc3c2" },
  { name: "חיסכון והשקעה", budget: 500,  id: "2827fd3b-679b-81ca-9d2a-fccc62d0b23c" },
  { name: "ביגוד",          budget: 300,  id: "2827fd3b-679b-80ba-bc5f-c19c88294b12" },
  { name: "טיפוח אישי",    budget: 150,  id: "2837fd3b-679b-808b-834a-ce3682fd44d1" },
  { name: "אישי",           budget: 100,  id: "28a7fd3b-679b-80f0-800c-ed2031e45e8e" },
] as const;

export type CategoryBudget = (typeof CATEGORY_BUDGETS)[number];
