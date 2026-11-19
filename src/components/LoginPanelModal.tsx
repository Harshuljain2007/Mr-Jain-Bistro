import { useEffect, useMemo, useState } from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  AlertCircle,
  Check,
  Clock,
  Coffee,
  LayoutDashboard,
  LogIn,
  LogOut,
  ReceiptIndianRupee,
  X,
  XCircle,
} from 'lucide-react';
import { formatINR, type OrderRecord, type OrderStatus } from '../data/coffeeData';
import { auth, formatAuthError, googleProvider, isOwnerUser } from '../firebase';
import { subscribeMyOrders } from '../services/coffeeDb';

interface LoginPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  authReady: boolean;
  onOpenOwnerDashboard: () => void;
}

type HistoryFilter = 'all' | 'active' | 'past';

const ORDER_STEPS: { key: Exclude<OrderStatus, 'cancelled'>; label: string }[] = [
  { key: 'pending', label: 'Received' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'served', label: 'Served' },
];

const STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Sent to the espresso bar queue',
  preparing: 'Barista is crafting your order',
  ready: 'Ready for table delivery or pickup',
  served: 'Completed and served',
  cancelled: 'Order was cancelled',
};

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || 'G').trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function LoginPanelModal({
  isOpen,
  onClose,
  user,
  authReady,
  onOpenOwnerDashboard,
}: LoginPanelModalProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [myOrders, setMyOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');

  const isOwner = isOwnerUser(user?.email, user?.emailVerified);

  useEffect(() => {
    if (!isOpen || !authReady || !user) return;
    setOrdersLoading(true);
    const unsub = subscribeMyOrders(user.uid, (orders) => {
      setMyOrders(orders);
      setOrdersLoading(false);
    });
    return () => unsub();
  }, [isOpen, authReady, user]);

  const orderSummary = useMemo(() => {
    const activeCount = myOrders.filter((o) =>
      ['pending', 'preparing', 'ready'].includes(o.status)
    ).length;
    const totalSpent = myOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      totalCount: myOrders.length,
      activeCount,
      totalSpent,
    };
  }, [myOrders]);

  const filteredOrders = useMemo(() => {
    if (historyFilter === 'active') {
      return myOrders.filter((o) =>
        ['pending', 'preparing', 'ready'].includes(o.status)
      );
    }
    if (historyFilter === 'past') {
      return myOrders.filter((o) => o.status === 'served' || o.status === 'cancelled');
    }
    return myOrders;
  }, [myOrders, historyFilter]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setAuthError(null);
    setBusy(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (isOwnerUser(cred.user.email, cred.user.emailVerified)) {
        onClose();
        onOpenOwnerDashboard();
      }
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOut(auth);
    setMyOrders([]);
    setHistoryFilter('all');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            {user ? (
              <ReceiptIndianRupee className="h-5 w-5 text-[#1C4A38]" aria-hidden="true" />
            ) : (
              <LogIn className="h-5 w-5 text-[#1C4A38]" aria-hidden="true" />
            )}
            <h2
              id="login-panel-title"
              className="font-display text-xl font-medium text-zinc-900"
            >
              {user ? 'Profile & Order History' : 'Sign In'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close User Profile Modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!authReady ? (
            <p className="py-10 text-center text-sm text-zinc-500">Checking session...</p>
          ) : !user ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-display text-2xl font-medium text-zinc-900">
                  Customer &amp; Owner Access
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  Sign in with your Google account to view your order history and live
                  preparation tracking, or access the Owner Dashboard if you manage the bistro.
                </p>
              </div>

              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-600">
                <div className="p-4">
                  <p className="font-semibold text-zinc-900">For Bistro Guests</p>
                  <p className="mt-1">
                    View past receipts and track live preparation status for food and coffee
                    orders placed at your table.
                  </p>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-zinc-900">For Shop Owner</p>
                  <p className="mt-1">
                    Sign in with the registered shop owner&apos;s verified Google email to
                    unlock the Owner Dashboard (Live Orders, Ordered Tables, QR Codes, Menu
                    &amp; Inbox).
                  </p>
                </div>
              </div>

              {authError && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </p>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={handleSignIn}
                className="w-full min-h-[44px] rounded-lg bg-[#1C4A38] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
              >
                {busy ? 'Signing in...' : 'Continue with Google'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Profile Header */}
              <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1C4A38] text-sm font-semibold text-white">
                    {getInitials(user.displayName, user.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {user.displayName || 'Bistro Guest'}
                    </p>
                    <p className="truncate text-xs text-zinc-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenOwnerDashboard();
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#1C4A38] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#15392B] cursor-pointer"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                      Owner Dashboard
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Order History Summary Strip */}
              <div className="grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
                <div className="p-3.5">
                  <p className="text-xs text-zinc-500">Total Orders</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 tabular-nums">
                    {orderSummary.totalCount}
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="text-xs text-zinc-500">In Progress</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#1C4A38] tabular-nums">
                    {orderSummary.activeCount}
                  </p>
                </div>
                <div className="p-3.5">
                  <p className="text-xs text-zinc-500">Total Spent</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-900 tabular-nums">
                    {formatINR(orderSummary.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Order History Section */}
              <div>
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-display text-lg font-medium text-zinc-900">
                      Order History
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Live status updates synced directly from our bar queue
                    </p>
                  </div>

                  <div
                    role="tablist"
                    aria-label="Filter order history"
                    className="flex items-center gap-1 self-start rounded-lg bg-zinc-100 p-1"
                  >
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'active', label: 'Active' },
                        { id: 'past', label: 'Past' },
                      ] as { id: HistoryFilter; label: string }[]
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={historyFilter === tab.id}
                        onClick={() => setHistoryFilter(tab.id)}
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          historyFilter === tab.id
                            ? 'bg-white text-zinc-900 shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 py-10 text-center text-xs text-zinc-500">
                    Loading your order history from Firestore...
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
                    <Coffee className="mx-auto h-7 w-7 text-zinc-300" strokeWidth={1.5} />
                    <p className="mt-2 text-sm font-medium text-zinc-900">
                      {myOrders.length === 0
                        ? 'No orders placed under this account yet'
                        : 'No orders match this filter'}
                    </p>
                    <p className="mt-1 text-xs text-zinc-600">
                      {myOrders.length === 0
                        ? 'Add drinks or pastries from the seasonal menu while signed in to track them here.'
                        : 'Switch back to All to inspect your full order history.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const activeStepIndex = ORDER_STEPS.findIndex(
                        (s) => s.key === order.status
                      );

                      return (
                        <article
                          key={order.id}
                          className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5"
                        >
                          <div className="border-b border-zinc-100 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                                    {order.orderNumber}
                                  </span>
                                  <span className="text-xs font-medium text-zinc-600">
                                    · {order.tableLabel}
                                  </span>
                                </div>
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span>{order.createdAtText}</span>
                                </p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-zinc-900 tabular-nums sm:text-base">
                                {formatINR(order.totalAmount)}
                              </p>
                            </div>
                            <p
                              className={`mt-2 text-xs font-medium ${
                                order.status === 'cancelled'
                                  ? 'text-red-700'
                                  : 'text-[#1C4A38]'
                              }`}
                            >
                              {STATUS_DESCRIPTIONS[order.status]}
                            </p>
                          </div>

                          {/* 4-Step Live Status Tracker */}
                          {order.status === 'cancelled' ? (
                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-medium text-red-800">
                              <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>This order was cancelled.</span>
                            </div>
                          ) : (
                            <div className="mt-4">
                              <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                                {ORDER_STEPS.map((step, idx) => {
                                  const isDone = idx < activeStepIndex;
                                  const isCurrent = idx === activeStepIndex;
                                  const isFilled = isDone || isCurrent;

                                  return (
                                    <div key={step.key} className="min-w-0 space-y-1.5">
                                      <div
                                        className={`h-1.5 w-full rounded-full transition-colors ${
                                          isFilled ? 'bg-[#1C4A38]' : 'bg-zinc-200'
                                        }`}
                                      />
                                      <div className="flex flex-col items-center gap-0.5 text-center sm:flex-row sm:items-center sm:justify-start sm:gap-1 sm:text-left">
                                        <span
                                          className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${
                                            isDone
                                              ? 'bg-[#1C4A38] text-white'
                                              : isCurrent
                                                ? 'border-2 border-[#1C4A38] bg-white'
                                                : 'border border-zinc-300 bg-white'
                                          }`}
                                          aria-hidden="true"
                                        >
                                          {isDone && (
                                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                                          )}
                                        </span>
                                        <span
                                          className={`max-w-full truncate text-[10px] leading-tight sm:text-[11px] ${
                                            isCurrent
                                              ? 'font-semibold text-[#1C4A38]'
                                              : isDone
                                                ? 'font-medium text-zinc-700'
                                                : 'text-zinc-400'
                                          }`}
                                        >
                                          {step.label}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Ordered Items */}
                          <ul className="mt-4 space-y-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-700">
                            {order.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-2"
                              >
                                <span className="min-w-0">
                                  <span className="font-semibold text-zinc-900 tabular-nums">
                                    {item.quantity}×
                                  </span>{' '}
                                  {item.name}
                                </span>
                                <span className="shrink-0 font-medium text-zinc-900 tabular-nums">
                                  {formatINR(item.price * item.quantity)}
                                </span>
                              </li>
                            ))}
                          </ul>

                          {order.notes && (
                            <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                              <span className="font-medium text-zinc-800">Note:</span>{' '}
                              {order.notes}
                            </p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
