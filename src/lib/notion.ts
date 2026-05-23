import { Client } from "@notionhq/client";
import {
  BASE_AMOUNT,
  BUDGET_START,
  CATEGORY_BUDGETS,
  DASHBOARD_START,
  DB_IDS,
  INCOME_GOAL_START,
  MONTHLY_BUDGET,
  MONTHLY_INCOME_TARGET,
  TARGET_AMOUNT,
} from "./config";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

interface ExpenseRow {
  amount: number;
  date: string;
  categoryId: string | null;
}

interface PaymentRow {
  amount: number;
  date: string;
}

interface ClosingRow {
  amount: number;
  name: string;
}

interface ClosingDateRow {
  amount: number;
  date: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryAll(dbId: string, filter?: any): Promise<any[]> {
  const results = [];
  let cursor: string | undefined;
  do {
    const res = await notion.databases.query({
      database_id: dbId,
      filter,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...res.results);
    cursor = res.next_cursor ?? undefined;
  } while (cursor);
  return results;
}

async function fetchPayments(startDate: string): Promise<PaymentRow[]> {
  const rows = await queryAll(DB_IDS.PAYMENTS, {
    property: "תאריך כניסה",
    date: { on_or_after: startDate },
  });
  return rows.map((r) => ({
    amount: r.properties["סכום שנכנס"]?.number ?? 0,
    date: r.properties["תאריך כניסה"]?.date?.start ?? "",
  }));
}

async function fetchExpenses(startDate: string, endDate?: string): Promise<ExpenseRow[]> {
  const filter = endDate
    ? {
        and: [
          { property: "Date", date: { on_or_after: startDate } },
          { property: "Date", date: { on_or_before: endDate } },
        ],
      }
    : { property: "Date", date: { on_or_after: startDate } };

  const rows = await queryAll(DB_IDS.EXPENSES, filter);
  return rows.map((r) => ({
    amount: r.properties["Amount"]?.number ?? 0,
    date: r.properties["Date"]?.date?.start ?? "",
    categoryId: r.properties["Category"]?.relation?.[0]?.id ?? null,
  }));
}

async function fetchAllClosingsFromDate(startDate: string): Promise<ClosingDateRow[]> {
  const rows = await queryAll(DB_IDS.CLOSINGS, {
    property: "תאריך סגירה",
    date: { on_or_after: startDate },
  });
  return rows.map((r) => ({
    amount: r.properties["סכום שנסגר"]?.number ?? 0,
    date: r.properties["תאריך סגירה"]?.date?.start ?? "",
    isPaid: r.properties["תשלום"]?.status?.name === "שולם",
  }));
}

async function fetchUnpaidClosings(): Promise<ClosingRow[]> {
  const rows = await queryAll(DB_IDS.CLOSINGS, {
    property: "תשלום",
    status: { equals: "לא שולם" },
  });
  return rows.map((r) => ({
    amount: r.properties["סכום שנסגר"]?.number ?? 0,
    name: r.properties["Name"]?.title?.[0]?.plain_text ?? "",
  }));
}

function calcRollover(allBudgetExpenses: ExpenseRow[], currentMonthStart: Date): number {
  if (currentMonthStart <= BUDGET_START) return 0;

  let rollover = 0;
  let month = new Date(BUDGET_START);

  while (month < currentMonthStart) {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const spent = allBudgetExpenses
      .filter((e) => {
        if (!e.date) return false;
        const d = new Date(e.date);
        return d >= month && d <= monthEnd;
      })
      .reduce((s, e) => s + e.amount, 0);

    const budget = MONTHLY_BUDGET + rollover;
    rollover = Math.max(0, budget - spent);
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  }

  return rollover;
}

function toISODate(d: Date) {
  return d.toISOString().split("T")[0];
}

interface IncomeGoal {
  target: number;
  actual: number;          // paid closings only
  actualWithUnpaid: number; // paid + unpaid closings
  pct: number;
  pctWithUnpaid: number;
  carryover: number;
  nextMonthTarget: number;
  monthLabel: string;
  isUpcoming: boolean;
}

function calcIncomeGoal(allClosings: ClosingDateRow[], currentMonthStart: Date): IncomeGoal {
  const isUpcoming = currentMonthStart < INCOME_GOAL_START;

  // The display month: if before June, show June as upcoming
  const displayMonth = isUpcoming ? new Date(INCOME_GOAL_START) : currentMonthStart;

  // Walk from June through end of PREVIOUS month to accumulate carryover
  let carryover = 0;
  let month = new Date(INCOME_GOAL_START);
  const walkUntil = isUpcoming ? displayMonth : currentMonthStart;

  while (month < walkUntil) {
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const monthTotal = allClosings
      .filter((c) => {
        if (!c.date) return false;
        const d = new Date(c.date);
        return d >= month && d <= monthEnd;
      })
      .reduce((s, c) => s + c.amount, 0);

    const monthTarget = MONTHLY_INCOME_TARGET + carryover;
    carryover = monthTarget - monthTotal; // positive = deficit, negative = surplus
    month = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  }

  const target = MONTHLY_INCOME_TARGET + carryover;

  // Current (or upcoming) month's closings
  // When upcoming: count closings from DASHBOARD_START (May 23) through end of June
  const displayMonthEnd = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 0);
  const goalStartDate = new Date(DASHBOARD_START);

  const displayClosings = allClosings.filter((c) => {
    if (!c.date) return false;
    const d = new Date(c.date);
    const from = isUpcoming ? goalStartDate : displayMonth;
    return d >= from && d <= displayMonthEnd;
  });

  const actual = displayClosings.reduce((s, c) => s + c.amount, 0);

  const actualWithUnpaid = actual;

  const pct = target > 0 ? (actual / target) * 100 : 0;
  const pctWithUnpaid = pct;

  // Carryover based on total (paid + unpaid) for month walk
  const afterThisMonth = target - actualWithUnpaid;
  const nextMonthTarget = MONTHLY_INCOME_TARGET + afterThisMonth;

  const monthLabel = displayMonth.toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

  return { target, actual, actualWithUnpaid, pct, pctWithUnpaid, carryover, nextMonthTarget, monthLabel, isUpcoming };
}

export interface DashboardData {
  currentAccount: number;
  withClosings: number;
  totalIncome: number;
  totalExpenses: number;
  unpaidClosings: ClosingRow[];
  categories: Array<{ name: string; budget: number; spent: number; id: string }>;
  currentMonthBudget: number;
  rollover: number;
  currentMonthTotalSpent: number;
  goalPct: number;
  remainingToGoal: number;
  currentMonthLabel: string;
  isBudgetActive: boolean;
  incomeGoal: IncomeGoal;
  updatedAt: string;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const isBudgetActive = currentMonthStart >= BUDGET_START;

