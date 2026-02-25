type SortMode = "recent" | "price_desc" | "price_asc" | "name";

type Props = {
  visible: boolean;
  searchTerm: string;
  sortBy: SortMode;
  onSearchTermChange: (value: string) => void;
  onSortByChange: (value: SortMode) => void;
};

export default function BudgetsToolbar({
  visible,
  searchTerm,
  sortBy,
  onSearchTermChange,
  onSortByChange,
}: Props) {
  if (!visible) return null;

  return (
    <div className="mt-4 sticky top-20 z-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 rounded-xl bg-slate-50/95 backdrop-blur-sm py-1">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        placeholder="Buscar por nome, cliente ou projeto"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
      />

      <div className="flex items-center gap-2">
        <label htmlFor="budgets-sort" className="text-sm text-slate-600 whitespace-nowrap">
          Ordenar:
        </label>
        <select
          id="budgets-sort"
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as SortMode)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
        >
          <option value="recent">Mais recente</option>
          <option value="price_desc">Maior preço</option>
          <option value="price_asc">Menor preço</option>
          <option value="name">Nome (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
