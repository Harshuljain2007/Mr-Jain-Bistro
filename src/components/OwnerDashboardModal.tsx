import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  LogOut,
  Plus,
  Printer,
  Trash2,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CATEGORY_LABELS,
  DEFAULT_SHOP_SETTINGS,
  formatINR,
  type CustomerReview,
  type DiningTable,
  type MenuCategory,
  type MenuItem,
  type OrderRecord,
  type OrderStatus,
  type ShopSettings,
  type TableStatus,
} from '../data/coffeeData';
import { auth, formatAuthError, googleProvider, isOwnerUser } from '../firebase';
import {
  deleteContactMessage,
  deleteCustomerReview,
  deleteDiningTable,
  deleteMenuItem,
  deleteOrder,
  saveShopSettings,
  seedDatabaseDefaults,
  subscribeAllMenuItems,
  subscribeAllOrders,
  subscribeAllReviews,
  subscribeAllTables,
  subscribeContactMessages,
  updateContactMessageStatus,
  updateOrderStatus,
  updateReviewApproval,
  upsertDiningTable,
  upsertMenuItem,
  type ContactMessageRecord,
  type ContactStatus,
} from '../services/coffeeDb';

interface OwnerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  authReady: boolean;
  currentSettings: ShopSettings;
  settingsFromDb: boolean;
  menuFromDb: boolean;
  reviewsFromDb: boolean;
  tablesFromDb: boolean;
  onSelectTableAndBrowseMenu: (tableId: string) => void;
}

type DashboardTab =
  | 'orders'
  | 'tables'
  | 'details'
  | 'menu'
  | 'reviews'
  | 'messages';

type SalesPeriod = 'all' | 'today' | '7d' | '30d';

const SALES_PERIOD_LABELS: Record<SalesPeriod, string> = {
  all: 'All Time',
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
};

