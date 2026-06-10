import { getDashboardData, type DashboardData } from "@/lib/notion";
import { TARGET_AMOUNT, TARGET_DATE } from "@/lib/config";
import { AutoRefresh } from "./auto-refresh";

export const dynamic = "force-dynamic";

function fmt(n: number) {
  return "₪" + Math.round(n).toLocaleString("he-IL");
}

function ProgressBar({ pct, danger }: { pct: number; danger?: boolean }) {
  const clamped = Math.min(100, pct);
  return (
    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${danger ? "bg-zinc-400" : "bg-white"}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function IncomeGoalSection({ ig }: { ig: DashboardData["incomeGoal"] }) {
  const overPaid = ig.actual > ig.target;
  const overAll  = ig.actualWithUnpaid > ig.target;
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm">
          יעד הכנסה החודש
          {ig.isUpcoming && (
            <span className="text-zinc-500 text-xs mr-2">— {ig.monthLabel}</span>
          )}
        </p>
        {!ig.isUpcoming && (
          <span className="text-xs text-zinc-500">{ig.monthLabel}</span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-end text-xs">
          <span className={overPaid ? "text-white" : "text-zinc-400"}>
            {fmt(ig.actual)} / {fmt(ig.target)}
            {overPaid && ` ✓ +${fmt(ig.actual - ig.target)}`}
          </span>
        </div>
        <ProgressBar pct={Math.min(100, ig.pct)} />
      </div>

      {ig.carryover !== 0 && (
        <div className="text-xs text-zinc-600 border-t border-zinc-800 pt-2">
          {ig.carryover > 0
            ? `גירעון מחודשים קודמים: +${fmt(ig.carryover)}`
            : `עודף מחודשים קודמים: −${fmt(Math.abs(ig.carryover))}`}
        </div>
      )}

      {!ig.isUpcoming && (
        <div className="text-xs text-zinc-600">
          יעד חודש הבא: {fmt(Math.max(0, ig.nextMonthTarget))}
        </div>
      )}
    </section>
  );
}

export default async function Dashboard() {
  const d = await getDashboardData();
  const budgetUsedPct =
    d.currentMonthBudget > 0
      ? (d.currentMonthTotalSpent / d.currentMonthBudget) * 100
      : 0;
  const withClosingsPct = Math.min(100, (d.withClosings / TARGET_AMOUNT) * 100);

  return (
    <main className="max-w-xl mx-auto px-5 py-8 space-y-8">
      <AutoRefresh intervalMs={60_000} />

      {/* ───── Header ───── */}
      <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-xl tracking-tight">דאשבורד פיננסי</h1>
        <span className="text-xs text-zinc-500">עודכן {d.updatedAt}</span>
      </header>

      {/* ───── Balance Cards ───── */}
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-2">כרגע בחשבון</p>
          <p className="text-2xl">{fmt(d.currentAccount)}</p>
          <p className="text-xs text-zinc-600 mt-2">
            +{fmt(d.totalIncome)} הכנסות | −{fmt(d.totalExpenses)} הוצאות
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <p className="text-xs text-zinc-500 mb-2">כולל סגירות</p>
          <p className="text-2xl">{fmt(d.withClosings)}</p>
          <p className="text-xs text-zinc-600 mt-2">
            {d.unpaidClosings.filter((c) => !c.isPartial).length} לא שולמו
            {d.unpaidClosings.some((c) => c.isPartial) && ` | ${d.unpaidClosings.filter((c) => c.isPartial).length} שולמו חלקית`}
          </p>
        </div>
      </section>

      {/* ───── Unpaid Closings Detail ───── */}
      {d.unpaidClosings.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-2">
          <p className="text-xs text-zinc-500 mb-3">סגירות פתוחות</p>
          {d.unpaidClosings.map((c, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span className="text-zinc-300">
                {c.name}
                {c.isPartial && <span className="text-zinc-500 text-xs mr-1"> (נשאר)</span>}
              </span>
              <span className="text-white">{fmt(c.amount)}</span>
            </div>
          ))}
          <div className="border-t border-zinc-800 pt-2 flex justify-between text-sm">
            <span className="text-zinc-500">סה&quot;כ</span>
            <span>{fmt(d.withClosings - d.currentAccount)}</span>
          </div>
        </section>
      )}

      {/* ───── Income Goal ───── */}
      <IncomeGoalSection ig={d.incomeGoal} />

      {/* ───── Goal Progress ───── */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm">יעד {fmt(TARGET_AMOUNT)}</p>
          <p className="text-xs text-zinc-500">עד {TARGET_DATE}</p>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500">כרגע בחשבון</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 shrink-0">{fmt(d.currentAccount)}</span>
            <div className="flex-1"><ProgressBar pct={d.goalPct} /></div>
            <span className="text-zinc-400 shrink-0">{fmt(TARGET_AMOUNT - d.currentAccount)}</span>
          </div>
        </div>
        <div className="space-y-1.5 pt-1 border-t border-zinc-800">
          <span className="text-xs text-zinc-500">כולל סגירות</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400 shrink-0">{fmt(d.withClosings)}</span>
            <div className="flex-1"><ProgressBar pct={withClosingsPct} /></div>
            <span className="text-zinc-400 shrink-0">{fmt(TARGET_AMOUNT - d.withClosings)}</span>
          </div>
        </div>
      </section>

      {/* ───── Budget ───── */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base">תקציב — {d.currentMonthLabel}</h2>
          {!d.isBudgetActive && (
            <span className="text-xs text-zinc-500">מעקב מתחיל ביוני 2026</span>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">
              {fmt(d.currentMonthTotalSpent)} מתוך {fmt(d.currentMonthBudget)}
            </span>
            {d.rollover > 0 && (
              <span className="text-xs text-zinc-500">+ {fmt(d.rollover)} גלגול</span>
            )}
          </div>
          <ProgressBar pct={budgetUsedPct} danger={budgetUsedPct > 90} />
          <p className="text-xs text-zinc-600">
            נותר {fmt(d.currentMonthBudget - d.currentMonthTotalSpent)} החודש
          </p>
        </div>

        <div className="space-y-3">
          {d.categories.map((cat) => {
            const pct =
              cat.budget > 0
                ? (cat.spent / cat.budget) * 100
                : cat.spent > 0
                ? 100
                : 0;
            const over = cat.budget > 0 && cat.spent > cat.budget;
            return (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-300">{cat.name}</span>
                  <span className={`text-xs ${over ? "text-zinc-400" : "text-zinc-500"}`}>
                    {fmt(cat.spent)}
                    {cat.budget > 0 ? ` / ${fmt(cat.budget)}` : ""}
                    {over ? " ⚠" : ""}
                  </span>
                </div>
                <ProgressBar pct={pct} danger={over} />
              </div>
            );
          })}
        </div>
      </section>

      <footer className="text-center text-xs text-zinc-700 pb-4">
        נתונים מ-Notion · ₪ שקל חדש
      </footer>
    </main>
  );
}
