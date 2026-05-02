import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'jj-finance-tracker-v10';
const APP_THEME_COLOR = '#0f172a';
const JENNIFER_ANCHOR_DATE = new Date(2026, 3, 30);
const paycheckOrder = ['Robby #1', 'Jennifer #1', 'Robby #2', 'Jennifer #2', 'Jennifer #3'];
const tabOrder = ['bills', 'debt', 'expenses', 'dashboard', 'accounts'];

const paycheckColors = {
  'Robby #1': { bg: '#dbeafe', text: '#1e3a8a', border: '#93c5fd' },
  'Robby #2': { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' },
  'Jennifer #1': { bg: '#fef9c3', text: '#854d0e', border: '#fde047' },
  'Jennifer #2': { bg: '#ede9fe', text: '#6b21a8', border: '#c4b5fd' },
  'Jennifer #3': { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
};

const tabThemes = {
  bills: { tint: '#fff7ed', accent: '#ea580c', iconBg: '#ffedd5' },
  debt: { tint: '#fdf2f8', accent: '#be185d', iconBg: '#fce7f3' },
  expenses: { tint: '#fffbeb', accent: '#b45309', iconBg: '#fef3c7' },
  dashboard: { tint: '#f5f3ff', accent: '#6d28d9', iconBg: '#ede9fe' },
  accounts: { tint: '#f0fdfa', accent: '#0f766e', iconBg: '#ccfbf1' },
};

const expenseSortOrder = {
  'Robby #1': 1,
  'Jennifer #1': 2,
  'Robby #2': 3,
  'Jennifer #2': 4,
  'Jennifer #3': 5,
  '': 99,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const currency = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);
const fmtShortDate = (d) => (d ? d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }) : '—');
const toInputValue = (value) => (Number(value) === 0 ? '' : String(value));
const parseNumberInput = (value) => (value === '' ? 0 : Number(value));
const selectAllProps = {
  onFocus: (e) => e.target.select(),
  onClick: (e) => e.currentTarget.select(),
};

const makeIcon = (symbol) => ({ className = '' }) => (
  <span className={className} aria-hidden="true">
    {symbol}
  </span>
);

const AlertCircle = makeIcon('!');
const Bell = makeIcon('🔔');
const CalendarDays = makeIcon('📅');
const CarFront = makeIcon('🚗');
const Check = makeIcon('✓');
const ChevronLeft = makeIcon('‹');
const ChevronRight = makeIcon('›');
const CreditCard = makeIcon('💳');
const DollarSign = makeIcon('$');
const Download = makeIcon('⬇');
const Droplets = makeIcon('💧');
const Fuel = makeIcon('⛽');
const HandCoins = makeIcon('🪙');
const House = makeIcon('🏠');
const Landmark = makeIcon('🏦');
const Link = makeIcon('🔗');
const Pencil = makeIcon('✎');
const PiggyBank = makeIcon('🐖');
const Plus = makeIcon('+');
const Receipt = makeIcon('🧾');
const Shield = makeIcon('🛡');
const ShoppingCart = makeIcon('🛒');
const Smartphone = makeIcon('📱');
const Trash2 = makeIcon('🗑');
const Tv = makeIcon('📺');
const Upload = makeIcon('⬆');
const Wallet = makeIcon('👛');
const Wifi = makeIcon('📶');
const X = makeIcon('✕');
const Zap = makeIcon('⚡');

function createDefaultState() {
  return {
    currentMonth: new Date(2026, 3, 1).toISOString(),
    bills: [
      { id: uid(), name: 'Phone', dueDay: 8, amount: 85, status: 'Pending' },
      { id: uid(), name: 'Internet', dueDay: 24, amount: 60, status: 'Pending' },
      { id: uid(), name: 'Car Insurance', dueDay: 15, amount: 145, status: 'Pending' },
      { id: uid(), name: 'Rent', dueDay: 1, amount: 1200, status: 'Pending' },
    ],
    debts: [
      { id: uid(), name: 'Car Payment', dueDay: 1, minPayment: 405, interestRate: 5.9, balance: 11800, status: 'Pending' },
      { id: uid(), name: 'Car Payment', dueDay: 15, minPayment: 405, interestRate: 5.9, balance: 0, status: 'Pending' },
      { id: uid(), name: 'Credit Card', dueDay: 20, minPayment: 75, interestRate: 24.99, balance: 2100, status: 'Pending' },
      { id: uid(), name: 'Personal Loan', dueDay: 28, minPayment: 130, interestRate: 10.25, balance: 4800, status: 'Pending' },
    ],
    expenses: [
      { id: uid(), name: 'Gas', day: 15, amount: 80, assignedPaycheck: 'Robby #2' },
      { id: uid(), name: 'Tolls', day: 18, amount: 30, assignedPaycheck: 'Jennifer #2' },
      { id: uid(), name: 'Misc', day: 20, amount: 45, assignedPaycheck: '' },
    ],
    paycheckSettings: {
      'Robby #1': { baseIncome: 2462, extraIncome: 0, extraDebtActual: 0 },
      'Robby #2': { baseIncome: 2462, extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #1': { baseIncome: 1295, extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #2': { baseIncome: 1295, extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #3': { baseIncome: 1295, extraIncome: 0, extraDebtActual: 0 },
    },
    accounts: [
      { id: 'acct-robby', name: "Robby's Account", type: 'Checking', openingBalance: 0 },
      { id: 'acct-jennifer', name: "Jennifer's Account", type: 'Checking', openingBalance: 0 },
    ],
    paycheckAccountMap: {
      'Robby #1': 'acct-robby',
      'Robby #2': 'acct-robby',
      'Jennifer #1': 'acct-jennifer',
      'Jennifer #2': 'acct-jennifer',
      'Jennifer #3': 'acct-jennifer',
    },
    customPaychecks: [],
    history: [],
  };
}

function normalizeState(raw) {
  const fallback = createDefaultState();
  return {
    currentMonth: typeof raw?.currentMonth === 'string' ? raw.currentMonth : fallback.currentMonth,
    bills: Array.isArray(raw?.bills) ? raw.bills : fallback.bills,
    debts: Array.isArray(raw?.debts) ? raw.debts.map((d) => ({ ...d, status: d.status ?? 'Pending' })) : fallback.debts,
    expenses: Array.isArray(raw?.expenses) ? raw.expenses.map((e) => ({ ...e, day: e.day ?? 1 })) : fallback.expenses,
    paycheckSettings: raw?.paycheckSettings
      ? {
          'Robby #1': { ...fallback.paycheckSettings['Robby #1'], ...raw.paycheckSettings['Robby #1'] },
          'Robby #2': { ...fallback.paycheckSettings['Robby #2'], ...raw.paycheckSettings['Robby #2'] },
          'Jennifer #1': { ...fallback.paycheckSettings['Jennifer #1'], ...raw.paycheckSettings['Jennifer #1'] },
          'Jennifer #2': { ...fallback.paycheckSettings['Jennifer #2'], ...raw.paycheckSettings['Jennifer #2'] },
          'Jennifer #3': { ...fallback.paycheckSettings['Jennifer #3'], ...raw.paycheckSettings['Jennifer #3'] },
        }
      : fallback.paycheckSettings,
    accounts: Array.isArray(raw?.accounts) && raw.accounts.length ? raw.accounts : fallback.accounts,
    paycheckAccountMap: raw?.paycheckAccountMap ?? fallback.paycheckAccountMap,
    customPaychecks: Array.isArray(raw?.customPaychecks) ? raw.customPaychecks : [],
    history: Array.isArray(raw?.history) ? raw.history : [],
  };
}

function loadInitialState() {
  if (typeof window === 'undefined') return normalizeState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : normalizeState();
  } catch {
    return normalizeState();
  }
}

function getJenniferPaychecksForMonth(year, monthIndex) {
  const monthStart = new Date(year, monthIndex, 1);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  if (monthEnd < JENNIFER_ANCHOR_DATE) return [];

  const cursor = new Date(JENNIFER_ANCHOR_DATE);
  while (cursor < monthStart) cursor.setDate(cursor.getDate() + 14);

  const dates = [];
  while (cursor <= monthEnd) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 14);
  }
  return dates;
}

function buildPaychecks(month) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const jenniferChecks = getJenniferPaychecksForMonth(year, monthIndex);
  const dates = {
    'Robby #1': new Date(year, monthIndex, 1),
    'Robby #2': new Date(year, monthIndex, 15),
    'Jennifer #1': jenniferChecks[0] ?? null,
    'Jennifer #2': jenniferChecks[1] ?? null,
    'Jennifer #3': jenniferChecks[2] ?? null,
  };
  return { dates, hasThirdJennifer: jenniferChecks.length >= 3 };
}

function getRouteMonth(params) {
  const routeMonth = Number(params.get('month'));
  const routeYear = Number(params.get('year'));
  if (!Number.isInteger(routeMonth) || !Number.isInteger(routeYear)) return null;
  if (routeMonth < 1 || routeMonth > 12) return null;
  if (routeYear < 2000 || routeYear > 2100) return null;
  return new Date(routeYear, routeMonth - 1, 1);
}

