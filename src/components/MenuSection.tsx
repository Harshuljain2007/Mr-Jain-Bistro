import { useMemo, useState } from 'react';
import { ChevronDown, Minus, Plus, QrCode, Search, ShoppingBag, X } from 'lucide-react';
import {
  CATEGORY_TABS,
  FEATURED_HIGHLIGHTS,
  type DiningTable,
  type MenuCategory,
  type MenuItem,
  type OrderItem,
} from '../data/coffeeData';
import { ResilientImage } from './ResilientImage';

interface MenuSectionProps {
  menuItems: MenuItem[];
  tables: DiningTable[];
  selectedTableId: string;
  onChangeTableId: (tableId: string) => void;
  cartItems: OrderItem[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateCartQuantity: (itemId: string, delta: number) => void;
  onOpenOrderDrawer: () => void;
  onOpenQrModal: () => void;
  onInquireItem: (itemName: string, topic: string) => void;
}

const CATEGORY_ORDER: MenuCategory[] = ['espresso', 'filter', 'tea', 'bakery'];

const CATEGORY_TITLES: Record<MenuCategory, string> = {
  espresso: 'Espresso & Milk',
  filter: 'Pour Over & Cold',
  tea: 'Tea & Matcha',
  bakery: 'Morning Bakery',
};

export function MenuSection({
  menuItems,
  tables,
  selectedTableId,
  onChangeTableId,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onOpenOrderDrawer,
  onOpenQrModal,
  onInquireItem,
}: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | MenuCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dairyFreeOnly, setDairyFreeOnly] = useState(false);
  const [caffeineFreeOnly, setCaffeineFreeOnly] = useState(false);
  const [icedOnly, setIcedOnly] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>('cortado');

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cartItems) {
      map.set(item.id, item.quantity);
    }
    return map;
  }, [cartItems]);

  const totalBagCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const totalBagAmount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return menuItems.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (dairyFreeOnly && !item.dairyFreeAvailable) return false;
      if (caffeineFreeOnly && !item.caffeineFree) return false;
      if (icedOnly && !item.temperatures.includes('Iced')) return false;
      if (query) {
        const haystack = `${item.name} ${item.description} ${item.tastingNotes} ${item.originOrPrep}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });
  }, [menuItems, activeCategory, searchQuery, dairyFreeOnly, caffeineFreeOnly, icedOnly]);

  const groupedItems = useMemo(() => {
    const categoriesToShow =
      activeCategory === 'all' ? CATEGORY_ORDER : [activeCategory];

    return categoriesToShow
      .map((cat) => ({
        category: cat,
        title: CATEGORY_TITLES[cat],
        items: filteredItems.filter((item) => item.category === cat),
      }))
      .filter((group) => group.items.length > 0);
  }, [activeCategory, filteredItems]);

  const hasActiveFilters =
    activeCategory !== 'all' ||
    searchQuery.trim().length > 0 ||
    dairyFreeOnly ||
    caffeineFreeOnly ||
    icedOnly;

  const resetFilters = () => {
    setActiveCategory('all');
    setSearchQuery('');
    setDairyFreeOnly(false);
    setCaffeineFreeOnly(false);
    setIcedOnly(false);
  };

  const handleSelectHighlight = (category: MenuCategory, menuItemId: string) => {
    setActiveCategory(category);
    setDairyFreeOnly(false);
    setCaffeineFreeOnly(false);
    setIcedOnly(false);
    setSearchQuery('');
    setExpandedItemId(menuItemId);
    const listEl = document.getElementById('menu-catalog');
    if (listEl) {
      listEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const toggleItem = (id: string) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  const renderMenuItemRow = (item: MenuItem) => {
    const isExpanded = expandedItemId === item.id;
    const qtyInBag = cartQtyMap.get(item.id) || 0;

    return (
      <div
        key={item.id}
        className={`border-b border-zinc-200/80 transition-colors duration-150 ${
          isExpanded ? 'bg-white' : 'hover:bg-white/70'
        }`}
      >
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <button
            type="button"
            onClick={() => toggleItem(item.id)}
            aria-expanded={isExpanded}
            className="min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
          >
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <h4 className="text-base font-semibold text-zinc-900">{item.name}</h4>
              <span className="text-xs text-zinc-500">
                {item.size}
                <span aria-hidden="true"> · </span>
                {item.temperatures.join(' or ')}
                {item.dairyFreeAvailable && item.category !== 'bakery' && (
                  <>
                    <span aria-hidden="true"> · </span>
                    Oat available
                  </>
                )}
                {item.caffeineFree && (
                  <>
                    <span aria-hidden="true"> · </span>
                    Caffeine-free
                  </>
                )}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.description}</p>
          </button>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <span className="text-sm font-semibold text-zinc-900 tabular-nums">
              ${item.price.toFixed(2)}
            </span>

            {qtyInBag > 0 ? (
              <div className="flex items-center rounded-lg border border-[#1C4A38] bg-[#1C4A38]/5">
                <button
                  type="button"
                  onClick={() => onUpdateCartQuantity(item.id, -1)}
                  aria-label={`Remove one ${item.name} from order`}
                  className="flex h-8 w-8 items-center justify-center text-[#1C4A38] hover:bg-[#1C4A38]/10 cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-xs font-semibold text-[#1C4A38] tabular-nums">
                  {qtyInBag}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateCartQuantity(item.id, 1)}
                  aria-label={`Add one more ${item.name} to order`}
                  className="flex h-8 w-8 items-center justify-center text-[#1C4A38] hover:bg-[#1C4A38]/10 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onAddToCart(item)}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-800 transition-colors hover:border-[#1C4A38] hover:text-[#1C4A38] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              aria-label={isExpanded ? `Hide notes for ${item.name}` : `Show notes for ${item.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 cursor-pointer"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${
                  isExpanded ? 'rotate-180 text-zinc-700' : ''
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-zinc-100 bg-zinc-50/70 px-4 py-3.5 sm:px-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="space-y-1 text-xs text-zinc-600">
                <p>
                  <span className="font-semibold text-zinc-800">Tasting notes:</span>{' '}
                  {item.tastingNotes}
                </p>
                <p>
                  <span className="font-semibold text-zinc-800">Origin &amp; preparation:</span>{' '}
                  {item.originOrPrep}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onInquireItem(
                    item.name,
                    item.category === 'bakery'
                      ? 'Private Events & Catering'
                      : 'Wholesale Coffee Beans'
                  )
                }
                className="self-start text-xs font-medium text-[#1C4A38] transition-colors hover:text-[#15392B] hover:underline hover:underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer sm:self-center"
              >
                Ask about catering or beans
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="menu" className="border-b border-zinc-200/80 bg-[#FAFAFA] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium tracking-wide text-[#1C4A38] uppercase">
              Daily Bar &amp; Bakery
            </p>
            <h2 className="mt-1.5 font-display text-3xl font-medium tracking-tight text-zinc-900 sm:text-4xl text-balance">
              Seasonal House Menu
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-zinc-600">
            Organic whole milk is standard on espresso drinks; house-steamed oat or almond milk
            is available on every beverage at no extra charge.
          </p>
        </div>

        {/* 4-Card Featured Signature Grid */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_HIGHLIGHTS.map((highlight) => (
            <button
              key={highlight.id}
              type="button"
              onClick={() => handleSelectHighlight(highlight.category, highlight.menuItemId)}
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-100">
                <ResilientImage
                  src={highlight.image}
                  alt={highlight.alt}
                  fallbackTitle={highlight.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  containerClassName="h-full w-full"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                  <p className="text-xs font-medium text-zinc-500">
                    {highlight.categoryLabel}
                  </p>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <h3 className="font-sans text-base font-semibold text-zinc-900">
                      {highlight.title}
                    </h3>
                    <span className="text-sm font-semibold text-zinc-900 tabular-nums shrink-0">
                      ${highlight.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    {highlight.subtitle}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Interactive Menu Controls */}
        <div id="menu-catalog" className="mt-14 scroll-mt-24 space-y-5">
          {/* Table Ordering & QR Bar */}
          <div className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="menu-table-select"
                className="text-xs font-medium text-zinc-600 whitespace-nowrap"
              >
                Order for
              </label>
              <select
                id="menu-table-select"
                value={selectedTableId}
                onChange={(e) => onChangeTableId(e.target.value)}
                className="h-9 rounded-lg border border-zinc-300 bg-[#FAFAFA] px-3 text-xs font-medium text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
              >
                <option value="counter">Counter Pickup (Walk-in)</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label} ({t.seats} seats)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenQrModal}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5 text-[#1C4A38]" aria-hidden="true" />
                Table QR Codes
              </button>
              <button
                type="button"
                onClick={onOpenOrderDrawer}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1C4A38] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15392B] whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
              >
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                {totalBagCount > 0
                  ? `View Order (${totalBagCount}) · $${totalBagAmount.toFixed(2)}`
                  : 'Order Bag (0)'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Category Segmented Tabs */}
            <div
              role="tablist"
              aria-label="Menu categories"
              className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1"
            >
              {CATEGORY_TABS.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`min-h-[38px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38] ${
                      isActive
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Dietary Toggles */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-56 sm:flex-none">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search drinks or pastries..."
                  aria-label="Search menu items"
                  className="h-10 w-full rounded-lg border border-zinc-200 bg-white pr-8 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-[#1C4A38] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-zinc-400 hover:text-zinc-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-pressed={dairyFreeOnly}
                onClick={() => setDairyFreeOnly((prev) => !prev)}
                className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  dairyFreeOnly
                    ? 'border-[#1C4A38] bg-[#1C4A38] text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                }`}
              >
                Dairy-Free
              </button>

              <button
                type="button"
                aria-pressed={caffeineFreeOnly}
                onClick={() => setCaffeineFreeOnly((prev) => !prev)}
                className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  caffeineFreeOnly
                    ? 'border-[#1C4A38] bg-[#1C4A38] text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                }`}
              >
                Caffeine-Free
              </button>

              <button
                type="button"
                aria-pressed={icedOnly}
                onClick={() => setIcedOnly((prev) => !prev)}
                className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                  icedOnly
                    ? 'border-[#1C4A38] bg-[#1C4A38] text-white'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                }`}
              >
                Iced
              </button>
            </div>
          </div>

          {/* Menu List Groups */}
          {groupedItems.length === 0 ? (
            <div className="mt-8 rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center">
              <p className="text-base font-medium text-zinc-900">
                No menu items match those filters.
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Try clearing a dietary toggle or searching with a broader keyword.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 cursor-pointer"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {groupedItems.map((group) => (
                <div key={group.category}>
                  <div className="mb-3 flex items-baseline justify-between border-b border-zinc-900/15 pb-2">
                    <h3 className="font-display text-xl font-medium text-zinc-900">
                      {group.title}
                    </h3>
                    <span className="text-xs font-medium text-zinc-500 tabular-nums">
                      {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    {group.items.map(renderMenuItemRow)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