const EMPTY_NEW_ITEM: MenuItem = {
  id: '',
  name: '',
  category: 'espresso',
  categoryLabel: CATEGORY_LABELS.espresso,
  price: 220,
  size: '10 oz',
  description: '',
  tastingNotes: '',
  originOrPrep: '',
  temperatures: ['Hot'],
  dairyFreeAvailable: true,
  caffeineFree: false,
  isAvailable: true,
  sortOrder: 180,
};

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  cancelled: 'Cancelled',
};

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function OwnerDashboardModal({
  isOpen,
  onClose,
  user,
  authReady,
  currentSettings,
  settingsFromDb,
  menuFromDb,
  reviewsFromDb,
  tablesFromDb,
  onSelectTableAndBrowseMenu,
}: OwnerDashboardModalProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('orders');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthBusy, setIsAuthBusy] = useState(false);

  // Orders & Tables
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [orderFilterTable, setOrderFilterTable] = useState<string>('all');
  const [orderFilterStatus, setOrderFilterStatus] = useState<'all' | 'active' | OrderStatus>('all');
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableLabel, setNewTableLabel] = useState('');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [tableError, setTableError] = useState<string | null>(null);

  // Shop settings draft
  const [draftSettings, setDraftSettings] = useState<ShopSettings>(currentSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Menu management
  const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
  const [newItem, setNewItem] = useState<MenuItem>(EMPTY_NEW_ITEM);
  const [menuNotice, setMenuNotice] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Reviews & Messages
  const [allReviews, setAllReviews] = useState<CustomerReview[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);

  const isVerifiedAdmin = isOwnerUser(user?.email, user?.emailVerified);

  useEffect(() => {
    setDraftSettings(currentSettings);
  }, [currentSettings]);

  useEffect(() => {
    if (!isOpen || !authReady || !isVerifiedAdmin) return;

    const unsubOrders = subscribeAllOrders(setOrders);
    const unsubTables = subscribeAllTables(setTables);
    const unsubMenu = subscribeAllMenuItems(setAllMenuItems);
    const unsubReviews = subscribeAllReviews(setAllReviews);
    const unsubMessages = subscribeContactMessages(setMessages);

    return () => {
      unsubOrders();
      unsubTables();
      unsubMenu();
      unsubReviews();
      unsubMessages();
    };
  }, [isOpen, authReady, isVerifiedAdmin]);

  const periodOrders = useMemo(() => {
    if (salesPeriod === 'all') return orders;
    const now = new Date();
    let cutoffMs = 0;
    if (salesPeriod === 'today') {
      cutoffMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (salesPeriod === '7d') {
      cutoffMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (salesPeriod === '30d') {
      cutoffMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }
    return orders.filter((o) => (o.createdAtMs ?? 0) >= cutoffMs);
  }, [orders, salesPeriod]);

  const orderStats = useMemo(() => {
    const pending = periodOrders.filter((o) => o.status === 'pending').length;
    const preparing = periodOrders.filter((o) => o.status === 'preparing').length;
    const ready = periodOrders.filter((o) => o.status === 'ready').length;
    const served = periodOrders.filter((o) => o.status === 'served').length;
    const cancelled = periodOrders.filter((o) => o.status === 'cancelled').length;
    const active = pending + preparing + ready;
    const validOrders = periodOrders.filter((o) => o.status !== 'cancelled');
    const totalSales = validOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const servedSales = periodOrders
      .filter((o) => o.status === 'served')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const avgOrderValue = validOrders.length > 0 ? totalSales / validOrders.length : 0;
    return {
      pending,
      preparing,
      ready,
      served,
      cancelled,
      active,
      totalOrders: periodOrders.length,
      validOrdersCount: validOrders.length,
      totalSales,
      servedSales,
      avgOrderValue,
    };
  }, [periodOrders]);

  const filteredOrders = useMemo(() => {
    return periodOrders.filter((order) => {
      if (orderFilterTable !== 'all' && order.tableId !== orderFilterTable) return false;
      if (orderFilterStatus === 'active') {
        return ['pending', 'preparing', 'ready'].includes(order.status);
      }
      if (orderFilterStatus !== 'all' && order.status !== orderFilterStatus) return false;
      return true;
    });
  }, [periodOrders, orderFilterTable, orderFilterStatus]);

  if (!isOpen) return null;

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://mrjainbistro.app/';

  const handleSignIn = async () => {
    setAuthError(null);
    setIsAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOut(auth);
  };

  const handleSeedDefaults = async () => {
    setMenuNotice(null);
    setMenuError(null);
    setSeeding(true);
    try {
      await seedDatabaseDefaults(
        !settingsFromDb,
        !menuFromDb || allMenuItems.length === 0,
        !reviewsFromDb || allReviews.length === 0,
        !tablesFromDb || tables.length === 0
      );
      setMenuNotice('Shop details, menu items, tables, and reviews saved to Firestore.');
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Failed to seed database.');
    } finally {
      setSeeding(false);
    }
  };

  const handleAddTable = async (e: FormEvent) => {
    e.preventDefault();
    setTableError(null);
    const num = newTableNumber.trim();
    const label = newTableLabel.trim();
    if (!num || !label) {
      setTableError('Enter both a table code (e.g. T7) and label.');
      return;
    }
    const id = num.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!id) {
      setTableError('Table code must contain letters or numbers.');
      return;
    }
    try {
      await upsertDiningTable({
        id,
        tableNumber: num,
        label,
        seats: newTableSeats,
        status: 'available',
        isActive: true,
        sortOrder: tables.length * 10 + 10,
      });
      setNewTableNumber('');
      setNewTableLabel('');
      setNewTableSeats(4);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Failed to add table.');
    }
  };

  const handleDownloadQrSvg = (tableId: string, label: string) => {
    const svgEl = document.getElementById(`owner-qr-svg-${tableId}`);
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-qr.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSalesCsv = (useFilteredOnly = false) => {
    const records = useFilteredOnly ? filteredOrders : periodOrders;
    const nonCancelled = records.filter((o) => o.status !== 'cancelled');
    const totalSalesAmount = nonCancelled.reduce((sum, o) => sum + o.totalAmount, 0);
    const servedCount = records.filter((o) => o.status === 'served').length;
    const cancelledCount = records.filter((o) => o.status === 'cancelled').length;
    const activeCount = records.length - servedCount - cancelledCount;

    const header = [
      'Order Number',
      'Date & Time',
      'Table',
      'Customer Name',
      'Items Ordered',
      'Status',
      'Notes',
      'Amount (INR)',
    ];

    const rows = records.map((order) => {
      const itemsSummary = order.items
        .map((it) => `${it.quantity}x ${it.name} (${formatINR(it.price * it.quantity)})`)
        .join('; ');
      return [
        order.orderNumber,
        order.createdAtText,
        order.tableLabel,
        order.customerName,
        itemsSummary,
        ORDER_STATUS_LABELS[order.status],
        order.notes || '',
        order.totalAmount.toFixed(2),
      ];
    });

    const summaryRows = [
      [],
      ['Sales Report Summary', '', '', '', '', '', '', ''],
      ['Shop Name', currentSettings.name, '', '', '', '', '', ''],
      ['Period', SALES_PERIOD_LABELS[salesPeriod], '', '', '', '', '', ''],
      ['Scope', useFilteredOnly ? 'Filtered Orders' : 'All Orders in Period', '', '', '', '', '', ''],
      ['Total Orders', records.length, '', '', '', '', '', ''],
      ['Active Orders', activeCount, '', '', '', '', '', ''],
      ['Served Orders', servedCount, '', '', '', '', '', ''],
      ['Cancelled Orders', cancelledCount, '', '', '', '', '', ''],
      ['Total Sales (INR, excl. cancelled)', totalSalesAmount.toFixed(2), '', '', '', '', '', ''],
    ];

    const csvLines = [header, ...rows, ...summaryRows]
      .map((line) => line.map(escapeCsvCell).join(','))
      .join('\r\n');

    // UTF-8 BOM ensures Excel displays the ₹ symbol cleanly
    const blob = new Blob([`\uFEFF${csvLines}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const scopeSlug = useFilteredOnly ? 'filtered' : salesPeriod;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `mr-jain-bistro-sales-${scopeSlug}-${dateStamp}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    setExportNotice(
      `Exported ${records.length} ${records.length === 1 ? 'order' : 'orders'} (${formatINR(totalSalesAmount)} total sales) to CSV.`
    );
  };

  const handleResetMenuToInrDefaults = async () => {
    setMenuNotice(null);
    setMenuError(null);
    setSeeding(true);
    try {
      await seedDatabaseDefaults(false, true, false, false);
      setMenuNotice('Updated default menu items to Indian Rupee (₹) pricing in Firestore.');
    } catch (err) {
      setMenuError(
        err instanceof Error ? err.message : 'Unable to update default ₹ prices.'
      );
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSettingsNotice(null);
    setSettingsError(null);
    setSavingSettings(true);
    try {
      await saveShopSettings(draftSettings);
      setSettingsNotice('Shop details saved to Firestore.');
    } catch (err) {
      setSettingsError(
        err instanceof Error ? err.message : 'Failed to save shop details.'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    setMenuNotice(null);
    setMenuError(null);
    if (!newItem.name.trim() || !newItem.description.trim()) {
      setMenuError('Please enter at least a name and description.');
      return;
    }

    try {
      const slug = newItem.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
      await upsertMenuItem({
        ...newItem,
        id: `${slug || 'item'}-${Date.now().toString(36)}`,
        categoryLabel: CATEGORY_LABELS[newItem.category],
        tastingNotes: newItem.tastingNotes.trim() || 'Seasonal house profile',
        originOrPrep: newItem.originOrPrep.trim() || 'Prepared fresh to order',
        sortOrder: allMenuItems.length * 10 + 10,
      });
      setNewItem(EMPTY_NEW_ITEM);
      setMenuNotice('Menu item added to Firestore.');
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Unable to add menu item.');
    }
  };

  const handleToggleItemAvailability = async (item: MenuItem) => {
    setMenuError(null);
    try {
      await upsertMenuItem({ ...item, isAvailable: !item.isAvailable });
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Unable to update item.');
    }
  };

  const handleUpdateItemPrice = async (item: MenuItem, nextPriceRaw: string) => {
    const parsed = Number(nextPriceRaw);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 50000) return;
    try {
      await upsertMenuItem({ ...item, price: parsed });
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : 'Unable to update price.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-dashboard-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2
              id="owner-dashboard-title"
              className="font-display text-xl font-medium text-zinc-900"
            >
              Owner Dashboard
            </h2>
            <p className="text-xs text-zinc-500">
              Live Orders · Ordered Tables · Table QR Codes · Menu · Reviews · Messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign Out
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Owner Dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {!authReady ? (
            <p className="py-12 text-center text-sm text-zinc-500">Checking session...</p>
          ) : !user ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <Database className="mx-auto h-8 w-8 text-[#1C4A38]" strokeWidth={1.5} />
              <h3 className="mt-3 font-display text-2xl font-medium text-zinc-900">
                Sign in to open Owner Dashboard
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                Sign in with the shop owner&apos;s verified Google email to manage live
                orders, table QR codes, shop details, menu items, and inquiries.
              </p>
              {authError && (
                <p className="mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
              <button
                type="button"
                disabled={isAuthBusy}
                onClick={handleSignIn}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1C4A38] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
              >
                {isAuthBusy ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          ) : !isVerifiedAdmin ? (
            <div className="mx-auto max-w-md py-8 text-center">
              <AlertCircle className="mx-auto h-8 w-8 text-red-700" strokeWidth={1.5} />
              <h3 className="mt-3 font-display text-xl font-medium text-zinc-900">
                Owner access required
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Signed in as <span className="font-medium text-zinc-900">{user.email}</span>.
                The Owner Dashboard can only be accessed with the verified shop owner email.
              </p>
            </div>
          ) : (
            <div>
              {(!settingsFromDb || !menuFromDb || !reviewsFromDb || !tablesFromDb) && (
                <div className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Initialize Firestore with starter data
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      Save starter shop details, menu items, café tables (T1–T6), and customer
                      reviews to Firestore so you can manage everything live.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={seeding}
                    onClick={handleSeedDefaults}
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-lg bg-[#1C4A38] px-4 py-2 text-xs font-medium text-white hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
                  >
                    {seeding ? 'Saving...' : 'Initialize Database'}
                  </button>
                </div>
              )}

              {/* Dashboard Tabs */}
              <div className="mb-6 flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-1">
                {(
                  [
                    { id: 'orders', label: `Orders (${orders.length})` },
                    { id: 'tables', label: `Ordered Tables & QR (${tables.length})` },
                    { id: 'details', label: 'Shop Details' },
                    { id: 'menu', label: `Menu (${allMenuItems.length})` },
                    { id: 'reviews', label: `Reviews (${allReviews.length})` },
                    { id: 'messages', label: `Messages (${messages.length})` },
                  ] as { id: DashboardTab; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[38px] rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white text-zinc-900 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: LIVE ORDERS & TOTAL SALES */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  {/* Sales & Orders Overview + Export */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 overflow-hidden">
                    <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3.5 sm:flex-row sm:items-center">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold tracking-wide text-zinc-700 uppercase">
                          Sales Overview
                        </span>
                        <div
                          role="tablist"
                          aria-label="Sales summary period"
                          className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-100 p-0.5"
                        >
                          {(Object.keys(SALES_PERIOD_LABELS) as SalesPeriod[]).map((period) => (
                            <button
                              key={period}
                              type="button"
                              role="tab"
                              aria-selected={salesPeriod === period}
                              onClick={() => {
                                setSalesPeriod(period);
                                setExportNotice(null);
                              }}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                                salesPeriod === period
                                  ? 'bg-white text-zinc-900 shadow-xs'
                                  : 'text-zinc-600 hover:text-zinc-900'
                              }`}
                            >
                              {SALES_PERIOD_LABELS[period]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(orderFilterTable !== 'all' || orderFilterStatus !== 'all') && (
                          <button
                            type="button"
                            disabled={filteredOrders.length === 0}
                            onClick={() => handleExportSalesCsv(true)}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" aria-hidden="true" />
                            Export Filtered ({filteredOrders.length})
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={periodOrders.length === 0}
                          onClick={() => handleExportSalesCsv(false)}
                          className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#1C4A38] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15392B] disabled:opacity-50 cursor-pointer"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                          Export Total Sales (CSV)
                        </button>
                      </div>
                    </div>

                    {/* 4-column Total Sales & Total Orders KPI strip */}
                    <div className="grid grid-cols-2 divide-y divide-zinc-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                      <div className="p-4">
                        <p className="text-xs font-medium text-zinc-500">Total Sales</p>
                        <p className="mt-1 text-2xl font-semibold text-[#1C4A38] tabular-nums">
                          {formatINR(orderStats.totalSales)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                          Served: {formatINR(orderStats.servedSales)}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-medium text-zinc-500">Total Orders</p>
                        <p className="mt-1 text-2xl font-semibold text-zinc-900 tabular-nums">
                          {orderStats.totalOrders}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                          {orderStats.served} served · {orderStats.cancelled} cancelled
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-medium text-zinc-500">Avg. Order Value</p>
                        <p className="mt-1 text-2xl font-semibold text-zinc-900 tabular-nums">
                          {formatINR(orderStats.avgOrderValue)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                          {orderStats.validOrdersCount} non-cancelled
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-xs font-medium text-zinc-500">Active Bar Queue</p>
                        <p className="mt-1 text-2xl font-semibold text-zinc-900 tabular-nums">
                          {orderStats.active}
                        </p>
                        <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">
                          {orderStats.pending} pend · {orderStats.preparing} prep · {orderStats.ready} ready
                        </p>
                      </div>
                    </div>

                    {exportNotice && (
                      <div className="flex items-center justify-between gap-2 border-t border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-[#1C4A38]">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{exportNotice}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExportNotice(null)}
                          className="text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          aria-label="Dismiss export notice"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={orderFilterTable}
                        onChange={(e) => setOrderFilterTable(e.target.value)}
                        aria-label="Filter orders by table"
                        className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800"
                      >
                        <option value="all">All Tables &amp; Pickup</option>
                        <option value="counter">Counter Pickup</option>
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={orderFilterStatus}
                        onChange={(e) =>
                          setOrderFilterStatus(
                            e.target.value as 'all' | 'active' | OrderStatus
                          )
                        }
                        aria-label="Filter orders by status"
                        className="h-9 rounded-lg border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-800"
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active Kitchen Queue</option>
                        <option value="pending">Pending</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="served">Served</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <p className="text-xs text-zinc-500 tabular-nums">
                      Showing {filteredOrders.length} of {periodOrders.length} orders
                    </p>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center">
                      <p className="text-sm font-medium text-zinc-900">
                        No orders match the current filter.
                      </p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Orders placed via the menu or Table QR codes appear here immediately.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="rounded-xl border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 tabular-nums">
                                {order.orderNumber} · {order.tableLabel}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {order.customerName} · {order.createdAtText} ·{' '}
                                <span className="font-semibold text-zinc-900 tabular-nums">
                                  {formatINR(order.totalAmount)}
                                </span>
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  updateOrderStatus(
                                    order.id,
                                    e.target.value as OrderStatus
                                  )
                                }
                                aria-label={`Status for order ${order.orderNumber}`}
                                className="h-8 rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900"
                              >
                                {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
                                  <option key={val} value={val}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => deleteOrder(order.id)}
                                aria-label={`Delete order ${order.orderNumber}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-700">
                            {order.items.map((it) => (
                              <li key={it.id} className="flex justify-between gap-2">
                                <span>
                                  <span className="font-semibold tabular-nums">
                                    {it.quantity}×
                                  </span>{' '}
                                  {it.name}
                                </span>
                                <span className="shrink-0 tabular-nums">
                                  {formatINR(it.price * it.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {order.notes && (
                            <p className="mt-2 rounded bg-zinc-50 px-3 py-1.5 text-xs text-zinc-600">
                              Note: {order.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ORDERED TABLES & QR CODES */}
              {activeTab === 'tables' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddTable}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        Add Dining Table &amp; Generate QR Code
                      </p>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                      >
                        <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                        Print All QR Cards
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Code (e.g. T7)"
                        maxLength={20}
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Label (e.g. Table 7 · Balcony)"
                        maxLength={60}
                        value={newTableLabel}
                        onChange={(e) => setNewTableLabel(e.target.value)}
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm sm:col-span-2"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={newTableSeats}
                          onChange={(e) => setNewTableSeats(Number(e.target.value))}
                          aria-label="Seat count"
                          className="h-10 w-20 rounded-lg border border-zinc-300 bg-white px-3 text-sm tabular-nums"
                        />
                        <button
                          type="submit"
                          className="inline-flex flex-1 min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-[#1C4A38] px-3 py-2 text-xs font-medium text-white hover:bg-[#15392B] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add Table
                        </button>
                      </div>
                    </div>
                    {tableError && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{tableError}</span>
                      </p>
                    )}
                  </form>

                  {tables.length === 0 ? (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      No tables saved in Firestore yet. Click &ldquo;Initialize Database&rdquo;
                      above or add your first dining table.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {tables.map((table) => {
                        const activeOrdersOnTable = orders.filter(
                          (o) =>
                            o.tableId === table.id &&
                            ['pending', 'preparing', 'ready'].includes(o.status)
                        ).length;
                        const tableUrl = `${baseUrl}?table=${encodeURIComponent(table.id)}#menu`;

                        return (
                          <div
                            key={table.id}
                            className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="text-sm font-semibold text-zinc-900">
                                    {table.label}
                                  </h3>
                                  <p className="text-xs text-zinc-500 tabular-nums">
                                    {table.seats} seats · {activeOrdersOnTable} active{' '}
                                    {activeOrdersOnTable === 1 ? 'order' : 'orders'}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteDiningTable(table.id)}
                                  aria-label={`Delete ${table.label}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="mt-3 flex justify-center rounded-lg border border-zinc-200 bg-[#FAFAFA] p-3">
                                <QRCodeSVG
                                  id={`owner-qr-svg-${table.id}`}
                                  value={tableUrl}
                                  size={128}
                                  level="M"
                                  fgColor="#18181B"
                                  bgColor="#FFFFFF"
                                />
                              </div>

                              <div className="mt-3">
                                <label className="block text-[11px] font-medium text-zinc-500">
                                  Table Status
                                </label>
                                <select
                                  value={table.status}
                                  onChange={(e) =>
                                    upsertDiningTable({
                                      ...table,
                                      status: e.target.value as TableStatus,
                                    })
                                  }
                                  className="mt-1 h-9 w-full rounded-lg border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-900"
                                >
                                  <option value="available">Available</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="reserved">Reserved</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTableAndBrowseMenu(table.id);
                                  onClose();
                                }}
                                className="inline-flex flex-1 min-h-[36px] items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 cursor-pointer"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Test Order
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadQrSvg(table.id, table.label)}
                                className="inline-flex min-h-[36px] items-center justify-center gap-1 rounded-lg bg-[#1C4A38] px-3 py-1 text-xs font-medium text-white hover:bg-[#15392B] cursor-pointer"
                              >
                                <Download className="h-3 w-3" />
                                SVG
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SHOP DETAILS */}
              {activeTab === 'details' && (
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Shop Name
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={draftSettings.name}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, name: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Neighborhood
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={draftSettings.neighborhood}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, neighborhood: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={140}
                        value={draftSettings.address}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, address: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        City, State &amp; ZIP
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={draftSettings.cityStateZip}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, cityStateZip: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Public Contact Email
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={120}
                        value={draftSettings.email}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, email: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={40}
                        value={draftSettings.phone}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, phone: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={160}
                      value={draftSettings.heroHeadline}
                      onChange={(e) =>
                        setDraftSettings((p) => ({ ...p, heroHeadline: e.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700">
                      Hero Description
                    </label>
                    <textarea
                      rows={2}
                      required
                      maxLength={400}
                      value={draftSettings.heroDescription}
                      onChange={(e) =>
                        setDraftSettings((p) => ({ ...p, heroDescription: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-zinc-300 p-3 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Monday – Friday Hours
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={draftSettings.weekdayHours}
                        onChange={(e) =>
                          setDraftSettings((p) => ({
                            ...p,
                            weekdayHours: e.target.value,
                            hoursSummary: e.target.value,
                          }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Saturday Hours
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={draftSettings.saturdayHours}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, saturdayHours: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-700">
                        Sunday Hours
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={draftSettings.sundayHours}
                        onChange={(e) =>
                          setDraftSettings((p) => ({ ...p, sundayHours: e.target.value }))
                        }
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 px-3 text-sm"
                      />
                    </div>
                  </div>

                  {settingsNotice && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[#1C4A38]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{settingsNotice}</span>
                    </p>
                  )}
                  {settingsError && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{settingsError}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDraftSettings(DEFAULT_SHOP_SETTINGS)}
                      className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      Load Mr. Jain Bistro Defaults
                    </button>
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="inline-flex min-h-[42px] items-center justify-center rounded-lg bg-[#1C4A38] px-5 py-2 text-sm font-medium text-white hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
                    >
                      {savingSettings ? 'Saving...' : 'Save Shop Details'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 4: MENU ITEMS */}
              {activeTab === 'menu' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddItem}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        Add New Menu Item
                      </p>
                      <button
                        type="button"
                        disabled={seeding}
                        onClick={handleResetMenuToInrDefaults}
                        className="inline-flex min-h-[32px] items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 cursor-pointer"
                      >
                        {seeding ? 'Updating...' : 'Apply Default ₹ Menu Prices'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <input
                        type="text"
                        placeholder="Item name"
                        maxLength={80}
                        value={newItem.name}
                        onChange={(e) =>
                          setNewItem((p) => ({ ...p, name: e.target.value }))
                        }
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm sm:col-span-2"
                      />
                      <select
                        value={newItem.category}
                        onChange={(e) =>
                          setNewItem((p) => ({
                            ...p,
                            category: e.target.value as MenuCategory,
                          }))
                        }
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                      >
                        <option value="espresso">Espresso &amp; Milk</option>
                        <option value="filter">Pour Over &amp; Cold</option>
                        <option value="tea">Tea &amp; Matcha</option>
                        <option value="bakery">Morning Bakery</option>
                      </select>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="50000"
                          value={newItem.price}
                          onChange={(e) =>
                            setNewItem((p) => ({ ...p, price: Number(e.target.value) }))
                          }
                          aria-label="Price in INR"
                          placeholder="₹220"
                          className="h-10 w-24 rounded-lg border border-zinc-300 bg-white px-3 text-sm tabular-nums"
                        />
                        <input
                          type="text"
                          placeholder="Size"
                          maxLength={30}
                          value={newItem.size}
                          onChange={(e) =>
                            setNewItem((p) => ({ ...p, size: e.target.value }))
                          }
                          className="h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Short description"
                        maxLength={240}
                        value={newItem.description}
                        onChange={(e) =>
                          setNewItem((p) => ({ ...p, description: e.target.value }))
                        }
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Tasting notes"
                        maxLength={160}
                        value={newItem.tastingNotes}
                        onChange={(e) =>
                          setNewItem((p) => ({ ...p, tastingNotes: e.target.value }))
                        }
                        className="h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1C4A38] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#15392B] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add Item
                      </button>
                    </div>
                  </form>

                  {menuNotice && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[#1C4A38]">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>{menuNotice}</span>
                    </p>
                  )}
                  {menuError && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{menuError}</span>
                    </p>
                  )}

                  <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                    {allMenuItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-3 p-3.5 sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900">
                            {item.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {item.categoryLabel} · {item.size}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <label className="flex items-center gap-1 text-xs text-zinc-600">
                            ₹
                            <input
                              type="number"
                              step="1"
                              min="0"
                              max="50000"
                              key={`${item.id}-${item.price}`}
                              defaultValue={item.price}
                              onBlur={(e) =>
                                handleUpdateItemPrice(item, e.target.value)
                              }
                              aria-label={`Price in rupees for ${item.name}`}
                              className="h-8 w-20 rounded border border-zinc-300 px-2 text-xs tabular-nums"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => handleToggleItemAvailability(item)}
                            className={`min-h-[32px] rounded-md border px-2.5 text-xs font-medium cursor-pointer ${
                              item.isAvailable
                                ? 'border-[#1C4A38] bg-[#1C4A38]/10 text-[#1C4A38]'
                                : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                            }`}
                          >
                            {item.isAvailable ? 'Visible' : 'Hidden'}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteMenuItem(item.id)}
                            aria-label={`Delete ${item.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-3">
                  {allReviews.length === 0 ? (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      No reviews in Firestore yet.
                    </p>
                  ) : (
                    allReviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              {review.authorName}{' '}
                              <span className="font-normal text-zinc-500">
                                · {review.authorRole}
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500 tabular-nums">
                              {review.rating}.0 / 5.0 · Favorite: {review.favoriteItem}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateReviewApproval(
                                  review.id,
                                  !review.isApproved,
                                  review.sortOrder
                                )
                              }
                              className={`min-h-[32px] rounded-md border px-2.5 text-xs font-medium cursor-pointer ${
                                review.isApproved
                                  ? 'border-[#1C4A38] bg-[#1C4A38]/10 text-[#1C4A38]'
                                  : 'border-zinc-300 bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {review.isApproved ? 'Published' : 'Pending'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCustomerReview(review.id)}
                              aria-label={`Delete review from ${review.authorName}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-zinc-700">&ldquo;{review.quote}&rdquo;</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-zinc-500">
                      No contact form submissions yet.
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-xl border border-zinc-200 bg-white p-4"
                      >
                        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">
                              {msg.name}{' '}
                              <span className="font-normal text-zinc-500">
                                ({msg.email})
                              </span>
                            </p>
                            <p className="text-xs text-zinc-500">
                              {msg.topic} · {msg.createdAtText}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={msg.status}
                              onChange={(e) =>
                                updateContactMessageStatus(
                                  msg.id,
                                  e.target.value as ContactStatus
                                )
                              }
                              aria-label={`Status for message from ${msg.name}`}
                              className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-800"
                            >
                              <option value="new">New</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => deleteContactMessage(msg.id)}
                              aria-label={`Delete message from ${msg.name}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-red-50 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-line text-sm text-zinc-700">
                          {msg.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