function getAssignedCheckName(dueDay, month) {
  const { dates } = buildPaychecks(month);
  const ordered = Object.entries(dates)
    .filter(([, value]) => value)
    .map(([name, value]) => ({ name, day: value.getDate() }))
    .sort((a, b) => a.day - b.day);

  let best = ordered[0]?.name ?? 'Robby #1';
  let bestDay = ordered[0]?.day ?? 1;

  for (const item of ordered) {
    if (item.day <= dueDay && item.day >= bestDay) {
      best = item.name;
      bestDay = item.day;
    }
  }
  return best;
}

function getBillFlags(bill, currentMonth) {
  const today = new Date();
  const viewedMonthKey = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getTime();
  const actualMonthKey = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
  const isCurrentViewedMonth = viewedMonthKey === actualMonthKey;
  const isPastViewedMonth = viewedMonthKey < actualMonthKey;
  const todayDay = today.getDate();

  const isDueSoon =
    bill.status !== 'Paid' &&
    (isCurrentViewedMonth
      ? bill.dueDay >= todayDay && bill.dueDay <= Math.min(todayDay + 7, 31)
      : !isPastViewedMonth && bill.dueDay <= 7);

  const isOverdue = bill.status !== 'Paid' && (isPastViewedMonth || (isCurrentViewedMonth && bill.dueDay < todayDay));

  return { isDueSoon, isOverdue };
}

function filterBills(items, filter) {
  if (filter === 'Due Soon') return items.filter((item) => item.isDueSoon);
  if (filter === 'Overdue') return items.filter((item) => item.isOverdue);
  if (filter === 'Paid') return items.filter((item) => item.status === 'Paid');
  return items;
}

function AppButton({ children, variant = 'solid', size = 'md', className = '', type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50';
  const sizes = {
    icon: 'h-9 w-9',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-sm',
  };
  const variants = {
    solid: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
  };
  return (
    <button type={type} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function AppCard({ children, className = '', style }) {
  return <div className={`rounded-3xl border border-slate-300 bg-white shadow-sm ${className}`} style={style}>{children}</div>;
}

function AppCardHeader({ children, className = '' }) {
  return <div className={`p-4 pb-2 ${className}`}>{children}</div>;
}

function AppCardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

function AppBadge({ children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>;
}

function AppInput(props) {
  return <input className={`w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 ${props.className || ''}`} {...props} />;
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-3xl border border-slate-300 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="text-base font-semibold">{title}</div>
          <AppButton variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></AppButton>
        </div>
        <div className="p-4">{children}</div>
        {footer ? <div className="border-t border-slate-200 p-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function PaycheckPill({ paycheck }) {
  const colors = paycheckColors[paycheck];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: colors.bg, color: colors.text }}>
      {paycheck}
    </span>
  );
}

function NameIcon({ name }) {
  const lower = name.toLowerCase();
  const iconClass = 'h-4 w-4 shrink-0 text-slate-500';
  if (/(phone|cell|att|at&t|verizon|tmobile|t-mobile)/.test(lower)) return <Smartphone className={iconClass} />;
  if (/(internet|wifi|wi-fi|xfinity|spectrum)/.test(lower)) return <Wifi className={iconClass} />;
  if (/(rent|mortgage|housing)/.test(lower)) return <House className={iconClass} />;
  if (/(car insurance|auto insurance|insurance)/.test(lower)) return <Shield className={iconClass} />;
  if (/(car payment|auto loan|vehicle|toll|tolls)/.test(lower)) return <CarFront className={iconClass} />;
  if (/(electric|power|utility)/.test(lower)) return <Zap className={iconClass} />;
  if (/(water|sewer)/.test(lower)) return <Droplets className={iconClass} />;
  if (/(credit card|visa|mastercard|capital one|discover|amex)/.test(lower)) return <CreditCard className={iconClass} />;
  if (/(loan|personal loan)/.test(lower)) return <HandCoins className={iconClass} />;
  if (/(gas|fuel)/.test(lower)) return <Fuel className={iconClass} />;
  if (/(grocery|groceries|food)/.test(lower)) return <ShoppingCart className={iconClass} />;
  if (/(netflix|hulu|disney|stream|subscription)/.test(lower)) return <Tv className={iconClass} />;
  if (/(bank|savings|checking)/.test(lower)) return <Landmark className={iconClass} />;
  return <Receipt className={iconClass} />;
}

function NameWithIcon({ name, className = 'font-semibold' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <NameIcon name={name} />
      <span>{name}</span>
    </div>
  );
}

function QuickPaidButton({ status, onToggle }) {
  if (status === 'Paid') return null;
  return (
    <AppButton size="sm" className="rounded-xl" onClick={onToggle}>
      <Check className="mr-1 h-3.5 w-3.5" />
      Mark Paid
    </AppButton>
  );
}

function FilterBar({ value, onChange }) {
  const options = ['All', 'Due Soon', 'Overdue', 'Paid'];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <AppButton key={option} size="sm" variant={value === option ? 'solid' : 'outline'} onClick={() => onChange(option)}>
          {option}
        </AppButton>
      ))}
    </div>
  );
}

function SummaryCard({ title, value, icon, theme = 'dashboard' }) {
  const colors = tabThemes[theme];
  return (
    <AppCard>
      <AppCardContent>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.iconBg, color: colors.accent }}>
            {icon}
          </div>
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.accent }}>{title}</span>
        </div>
        <div className="text-lg font-bold leading-tight text-slate-900">{value}</div>
      </AppCardContent>
    </AppCard>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function TopListBar({ title, value, onAdd, addLabel }) {
  return (
    <AppCard>
      <AppCardContent className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
        <AppButton onClick={onAdd}><Plus className="mr-1 h-4 w-4" /> {addLabel}</AppButton>
      </AppCardContent>
    </AppCard>
  );
}

function BillDialog({ state, setState, onSave }) {
  const [draft, setDraft] = useState({ id: uid(), name: '', dueDay: 1, amount: 0, status: 'Pending' });

  useEffect(() => {
    if (state.open) setDraft(state.item ?? { id: uid(), name: '', dueDay: 1, amount: 0, status: 'Pending' });
  }, [state]);

  return (
    <Modal open={state.open} title={state.item ? 'Edit Bill' : 'Add Bill'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { onSave(draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Bill Name"><AppInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Due Day"><AppInput type="number" min={1} max={31} {...selectAllProps} value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number(e.target.value) })} /></Field>
        <Field label="Amount"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: parseNumberInput(e.target.value) })} /></Field>
        <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
          <span>Status Paid</span>
          <input type="checkbox" checked={draft.status === 'Paid'} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'Paid' : 'Pending' })} />
        </label>
      </div>
    </Modal>
  );
}