  // Budget display month: show BUDGET_START month when we're before it
  const budgetMonthStart = currentMonthStart >= BUDGET_START ? currentMonthStart : BUDGET_START;
  const budgetMonthEnd = new Date(budgetMonthStart.getFullYear(), budgetMonthStart.getMonth() + 1, 0);

  const [payments, expenses, unpaidClosings, allBudgetExpenses, allGoalClosings] = await Promise.all([
    fetchPayments(DASHBOARD_START),
    fetchExpenses("2026-06-01"),        // expenses only from June 1
    fetchUnpaidClosings(),
    isBudgetActive
      ? fetchExpenses("2026-06-01", toISODate(currentMonthEnd))
      : Promise.resolve([] as ExpenseRow[]),
    fetchAllClosingsFromDate(DASHBOARD_START),  // closings from May 23 count toward goal
  ]);

  const totalIncome = payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const currentAccount = BASE_AMOUNT + totalIncome - totalExpenses;
  const totalUnpaid = unpaidClosings.reduce((s, c) => s + c.amount, 0);
  const withClosings = currentAccount + totalUnpaid;

  const rollover = calcRollover(allBudgetExpenses, currentMonthStart);
  const currentMonthBudget = MONTHLY_BUDGET + rollover;

  const currentMonthExpenses = await fetchExpenses(
    toISODate(budgetMonthStart),
    toISODate(budgetMonthEnd)
  );

  const spendingById: Record<string, number> = {};
  for (const e of currentMonthExpenses) {
    if (e.categoryId) spendingById[e.categoryId] = (spendingById[e.categoryId] ?? 0) + e.amount;
  }

  const categories = CATEGORY_BUDGETS.map((c) => ({
    ...c,
    spent: spendingById[c.id] ?? 0,
  }));

  const currentMonthTotalSpent = currentMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const goalPct = Math.min(100, (currentAccount / TARGET_AMOUNT) * 100);
  const remainingToGoal = Math.max(0, TARGET_AMOUNT - currentAccount);
  const incomeGoal = calcIncomeGoal(allGoalClosings, currentMonthStart);

  const currentMonthLabel = budgetMonthStart.toLocaleDateString("he-IL", {
    month: "long",
    year: "numeric",
  });

  return {
    currentAccount,
    withClosings,
    totalIncome,
    totalExpenses,
    unpaidClosings,
    categories,
    currentMonthBudget,
    rollover,
    currentMonthTotalSpent,
    goalPct,
    remainingToGoal,
    currentMonthLabel,
    isBudgetActive,
    incomeGoal,
    updatedAt: now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
  };
}