function DebtDialog({ state, setState, onSave }) {
  const [draft, setDraft] = useState({ id: uid(), name: '', dueDay: 1, minPayment: 0, interestRate: 0, balance: 0, status: 'Pending' });

  useEffect(() => {
    if (state.open) setDraft(state.item ?? { id: uid(), name: '', dueDay: 1, minPayment: 0, interestRate: 0, balance: 0, status: 'Pending' });
  }, [state]);

  return (
    <Modal open={state.open} title={state.item ? 'Edit Debt' : 'Add Debt'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { onSave(draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Debt Name"><AppInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Due Day"><AppInput type="number" min={1} max={31} {...selectAllProps} value={draft.dueDay} onChange={(e) => setDraft({ ...draft, dueDay: Number(e.target.value) })} /></Field>
        <Field label="Minimum Payment"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.minPayment)} onChange={(e) => setDraft({ ...draft, minPayment: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Interest Rate"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.interestRate)} onChange={(e) => setDraft({ ...draft, interestRate: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Current Balance"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.balance)} onChange={(e) => setDraft({ ...draft, balance: parseNumberInput(e.target.value) })} /></Field>
        <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
          <span>Status Paid</span>
          <input type="checkbox" checked={draft.status === 'Paid'} onChange={(e) => setDraft({ ...draft, status: e.target.checked ? 'Paid' : 'Pending' })} />
        </label>
      </div>
    </Modal>
  );
}

function ExpenseDialog({ state, setState, onSave }) {
  const [draft, setDraft] = useState({ id: uid(), name: '', day: 1, amount: 0, assignedPaycheck: '' });

  useEffect(() => {
    if (state.open) setDraft(state.item ?? { id: uid(), name: '', day: 1, amount: 0, assignedPaycheck: '' });
  }, [state]);

  return (
    <Modal open={state.open} title={state.item ? 'Edit Expense' : 'Add Expense'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { onSave(draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Expense Name / Type"><AppInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Day"><AppInput type="number" min={1} max={31} {...selectAllProps} value={draft.day} onChange={(e) => setDraft({ ...draft, day: Number(e.target.value) })} /></Field>
        <Field label="Amount"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Assigned Paycheck">
          <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm" value={draft.assignedPaycheck || 'unassigned'} onChange={(e) => setDraft({ ...draft, assignedPaycheck: e.target.value === 'unassigned' ? '' : e.target.value })}>
            <option value="unassigned">Unassigned</option>
            {paycheckOrder.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function PaycheckDialog({ state, setState, settings, onSave }) {
  const [draft, setDraft] = useState({ baseIncome: 0, extraIncome: 0, extraDebtActual: 0 });

  useEffect(() => {
    if (state.open && state.item) setDraft(settings[state.item]);
  }, [state, settings]);

  return (
    <Modal open={state.open} title={state.item ? `Edit ${state.item}` : 'Edit Paycheck'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { if (!state.item) return; onSave(state.item, draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Base Income"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.baseIncome)} onChange={(e) => setDraft({ ...draft, baseIncome: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Extra Income (This Month)"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.extraIncome)} onChange={(e) => setDraft({ ...draft, extraIncome: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Extra Debt Applied (This Month)"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.extraDebtActual)} onChange={(e) => setDraft({ ...draft, extraDebtActual: parseNumberInput(e.target.value) })} /></Field>
      </div>
    </Modal>
  );
}

function AccountDialog({ state, setState, onSave, paycheckAccountMap, onAssignPaycheck }) {
  const [draft, setDraft] = useState({ id: uid(), name: '', type: 'Checking', openingBalance: 0 });

  useEffect(() => {
    if (state.open) setDraft(state.item ?? { id: uid(), name: '', type: 'Checking', openingBalance: 0 });
  }, [state]);

  return (
    <Modal open={state.open} title={state.item ? 'Edit Account' : 'Add Account'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { onSave(draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Account Name"><AppInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Account Type">
          <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
            <option value="Checking">Checking</option>
            <option value="Savings">Savings</option>
          </select>
        </Field>
        <Field label="Account Balance"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.openingBalance)} onChange={(e) => setDraft({ ...draft, openingBalance: parseNumberInput(e.target.value) })} /></Field>
        {state.item ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Linked Paychecks</div>
            <div className="rounded-2xl bg-slate-50 p-3">
              <div className="mb-3 text-xs text-slate-500">Tap a paycheck to route it to this account.</div>
              <div className="flex flex-wrap gap-2">
                {paycheckOrder.map((paycheck) => {
                  const selected = paycheckAccountMap[paycheck] === draft.id;
                  return (
                    <button key={paycheck} type="button" onClick={() => onAssignPaycheck(paycheck, draft.id)} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${selected ? 'border-slate-900 ring-2 ring-slate-300' : 'border-slate-200 opacity-80'}`} style={{ backgroundColor: paycheckColors[paycheck].bg, color: paycheckColors[paycheck].text }}>
                      {paycheck}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function CustomPaycheckDialog({ state, setState, accounts, onSave }) {
  const [draft, setDraft] = useState({ id: uid(), name: '', payDay: 1, amount: 0, accountId: accounts[0]?.id || '' });

  useEffect(() => {
    if (state.open) setDraft(state.item ?? { id: uid(), name: '', payDay: 1, amount: 0, accountId: accounts[0]?.id || '' });
  }, [state, accounts]);

  return (
    <Modal open={state.open} title={state.item ? 'Edit Check' : 'Add Check'} onClose={() => setState({ open: false, item: null })} footer={<AppButton className="w-full" onClick={() => { onSave(draft); setState({ open: false, item: null }); }}>Save</AppButton>}>
      <div className="space-y-4">
        <Field label="Check Name"><AppInput value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Pay Day"><AppInput type="number" min={1} max={31} {...selectAllProps} value={draft.payDay} onChange={(e) => setDraft({ ...draft, payDay: Number(e.target.value) })} /></Field>
        <Field label="Amount"><AppInput type="text" inputMode="decimal" {...selectAllProps} value={toInputValue(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: parseNumberInput(e.target.value) })} /></Field>
        <Field label="Linked Account">
          <select className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm" value={draft.accountId} onChange={(e) => setDraft({ ...draft, accountId: e.target.value })}>
            {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

export default function App() {
  const initialState = useMemo(() => loadInitialState(), []);
  const importInputRef = useRef(null);

  const [currentMonth, setCurrentMonth] = useState(new Date(initialState.currentMonth));
  const [bills, setBills] = useState(initialState.bills);
  const [debts, setDebts] = useState(initialState.debts);
  const [expenses, setExpenses] = useState(initialState.expenses);
  const [paycheckSettings, setPaycheckSettings] = useState(initialState.paycheckSettings);
  const [accounts, setAccounts] = useState(initialState.accounts);
  const [paycheckAccountMap, setPaycheckAccountMap] = useState(initialState.paycheckAccountMap);
  const [customPaychecks, setCustomPaychecks] = useState(initialState.customPaychecks);
  const [history, setHistory] = useState(initialState.history);
  const [billsFilter, setBillsFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('bills');
  const [focusedPaycheck, setFocusedPaycheck] = useState(null);
  const [notificationPermissionState, setNotificationPermissionState] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);
  });
  const [storagePersistence, setStoragePersistence] = useState('checking');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState('checking');

  const [billDialog, setBillDialog] = useState({ open: false, item: null });
  const [debtDialog, setDebtDialog] = useState({ open: false, item: null });
  const [expenseDialog, setExpenseDialog] = useState({ open: false, item: null });
  const [paycheckDialog, setPaycheckDialog] = useState({ open: false, item: null });
  const [accountDialog, setAccountDialog] = useState({ open: false, item: null });
  const [customPaycheckDialog, setCustomPaycheckDialog] = useState({ open: false, item: null });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const routeTab = params.get('tab');
    const routePaycheck = params.get('paycheck');
    const routeMonth = getRouteMonth(params);

    if (tabOrder.includes(routeTab)) setActiveTab(routeTab);
    if (routeMonth) setCurrentMonth(routeMonth);
    setFocusedPaycheck(paycheckOrder.includes(routePaycheck) ? routePaycheck : null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.title = "JJ's Finance Tracker";

    const ensureMeta = (selector, attrs) => {
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        Object.entries(attrs).forEach(([key, value]) => tag.setAttribute(key, value));
        document.head.appendChild(tag);
      }
      return tag;
    };

    ensureMeta('meta[name="theme-color"]', { name: 'theme-color' }).setAttribute('content', APP_THEME_COLOR);
    ensureMeta('meta[name="apple-mobile-web-app-capable"]', { name: 'apple-mobile-web-app-capable' }).setAttribute('content', 'yes');
    ensureMeta('meta[name="apple-mobile-web-app-status-bar-style"]', { name: 'apple-mobile-web-app-status-bar-style' }).setAttribute('content', 'default');
    ensureMeta('meta[name="apple-mobile-web-app-title"]', { name: 'apple-mobile-web-app-title' }).setAttribute('content', "JJ's Finance Tracker");

    const updateDeviceStatus = () => {
      setIsOnline(window.navigator.onLine);
      setIsStandalone(Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true));
    };

    updateDeviceStatus();
    window.addEventListener('online', updateDeviceStatus);
    window.addEventListener('offline', updateDeviceStatus);

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const mediaListener = () => updateDeviceStatus();
    if (mediaQuery?.addEventListener) mediaQuery.addEventListener('change', mediaListener);
    else if (mediaQuery?.addListener) mediaQuery.addListener(mediaListener);

    return () => {
      window.removeEventListener('online', updateDeviceStatus);
      window.removeEventListener('offline', updateDeviceStatus);
      if (mediaQuery?.removeEventListener) mediaQuery.removeEventListener('change', mediaListener);
      else if (mediaQuery?.removeListener) mediaQuery.removeListener(mediaListener);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkPersistentStorage = async () => {
      if (typeof navigator === 'undefined' || !navigator.storage?.persisted) {
        if (!cancelled) setStoragePersistence('unsupported');
        return;
      }

      try {
        const persisted = await navigator.storage.persisted();
        if (!cancelled) setStoragePersistence(persisted ? 'granted' : 'not-granted');
      } catch {
        if (!cancelled) setStoragePersistence('unsupported');
      }
    };

    checkPersistentStorage();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const checkServiceWorkerStatus = async () => {
      if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
      if (!('serviceWorker' in navigator)) {
        if (!cancelled) setServiceWorkerStatus('unsupported');
        return;
      }

      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isSecure) {
        if (!cancelled) setServiceWorkerStatus('needs-https');
        return;
      }

      try {
        const existingRegistration = await navigator.serviceWorker.getRegistration();
        if (!cancelled) setServiceWorkerStatus(existingRegistration ? 'registered' : 'ready-for-host');
      } catch {
        if (!cancelled) setServiceWorkerStatus('ready-for-host');
      }
    };

    checkServiceWorkerStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        currentMonth: currentMonth.toISOString(),
        bills,
        debts,
        expenses,
        paycheckSettings,
        accounts,
        paycheckAccountMap,
        customPaychecks,
        history,
      })
    );
  }, [currentMonth, bills, debts, expenses, paycheckSettings, accounts, paycheckAccountMap, customPaychecks, history]);

  const openDueView = (paycheck, targetMonth = currentMonth) => {
    setActiveTab('dashboard');
    setFocusedPaycheck(paycheck);
    setCurrentMonth(new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1));
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'dashboard');
    url.searchParams.set('month', String(targetMonth.getMonth() + 1));
    url.searchParams.set('year', String(targetMonth.getFullYear()));
    if (paycheck) {
      url.searchParams.set('paycheck', paycheck);
      url.searchParams.set('view', 'due');
    } else {
      url.searchParams.delete('paycheck');
      url.searchParams.delete('view');
    }
    window.history.replaceState({}, '', url.toString());
  };

  const buildDueLink = (paycheck, targetMonth = currentMonth) => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('tab', 'dashboard');
    url.searchParams.set('month', String(targetMonth.getMonth() + 1));
    url.searchParams.set('year', String(targetMonth.getFullYear()));
    url.searchParams.set('paycheck', paycheck);
    url.searchParams.set('view', 'due');
    return url.toString();
  };

  const copyDueLink = async (paycheck, targetMonth = currentMonth) => {
    const link = buildDueLink(paycheck, targetMonth);
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      window.alert('Due-view link copied.');
    } catch {
      window.alert('Could not copy the due-view link on this device.');
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermissionState('unsupported');
      window.alert('Notifications are not supported on this device/browser.');
      return;
    }
    const result = await Notification.requestPermission();
    setNotificationPermissionState(result);
  };

  const requestPersistentStorage = async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
      setStoragePersistence('unsupported');
      window.alert('Persistent storage is not supported on this browser.');
      return;
    }

    try {
      const granted = await navigator.storage.persist();
      setStoragePersistence(granted ? 'granted' : 'not-granted');
      window.alert(granted ? 'Persistent storage was enabled if supported on this device.' : 'Persistent storage was not granted on this browser.');
    } catch {
      setStoragePersistence('unsupported');
      window.alert('Persistent storage could not be requested on this browser.');
    }
  };

  const storageStatusLabel =
    storagePersistence === 'granted'
      ? 'Persistent'
      : storagePersistence === 'not-granted'
        ? 'Standard'
        : storagePersistence === 'unsupported'
          ? 'Unsupported'
          : 'Checking…';

  const serviceWorkerStatusLabel =
    serviceWorkerStatus === 'registered'
      ? 'Offline Cache Active'
      : serviceWorkerStatus === 'ready-for-host'
        ? 'Ready When Hosted'
        : serviceWorkerStatus === 'needs-https'
          ? 'Needs HTTPS'
          : serviceWorkerStatus === 'unsupported'
            ? 'Unsupported'
            : 'Checking…';

  const { dates, hasThirdJennifer } = useMemo(() => buildPaychecks(currentMonth), [currentMonth]);

  const incomes = useMemo(() => ({
    'Robby #1': paycheckSettings['Robby #1'].baseIncome + paycheckSettings['Robby #1'].extraIncome,
    'Robby #2': paycheckSettings['Robby #2'].baseIncome + paycheckSettings['Robby #2'].extraIncome,
    'Jennifer #1': paycheckSettings['Jennifer #1'].baseIncome + paycheckSettings['Jennifer #1'].extraIncome,
    'Jennifer #2': paycheckSettings['Jennifer #2'].baseIncome + paycheckSettings['Jennifer #2'].extraIncome,
    'Jennifer #3': hasThirdJennifer ? paycheckSettings['Jennifer #3'].baseIncome + paycheckSettings['Jennifer #3'].extraIncome : 0,
  }), [paycheckSettings, hasThirdJennifer]);

  const assignedBills = useMemo(() => bills.map((bill) => {
    const assignedPaycheck = getAssignedCheckName(bill.dueDay, currentMonth);
    const flags = getBillFlags(bill, currentMonth);
    return { ...bill, assignedPaycheck, ...flags };
  }).sort((a, b) => a.dueDay - b.dueDay), [bills, currentMonth]);

  const debtGroups = useMemo(() => {
    const firstRowByName = new Map();
    const sharedBalanceByName = new Map();
    debts.forEach((debt) => {
      if (!firstRowByName.has(debt.name)) firstRowByName.set(debt.name, debt.id);
      if (!sharedBalanceByName.has(debt.name) && debt.balance > 0) sharedBalanceByName.set(debt.name, debt.balance);
      if (!sharedBalanceByName.has(debt.name)) sharedBalanceByName.set(debt.name, 0);
    });
    return { firstRowByName, sharedBalanceByName };
  }, [debts]);

  const visibleDebts = useMemo(() => debts.map((debt) => ({
    ...debt,
    assignedPaycheck: getAssignedCheckName(debt.dueDay, currentMonth),
    displayBalance: debtGroups.firstRowByName.get(debt.name) === debt.id ? debtGroups.sharedBalanceByName.get(debt.name) || 0 : 0,
  })).sort((a, b) => a.dueDay - b.dueDay), [debts, currentMonth, debtGroups]);

  const dueSummaryByPaycheck = useMemo(() => paycheckOrder.reduce((acc, paycheck) => {
    const billsForPaycheck = assignedBills.filter((bill) => bill.assignedPaycheck === paycheck);
    const debtsForPaycheck = visibleDebts.filter((debt) => debt.assignedPaycheck === paycheck);
    acc[paycheck] = {
      bills: billsForPaycheck,
      debts: debtsForPaycheck,
      total: billsForPaycheck.reduce((sum, bill) => sum + bill.amount, 0) + debtsForPaycheck.reduce((sum, debt) => sum + debt.minPayment, 0),
    };
    return acc;
  }, {}), [assignedBills, visibleDebts]);

  const focusedDueSummary = focusedPaycheck ? dueSummaryByPaycheck[focusedPaycheck] : null;

  const paycheckCards = useMemo(() => paycheckOrder.map((name) => {
    const income = incomes[name];
    const active = income > 0 && !!dates[name];
    if (!active) {
      return { name, payDate: dates[name], income, active: false, billsTotal: 0, debtTotal: 0, living: 0, savings: 0, suggestedExtraDebtAmount: 0, actualExtraDebtAmount: 0, extraDebtTarget: '' };
    }

    const billsTotal = assignedBills.filter((bill) => bill.assignedPaycheck === name).reduce((sum, bill) => sum + bill.amount, 0);
    const expensesTotal = expenses.filter((expense) => expense.assignedPaycheck === name).reduce((sum, expense) => sum + expense.amount, 0);
    const debtMin = visibleDebts.filter((debt) => debt.assignedPaycheck === name).reduce((sum, debt) => sum + debt.minPayment, 0);
    const remaining1 = income - (billsTotal + expensesTotal + debtMin);
    const living = remaining1 > 0 ? Number((remaining1 * 0.25).toFixed(2)) : 0;
    const remaining2 = remaining1 - living;
    const savings = remaining2 > 0 ? Number((remaining2 * 0.15).toFixed(2)) : 0;
    const suggestedExtraDebtAmount = remaining2 - savings > 0 ? Number((remaining2 - savings).toFixed(2)) : 0;
    const actualExtraDebtAmount = Number((paycheckSettings[name].extraDebtActual || 0).toFixed(2));
    const targetDebt = [...visibleDebts].filter((debt) => debt.displayBalance > 0).sort((a, b) => b.interestRate - a.interestRate || b.displayBalance - a.displayBalance)[0];
    return {
      name,
      payDate: dates[name],
      income,
      active: true,
      billsTotal: Number((billsTotal + expensesTotal).toFixed(2)),
      debtTotal: Number((debtMin + actualExtraDebtAmount).toFixed(2)),
      living,
      savings,
      suggestedExtraDebtAmount,
      actualExtraDebtAmount,
      extraDebtTarget: targetDebt?.name || '',
    };
  }), [assignedBills, expenses, visibleDebts, incomes, dates, paycheckSettings]);

  const extraDebtAllocations = useMemo(() => paycheckCards.filter((card) => card.active && card.actualExtraDebtAmount > 0 && card.extraDebtTarget).map((card) => ({
    paycheck: card.name,
    accountId: paycheckAccountMap[card.name],
    day: card.payDate?.getDate() || 1,
    debtName: card.extraDebtTarget,
    amount: card.actualExtraDebtAmount,
  })), [paycheckCards, paycheckAccountMap]);

  const extraDebtByDebtName = useMemo(() => {
    const map = new Map();
    extraDebtAllocations.forEach((allocation) => {
      map.set(allocation.debtName, (map.get(allocation.debtName) || 0) + allocation.amount);
    });
    return map;
  }, [extraDebtAllocations]);

  const customPaycheckCards = useMemo(() => customPaychecks.map((check) => ({
    kind: 'custom',
    id: check.id,
    name: check.name,
    payDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), check.payDay),
    income: check.amount,
    accountId: check.accountId,
    accountName: accounts.find((account) => account.id === check.accountId)?.name || 'Unlinked Account',
  })), [customPaychecks, currentMonth, accounts]);

  const accountSummaries = useMemo(() => {
    const byId = new Map();

    accounts.forEach((account) => {
      byId.set(account.id, {
        ...account,
        linkedPaychecks: paycheckOrder.filter((paycheck) => paycheckAccountMap[paycheck] === account.id),
        deposits: 0,
        billTotal: 0,
        debtTotal: 0,
        expenseTotal: 0,
        extraDebtTotal: 0,
        projectedBalance: account.openingBalance,
      });
    });

    paycheckOrder.forEach((paycheck) => {
      const target = byId.get(paycheckAccountMap[paycheck]);
      if (target) target.deposits += incomes[paycheck] || 0;
    });

    customPaychecks.forEach((check) => {
      const target = byId.get(check.accountId);
      if (target) target.deposits += check.amount;
    });

    assignedBills.forEach((bill) => {
      const target = byId.get(paycheckAccountMap[bill.assignedPaycheck]);
      if (target) target.billTotal += bill.amount;
    });

    visibleDebts.forEach((debt) => {
      const target = byId.get(paycheckAccountMap[debt.assignedPaycheck]);
      if (target) target.debtTotal += debt.minPayment;
    });

    expenses.forEach((expense) => {
      if (!expense.assignedPaycheck) return;
      const target = byId.get(paycheckAccountMap[expense.assignedPaycheck]);
      if (target) target.expenseTotal += expense.amount;
    });

    extraDebtAllocations.forEach((allocation) => {
      const target = byId.get(allocation.accountId);
      if (target) target.extraDebtTotal += allocation.amount;
    });

    return accounts.map((account) => {
      const summary = byId.get(account.id);
      summary.projectedBalance = summary.openingBalance + summary.deposits - summary.billTotal - summary.debtTotal - summary.expenseTotal - summary.extraDebtTotal;
      return summary;
    });
  }, [accounts, paycheckAccountMap, incomes, assignedBills, visibleDebts, expenses, customPaychecks, extraDebtAllocations]);

  const accountLedgerMap = useMemo(() => {
    const map = new Map();
    accounts.forEach((account) => map.set(account.id, []));

    paycheckCards.forEach((card) => {
      if (!card.active || !card.payDate) return;
      const accountId = paycheckAccountMap[card.name];
      map.get(accountId)?.push({ id: `pay-${card.name}`, accountId, day: card.payDate.getDate(), label: card.name, subtitle: 'Scheduled paycheck', amount: card.income, kind: 'deposit' });
    });

    customPaychecks.forEach((check) => {
      map.get(check.accountId)?.push({ id: `custom-${check.id}`, accountId: check.accountId, day: check.payDay, label: check.name, subtitle: 'Extra check', amount: check.amount, kind: 'deposit' });
    });

    assignedBills.forEach((bill) => {
      const accountId = paycheckAccountMap[bill.assignedPaycheck];
      map.get(accountId)?.push({ id: `bill-${bill.id}`, accountId, day: bill.dueDay, label: bill.name, subtitle: 'Bill', amount: bill.amount, kind: 'withdrawal', status: bill.status });
    });

    visibleDebts.forEach((debt) => {
      const accountId = paycheckAccountMap[debt.assignedPaycheck];
      map.get(accountId)?.push({ id: `debt-${debt.id}`, accountId, day: debt.dueDay, label: debt.name, subtitle: 'Debt payment', amount: debt.minPayment, kind: 'withdrawal', status: debt.status });
    });

    expenses.forEach((expense) => {
      if (!expense.assignedPaycheck) return;
      const accountId = paycheckAccountMap[expense.assignedPaycheck];
      map.get(accountId)?.push({ id: `expense-${expense.id}`, accountId, day: expense.day, label: expense.name, subtitle: 'Expense', amount: expense.amount, kind: 'withdrawal', status: 'Planned' });
    });

    extraDebtAllocations.forEach((allocation, index) => {
      map.get(allocation.accountId)?.push({ id: `extra-${allocation.paycheck}-${index}`, accountId: allocation.accountId, day: allocation.day, label: allocation.debtName, subtitle: 'Extra debt payment', amount: allocation.amount, kind: 'withdrawal', status: 'Planned' });
    });

    accounts.forEach((account) => {
      const entries = map.get(account.id) || [];
      entries.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        if (a.kind !== b.kind) return a.kind === 'deposit' ? -1 : 1;
        return a.label.localeCompare(b.label);
      });
    });

    return map;
  }, [accounts, paycheckCards, paycheckAccountMap, customPaychecks, assignedBills, visibleDebts, expenses, extraDebtAllocations]);

  const topSummary = useMemo(() => {
    const monthlyIncome = paycheckCards.reduce((sum, card) => sum + card.income, 0) + customPaychecks.reduce((sum, check) => sum + check.amount, 0);
    const extraDebtTotal = extraDebtAllocations.reduce((sum, allocation) => sum + allocation.amount, 0);
    const obligations = assignedBills.reduce((sum, bill) => sum + bill.amount, 0) + expenses.reduce((sum, expense) => sum + expense.amount, 0) + visibleDebts.reduce((sum, debt) => sum + debt.minPayment, 0) + extraDebtTotal;
    const debtStillDue = visibleDebts.reduce((sum, debt) => sum + debt.displayBalance, 0);
    const leftAfterBills = monthlyIncome - obligations;
    const today = new Date();
    const anchorDay = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear() ? today.getDate() : 1;
    const nextBills = assignedBills.filter((bill) => bill.status !== 'Paid' && bill.dueDay >= anchorDay).slice(0, 5);
    return { monthlyIncome, obligations, debtStillDue, leftAfterBills, nextBills };
  }, [assignedBills, currentMonth, expenses, paycheckCards, visibleDebts, customPaychecks, extraDebtAllocations]);

  const filteredBills = useMemo(() => filterBills(assignedBills, billsFilter), [assignedBills, billsFilter]);
  const sortedExpenses = useMemo(() => [...expenses].sort((a, b) => expenseSortOrder[a.assignedPaycheck] - expenseSortOrder[b.assignedPaycheck] || a.day - b.day), [expenses]);
  const billsTotal = useMemo(() => assignedBills.reduce((sum, bill) => sum + bill.amount, 0), [assignedBills]);
  const debtTotal = useMemo(() => visibleDebts.reduce((sum, debt) => sum + debt.displayBalance, 0), [visibleDebts]);
  const expenseTotal = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const totalProjectedBalance = useMemo(() => accountSummaries.reduce((sum, account) => sum + account.projectedBalance, 0), [accountSummaries]);

  const sortedPaycheckItems = useMemo(() => {
    const items = [
      ...paycheckCards.map((card) => ({ ...card, kind: 'scheduled' })),
      ...customPaycheckCards,
    ];

    const today = new Date();
    const isCurrentViewedMonth = today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear();
    if (!isCurrentViewedMonth) return items.sort((a, b) => (a.payDate?.getDate() || 999) - (b.payDate?.getDate() || 999));

    const todayDay = today.getDate();
    return items.sort((a, b) => {
      const aDay = a.payDate?.getDate() || 999;
      const bDay = b.payDate?.getDate() || 999;
      const aUpcoming = aDay >= todayDay ? 0 : 1;
      const bUpcoming = bDay >= todayDay ? 0 : 1;
      return aUpcoming - bUpcoming || aDay - bDay;
    });
  }, [paycheckCards, customPaycheckCards, currentMonth]);

  const exportBackup = () => {
    const payload = { currentMonth: currentMonth.toISOString(), bills, debts, expenses, paycheckSettings, accounts, paycheckAccountMap, customPaychecks, history };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jj-finance-tracker-backup-${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = normalizeState(JSON.parse(text));
      setCurrentMonth(new Date(parsed.currentMonth));
      setBills(parsed.bills);
      setDebts(parsed.debts);
      setExpenses(parsed.expenses);
      setPaycheckSettings(parsed.paycheckSettings);
      setAccounts(parsed.accounts);
      setPaycheckAccountMap(parsed.paycheckAccountMap);
      setCustomPaychecks(parsed.customPaychecks);
      setHistory(parsed.history);
    } catch {
      window.alert('That backup file could not be read.');
    } finally {
      event.target.value = '';
    }
  };

  const previousMonth = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setCurrentMonth(new Date(last.currentMonth));
    setBills(last.bills);
    setDebts(last.debts);
    setExpenses(last.expenses);
    setPaycheckSettings(last.paycheckSettings);
    setAccounts(last.accounts);
    setPaycheckAccountMap(last.paycheckAccountMap);
    setCustomPaychecks(last.customPaychecks || []);
    setHistory((prev) => prev.slice(0, -1));
  };

  const nextMonth = () => {
    const snapshot = JSON.parse(JSON.stringify({ currentMonth: currentMonth.toISOString(), bills, debts, expenses, paycheckSettings, accounts, paycheckAccountMap, customPaychecks }));
    const nextOpeningBalances = new Map(accountSummaries.map((account) => [account.id, account.projectedBalance]));

    setHistory((prev) => [...prev, snapshot]);
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setBills((prev) => prev.map((bill) => ({ ...bill, status: 'Pending' })));
    setDebts((prev) => {
      const firstByName = new Map();
      const sumPaidMinByName = new Map();
      prev.forEach((debt, index) => {
        if (!firstByName.has(debt.name)) firstByName.set(debt.name, index);
        if (debt.status === 'Paid') sumPaidMinByName.set(debt.name, (sumPaidMinByName.get(debt.name) || 0) + debt.minPayment);
      });
      return prev.map((debt, index) => {
        const firstIndex = firstByName.get(debt.name);
        if (index === firstIndex) {
          const startingBalance = prev.find((row) => row.name === debt.name && row.balance > 0)?.balance || debt.balance;
          const extraReduction = extraDebtByDebtName.get(debt.name) || 0;
          return { ...debt, balance: Math.max(0, startingBalance - (sumPaidMinByName.get(debt.name) || 0) - extraReduction), status: 'Pending' };
        }
        return { ...debt, balance: 0, status: 'Pending' };
      });
    });
    setPaycheckSettings((prev) => ({
      'Robby #1': { ...prev['Robby #1'], extraIncome: 0, extraDebtActual: 0 },
      'Robby #2': { ...prev['Robby #2'], extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #1': { ...prev['Jennifer #1'], extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #2': { ...prev['Jennifer #2'], extraIncome: 0, extraDebtActual: 0 },
      'Jennifer #3': { ...prev['Jennifer #3'], extraIncome: 0, extraDebtActual: 0 },
    }));
    setAccounts((prev) => prev.map((account) => ({ ...account, openingBalance: nextOpeningBalances.get(account.id) ?? account.openingBalance })));
    setCustomPaychecks([]);
  };

  const toggleBillPaid = (id) => setBills((prev) => prev.map((bill) => (bill.id === id ? { ...bill, status: bill.status === 'Paid' ? 'Pending' : 'Paid' } : bill)));
  const toggleDebtPaid = (id) => setDebts((prev) => prev.map((debt) => (debt.id === id ? { ...debt, status: debt.status === 'Paid' ? 'Pending' : 'Paid' } : debt)));

  const removeAccount = (id) => {
    if (accounts.length <= 1) return;
    const fallback = accounts.find((account) => account.id !== id)?.id;
    if (!fallback) return;
    setAccounts((prev) => prev.filter((account) => account.id !== id));
    setPaycheckAccountMap((prev) => ({
      'Robby #1': prev['Robby #1'] === id ? fallback : prev['Robby #1'],
      'Robby #2': prev['Robby #2'] === id ? fallback : prev['Robby #2'],
      'Jennifer #1': prev['Jennifer #1'] === id ? fallback : prev['Jennifer #1'],
      'Jennifer #2': prev['Jennifer #2'] === id ? fallback : prev['Jennifer #2'],
      'Jennifer #3': prev['Jennifer #3'] === id ? fallback : prev['Jennifer #3'],
    }));
    setCustomPaychecks((prev) => prev.map((check) => (check.accountId === id ? { ...check, accountId: fallback } : check)));
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f3eb' }}>
      <div className="mx-auto max-w-md px-4 pb-24 pt-4">
        <div className="mb-3 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700">Your data saves automatically on this device.</div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-slate-500">JJ's Finance Tracker</div>
            <div className="text-2xl font-bold tracking-tight">{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="outline" onClick={previousMonth} disabled={!history.length}><ChevronLeft className="mr-1 h-4 w-4" /> Prev</AppButton>
            <AppButton onClick={nextMonth}>Next Month <ChevronRight className="ml-1 h-4 w-4" /></AppButton>
          </div>
        </div>

        <div className="grid h-auto w-full grid-cols-5 gap-1 rounded-2xl border border-slate-300 bg-white p-1 shadow-sm">
          {[
            ['bills', 'Bills'],
            ['debt', 'Debt'],
            ['expenses', 'Expenses'],
            ['dashboard', 'Paychecks'],
            ['accounts', 'Accounts'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setActiveTab(value)} className={`min-w-0 whitespace-normal rounded-xl border border-slate-300 px-1 py-2 text-center text-[11px] font-semibold leading-tight ${activeTab === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'bills' ? (
          <div className="space-y-4 pt-4">
            <AppCard style={{ backgroundColor: tabThemes.bills.tint }}><AppCardContent><div className="text-sm font-semibold" style={{ color: tabThemes.bills.accent }}>Bills Overview</div><div className="mt-1 text-sm text-slate-600">Keep track of recurring bills, what is due soon, and what is already paid.</div></AppCardContent></AppCard>
            <TopListBar title="Monthly Bills Total" value={currency(billsTotal)} onAdd={() => setBillDialog({ open: true, item: null })} addLabel="Add Bill" />
            <FilterBar value={billsFilter} onChange={setBillsFilter} />
            <div className="space-y-3">
              {filteredBills.length ? filteredBills.map((bill) => (
                <AppCard key={bill.id} style={{ borderLeft: `6px solid ${paycheckColors[bill.assignedPaycheck].border}` }}>
                  <AppCardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <NameWithIcon name={bill.name} />
                        <div className="mt-2"><PaycheckPill paycheck={bill.assignedPaycheck} /></div>
                        <div className="mt-2 text-sm text-slate-500">Due {bill.dueDay}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {bill.status === 'Paid' ? (
                            <button type="button" onClick={() => toggleBillPaid(bill.id)} className="inline-flex items-center rounded-full border border-green-700 bg-green-700 px-2.5 py-1 text-xs font-medium text-white">Paid</button>
                          ) : (
                            <>
                              <AppBadge className={bill.isOverdue ? 'border-red-800 bg-red-700 text-white' : bill.isDueSoon ? 'border-red-200 bg-red-100 text-red-800' : 'border-slate-200 bg-slate-100 text-slate-800'}>{bill.isOverdue ? 'Overdue' : bill.isDueSoon ? 'Due Soon' : 'Pending'}</AppBadge>
                              <QuickPaidButton status={bill.status} onToggle={() => toggleBillPaid(bill.id)} />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{currency(bill.amount)}</div>
                        <div className="mt-3 flex gap-2">
                          <AppButton size="icon" variant="outline" onClick={() => setBillDialog({ open: true, item: bill })}><Pencil className="h-4 w-4" /></AppButton>
                          <AppButton size="icon" variant="outline" onClick={() => setBills((prev) => prev.filter((row) => row.id !== bill.id))}><Trash2 className="h-4 w-4" /></AppButton>
                        </div>
                      </div>
                    </div>
                  </AppCardContent>
                </AppCard>
              )) : <AppCard><AppCardContent className="text-sm text-slate-500">No matching bills for this filter.</AppCardContent></AppCard>}
            </div>
          </div>
        ) : null}

        {activeTab === 'debt' ? (
          <div className="space-y-4 pt-4">
            <AppCard style={{ backgroundColor: tabThemes.debt.tint }}><AppCardContent><div className="text-sm font-semibold" style={{ color: tabThemes.debt.accent }}>Debt Overview</div><div className="mt-1 text-sm text-slate-600">Watch balances, payments, and extra debt applied without making the screen feel heavy.</div></AppCardContent></AppCard>
            <TopListBar title="Total Debt Remaining" value={currency(debtTotal)} onAdd={() => setDebtDialog({ open: true, item: null })} addLabel="Add Debt" />
            <AppCard><AppCardContent className="text-sm text-slate-600">Extra debt now uses the amount you actually enter on each paycheck, and that amount reduces the targeted debt when you move to the next month.</AppCardContent></AppCard>
            <div className="space-y-3">
              {visibleDebts.map((debt) => (
                <AppCard key={debt.id} style={{ borderLeft: `6px solid ${paycheckColors[debt.assignedPaycheck].border}` }}>
                  <AppCardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <NameWithIcon name={debt.name} />
                        <div className="mt-2"><PaycheckPill paycheck={debt.assignedPaycheck} /></div>
                        <div className="mt-2 text-sm text-slate-500">Due {debt.dueDay}</div>
                        <div className="mt-1 text-sm text-slate-500">Min {currency(debt.minPayment)} • {debt.interestRate}%</div>
                        <div className="mt-2 flex items-center gap-2 text-sm"><AlertCircle className="h-4 w-4 text-slate-400" /><span>Balance: {currency(debt.displayBalance)}</span></div>
                        <div className="mt-2 text-xs text-slate-500">Extra debt applied: {currency(extraDebtByDebtName.get(debt.name) || 0)}</div>
                        <div className="mt-2 flex items-center gap-2">
                          {debt.status === 'Paid' ? (
                            <button type="button" onClick={() => toggleDebtPaid(debt.id)} className="inline-flex items-center rounded-full border border-green-700 bg-green-700 px-2.5 py-1 text-xs font-medium text-white">Paid</button>
                          ) : (
                            <>
                              <AppBadge className="border-slate-200 bg-slate-100 text-slate-800">Pending</AppBadge>
                              <QuickPaidButton status={debt.status} onToggle={() => toggleDebtPaid(debt.id)} />
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <AppButton size="icon" variant="outline" onClick={() => setDebtDialog({ open: true, item: debt })}><Pencil className="h-4 w-4" /></AppButton>
                        <AppButton size="icon" variant="outline" onClick={() => setDebts((prev) => prev.filter((row) => row.id !== debt.id))}><Trash2 className="h-4 w-4" /></AppButton>
                      </div>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'expenses' ? (
          <div className="space-y-4 pt-4">
            <AppCard style={{ backgroundColor: tabThemes.expenses.tint }}><AppCardContent><div className="text-sm font-semibold" style={{ color: tabThemes.expenses.accent }}>Expenses Overview</div><div className="mt-1 text-sm text-slate-600">Track changing expenses like gas, tolls, and the extras that show up during the month.</div></AppCardContent></AppCard>
            <TopListBar title="Monthly Expenses Total" value={currency(expenseTotal)} onAdd={() => setExpenseDialog({ open: true, item: null })} addLabel="Add Expense" />
            <div className="space-y-3">
              {sortedExpenses.map((expense) => (
                <AppCard key={expense.id} style={expense.assignedPaycheck ? { borderLeft: `6px solid ${paycheckColors[expense.assignedPaycheck].border}` } : undefined}>
                  <AppCardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <NameWithIcon name={expense.name} />
                        <div className="mt-2 text-sm text-slate-500">Day {expense.day}</div>
                        <div className="mt-2 text-sm text-slate-500">{expense.assignedPaycheck ? <PaycheckPill paycheck={expense.assignedPaycheck} /> : 'Unassigned'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{currency(expense.amount)}</div>
                        <div className="mt-3 flex gap-2">
                          <AppButton size="icon" variant="outline" onClick={() => setExpenseDialog({ open: true, item: expense })}><Pencil className="h-4 w-4" /></AppButton>
                          <AppButton size="icon" variant="outline" onClick={() => setExpenses((prev) => prev.filter((row) => row.id !== expense.id))}><Trash2 className="h-4 w-4" /></AppButton>
                        </div>
                      </div>
                    </div>
                  </AppCardContent>
                </AppCard>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'dashboard' ? (
          <div className="space-y-4 pt-4">
            <AppCard style={{ backgroundColor: tabThemes.dashboard.tint }}><AppCardContent><div className="text-sm font-semibold" style={{ color: tabThemes.dashboard.accent }}>Paychecks Overview</div><div className="mt-1 text-sm text-slate-600">Jennifer is anchored to April 30, 2026 and repeats every 14 days from there. The app labels the Jennifer checks inside each month as Jennifer #1, #2, and #3.</div></AppCardContent></AppCard>
            <AppCard>
              <AppCardHeader><div className="flex items-center gap-2 text-base font-semibold"><Bell className="h-4 w-4" /> Notification Setup</div></AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-600">
                <div>This app is prepared for paycheck reminders. A hosted reminder or phone automation can open the due view for a paycheck date.</div>
                <div className="flex flex-wrap items-center gap-2">
                  <AppBadge className="border-slate-300 bg-white text-slate-700">Permission: {notificationPermissionState}</AppBadge>
                  <AppButton variant="outline" onClick={requestNotificationAccess}><Bell className="mr-1 h-4 w-4" /> Allow Notifications</AppButton>
                  <AppButton variant="outline" onClick={() => openDueView(null)}><X className="mr-1 h-4 w-4" /> Clear Due View</AppButton>
                </div>
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader><div className="text-base font-semibold">Apple Shortcuts Setup</div></AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-600">
                <div>These links are month-specific, so each Shortcut opens the right paycheck and the right month.</div>
                <div className="space-y-2">
                  {paycheckCards.filter((card) => card.active && card.payDate).map((card) => (
                    <div key={`shortcut-${card.name}`} className="rounded-2xl bg-slate-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <PaycheckPill paycheck={card.name} />
                            <span className="text-xs text-slate-500">{fmtShortDate(card.payDate)}</span>
                          </div>
                          <div className="mt-2 text-sm text-slate-500">Due total: {currency(dueSummaryByPaycheck[card.name]?.total || 0)}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <AppButton size="sm" variant="outline" onClick={() => openDueView(card.name, currentMonth)}>Open</AppButton>
                          <AppButton size="sm" variant="outline" onClick={() => copyDueLink(card.name, currentMonth)}>Copy Shortcut Link</AppButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                  In iPhone Shortcuts, create a Time of Day personal automation on each paycheck date, add Open URLs, then paste the copied paycheck link.
                </div>
              </AppCardContent>
            </AppCard>

            {focusedPaycheck && focusedDueSummary ? (
              <AppCard>
                <AppCardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">Due for {focusedPaycheck}</div>
                      <div className="mt-1 text-sm text-slate-500">This is the screen a reminder link would open.</div>
                    </div>
                    <AppButton size="icon" variant="outline" onClick={() => openDueView(null)}><X className="h-4 w-4" /></AppButton>
                  </div>
                </AppCardHeader>
                <AppCardContent className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Total Due</div><div className="text-lg font-bold">{currency(focusedDueSummary.total)}</div></div>
                  {focusedDueSummary.bills.length ? <div className="space-y-2"><div className="text-sm font-semibold">Bills</div>{focusedDueSummary.bills.map((bill) => <div key={bill.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><NameWithIcon name={bill.name} className="font-medium" /><div className="text-xs text-slate-500">Due day {bill.dueDay}</div></div><div className="font-semibold">{currency(bill.amount)}</div></div>)}</div> : null}
                  {focusedDueSummary.debts.length ? <div className="space-y-2"><div className="text-sm font-semibold">Debt</div>{focusedDueSummary.debts.map((debt) => <div key={debt.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3"><div><NameWithIcon name={debt.name} className="font-medium" /><div className="text-xs text-slate-500">Due day {debt.dueDay}</div></div><div className="font-semibold">{currency(debt.minPayment)}</div></div>)}</div> : null}
                  {!focusedDueSummary.bills.length && !focusedDueSummary.debts.length ? <div className="rounded-2xl bg-slate-50 p-3 text-slate-500">Nothing is currently due on this paycheck date.</div> : null}
                </AppCardContent>
              </AppCard>
            ) : null}

            <TopListBar title="Extra Checks This Month" value={`${customPaychecks.length}`} onAdd={() => setCustomPaycheckDialog({ open: true, item: null })} addLabel="Add Check" />

            <div className="grid grid-cols-2 gap-3">
              <SummaryCard title="Monthly Income" value={currency(topSummary.monthlyIncome)} icon={<DollarSign className="h-4 w-4" />} theme="dashboard" />
              <SummaryCard title="Obligations" value={currency(topSummary.obligations)} icon={<Receipt className="h-4 w-4" />} theme="dashboard" />
              <SummaryCard title="Left After Bills" value={currency(topSummary.leftAfterBills)} icon={<PiggyBank className="h-4 w-4" />} theme="dashboard" />
              <SummaryCard title="Debt Still Due" value={currency(topSummary.debtStillDue)} icon={<CreditCard className="h-4 w-4" />} theme="dashboard" />
            </div>

            <div className="space-y-3">
              {sortedPaycheckItems.map((card) => (
                <AppCard key={card.kind === 'scheduled' ? card.name : card.id} style={card.kind === 'scheduled' ? { borderLeft: `6px solid ${paycheckColors[card.name].border}` } : undefined}>
                  {card.kind === 'scheduled' ? (
                    <>
                      <AppCardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="mb-2"><PaycheckPill paycheck={card.name} /></div>
                            <div className="text-lg font-semibold">{card.name}</div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> {fmtShortDate(card.payDate)}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <AppBadge className={`${card.active ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-slate-100 text-slate-600'}`}>{card.active ? currency(card.income) : 'No Paycheck This Month'}</AppBadge>
                            <AppButton size="sm" variant="outline" onClick={() => setPaycheckDialog({ open: true, item: card.name })}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</AppButton>
                          </div>
                        </div>
                      </AppCardHeader>
                      <AppCardContent>
                        {card.active ? (
                          <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <Stat label="Bills" value={currency(card.billsTotal)} />
                              <Stat label="Debt" value={currency(card.debtTotal)} />
                              <Stat label="Living" value={currency(card.living)} />
                              <Stat label="Savings" value={currency(card.savings)} />
                              <Stat label="Extra Income" value={currency(paycheckSettings[card.name].extraIncome)} />
                              <Stat label="Extra Debt Entered" value={currency(card.actualExtraDebtAmount)} />
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-3"><div className="text-slate-500">Suggested Extra Debt</div><div className="font-semibold">{currency(card.suggestedExtraDebtAmount)}</div><div className="mt-1 text-xs text-slate-500">Target: {card.extraDebtTarget || 'None'}</div></div>
                            <div className="flex flex-wrap gap-2">
                              <AppButton size="sm" variant="outline" onClick={() => openDueView(card.name)}><Bell className="mr-1 h-3.5 w-3.5" /> Open Due View</AppButton>
                              <AppButton size="sm" variant="outline" onClick={() => copyDueLink(card.name)}><Link className="mr-1 h-3.5 w-3.5" /> Copy Due Link</AppButton>
                            </div>
                          </div>
                        ) : <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">No paycheck this month.</div>}
                      </AppCardContent>
                    </>
                  ) : (
                    <AppCardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <AppBadge className="border-slate-300 bg-white text-slate-700">Custom Check</AppBadge>
                          <div className="mt-2 text-lg font-semibold">{card.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500"><CalendarDays className="h-4 w-4" /> {fmtShortDate(card.payDate)}</div>
                          <div className="mt-1 text-sm text-slate-500">Linked to: {card.accountName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{currency(card.income)}</div>
                          <div className="mt-3 flex gap-2">
                            <AppButton size="icon" variant="outline" onClick={() => setCustomPaycheckDialog({ open: true, item: customPaychecks.find((check) => check.id === card.id) || null })}><Pencil className="h-4 w-4" /></AppButton>
                            <AppButton size="icon" variant="outline" onClick={() => setCustomPaychecks((prev) => prev.filter((check) => check.id !== card.id))}><Trash2 className="h-4 w-4" /></AppButton>
                          </div>
                        </div>
                      </div>
                    </AppCardHeader>
                  )}
                </AppCard>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === 'accounts' ? (
          <div className="space-y-4 pt-4">
            <AppCard style={{ backgroundColor: tabThemes.accounts.tint }}><AppCardContent><div className="text-sm font-semibold" style={{ color: tabThemes.accounts.accent }}>Accounts Overview</div><div className="mt-1 text-sm text-slate-600">See balances, projected activity, and your running ledger in one cleaner view.</div></AppCardContent></AppCard>
            <TopListBar title="Total Projected Balance" value={currency(totalProjectedBalance)} onAdd={() => setAccountDialog({ open: true, item: null })} addLabel="Add Account" />
            <AppCard>
              <AppCardHeader><div className="text-base font-semibold">Backup & Restore</div></AppCardHeader>
              <AppCardContent className="space-y-3">
                <div className="text-sm text-slate-500">Download a backup file of your current data or restore from one you saved earlier.</div>
                <div className="flex gap-2">
                  <AppButton onClick={exportBackup}><Download className="mr-1 h-4 w-4" /> Export</AppButton>
                  <AppButton variant="outline" onClick={() => importInputRef.current?.click()}><Upload className="mr-1 h-4 w-4" /> Import</AppButton>
                </div>
                <input ref={importInputRef} type="file" accept="application/json" className="hidden" onChange={importBackup} />
              </AppCardContent>
            </AppCard>

            <AppCard>
              <AppCardHeader><div className="text-base font-semibold">Offline & Device Setup</div></AppCardHeader>
              <AppCardContent className="space-y-3 text-sm text-slate-600">
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Connection" value={isOnline ? 'Online' : 'Offline'} />
                  <Stat label="Home Screen" value={isStandalone ? 'Added' : 'Browser Only'} />
                  <Stat label="Storage" value={storageStatusLabel} />
                  <Stat label="Offline Cache" value={serviceWorkerStatusLabel} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <AppButton variant="outline" onClick={requestPersistentStorage}>Request Persistent Storage</AppButton>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
                  On iPhone, open this site in Safari and use Share → Add to Home Screen. Persistent storage helps protect Jennifer’s saved data. Full offline cache turns on automatically after the hosted site includes a same-origin service worker over HTTPS.
                </div>
              </AppCardContent>
            </AppCard>
            <div className="space-y-3">
              {accountSummaries.map((account) => {
                const ledgerEntries = accountLedgerMap.get(account.id) || [];
                let runningBalance = account.openingBalance;
                return (
                  <AppCard key={account.id}>
                    <AppCardContent>
                      <div className="flex items-start justify-between gap-3">
                        <div><div className="font-semibold">{account.name}</div><div className="mt-1 text-sm text-slate-500">{account.type}</div></div>
                        <div className="flex gap-2">
                          <AppButton size="icon" variant="outline" onClick={() => setAccountDialog({ open: true, item: account })}><Pencil className="h-4 w-4" /></AppButton>
                          <AppButton size="icon" variant="outline" disabled={accounts.length <= 1} onClick={() => removeAccount(account.id)}><Trash2 className="h-4 w-4" /></AppButton>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                        <Stat label="Account Balance" value={currency(account.openingBalance)} />
                        <Stat label="Deposits" value={currency(account.deposits)} />
                        <Stat label="Bills" value={currency(account.billTotal)} />
                        <Stat label="Debt" value={currency(account.debtTotal)} />
                        <Stat label="Expenses" value={currency(account.expenseTotal)} />
                        <Stat label="Extra Debt" value={currency(account.extraDebtTotal)} />
                        <div className="col-span-2"><Stat label="Projected" value={currency(account.projectedBalance)} /></div>
                      </div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3"><div className="mb-2 text-sm text-slate-500">Linked Paychecks</div><div className="flex flex-wrap gap-2">{account.linkedPaychecks.length ? account.linkedPaychecks.map((paycheck) => <PaycheckPill key={paycheck} paycheck={paycheck} />) : <span className="text-sm text-slate-500">No paychecks linked.</span>}</div></div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-600"><Wallet className="h-4 w-4" /> Projected Ledger</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between rounded-xl bg-white p-3"><div><div className="font-medium">Starting Balance</div><div className="text-xs text-slate-500">Day 1</div></div><div className="font-semibold">{currency(account.openingBalance)}</div></div>
                          {ledgerEntries.length ? ledgerEntries.map((entry) => {
                            runningBalance += entry.kind === 'deposit' ? entry.amount : -entry.amount;
                            return <div key={entry.id} className="rounded-xl bg-white p-3"><div className="flex items-start justify-between gap-3"><div><div className="font-medium">{entry.label}</div><div className="text-xs text-slate-500">Day {entry.day} • {entry.subtitle}</div>{entry.status ? <div className="mt-1 text-[11px] text-slate-500">{entry.status}</div> : null}</div><div className="text-right"><div className={`font-semibold ${entry.kind === 'deposit' ? 'text-emerald-700' : 'text-slate-900'}`}>{entry.kind === 'deposit' ? '+' : '-'}{currency(entry.amount)}</div><div className="mt-1 text-xs text-slate-500">Running: {currency(runningBalance)}</div></div></div></div>;
                          }) : <div className="rounded-xl bg-white p-3 text-slate-500">No transactions yet for this month.</div>}
                        </div>
                      </div>
                    </AppCardContent>
                  </AppCard>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <BillDialog state={billDialog} setState={setBillDialog} onSave={(item) => { if (billDialog.item) setBills((prev) => prev.map((bill) => (bill.id === item.id ? item : bill))); else setBills((prev) => [...prev, item]); }} />
      <DebtDialog state={debtDialog} setState={setDebtDialog} onSave={(item) => { if (debtDialog.item) setDebts((prev) => prev.map((debt) => (debt.id === item.id ? item : debt))); else setDebts((prev) => [...prev, item]); }} />
      <ExpenseDialog state={expenseDialog} setState={setExpenseDialog} onSave={(item) => { if (expenseDialog.item) setExpenses((prev) => prev.map((expense) => (expense.id === item.id ? item : expense))); else setExpenses((prev) => [...prev, item]); }} />
      <PaycheckDialog state={paycheckDialog} setState={setPaycheckDialog} settings={paycheckSettings} onSave={(name, values) => setPaycheckSettings((prev) => ({ ...prev, [name]: values }))} />
      <AccountDialog state={accountDialog} setState={setAccountDialog} paycheckAccountMap={paycheckAccountMap} onAssignPaycheck={(paycheck, accountId) => setPaycheckAccountMap((prev) => ({ ...prev, [paycheck]: accountId }))} onSave={(item) => { if (accountDialog.item) setAccounts((prev) => prev.map((account) => (account.id === item.id ? item : account))); else setAccounts((prev) => [...prev, item]); }} />
      <CustomPaycheckDialog state={customPaycheckDialog} setState={setCustomPaycheckDialog} accounts={accounts} onSave={(item) => { if (customPaycheckDialog.item) setCustomPaychecks((prev) => prev.map((check) => (check.id === item.id ? item : check))); else setCustomPaychecks((prev) => [...prev, item]); }} />
    </div>
  );
}
