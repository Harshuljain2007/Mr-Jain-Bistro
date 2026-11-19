import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import type { DiningTable, OrderItem } from '../data/coffeeData';
import { createOrder } from '../services/coffeeDb';

interface OrderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  tables: DiningTable[];
  selectedTableId: string;
  onChangeTableId: (tableId: string) => void;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onClearBag: () => void;
  defaultCustomerName: string;
  isSignedIn: boolean;
  onOpenLogin: () => void;
}

interface OrderConfirmation {
  id: string;
  orderNumber: string;
  tableLabel: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
}

export function OrderDrawer({
  isOpen,
  onClose,
  items,
  tables,
  selectedTableId,
  onChangeTableId,
  onUpdateQuantity,
  onClearBag,
  defaultCustomerName,
  isSignedIn,
  onOpenLogin,
}: OrderDrawerProps) {
  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);

  useEffect(() => {
    if (defaultCustomerName && !customerName) {
      setCustomerName(defaultCustomerName);
    }
  }, [defaultCustomerName, customerName]);

  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const tableLabel = selectedTable ? selectedTable.label : 'Counter Pickup';

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Add at least one item from the menu first.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter your name so our baristas can bring your order.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        tableId: selectedTable ? selectedTable.id : 'counter',
        tableLabel,
        customerName: customerName.trim(),
        items,
        notes,
      });

      setConfirmation({
        id: result.id,
        orderNumber: result.orderNumber,
        tableLabel,
        customerName: customerName.trim(),
        items: [...items],
        totalAmount: result.totalAmount,
      });
      setNotes('');
      onClearBag();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to place order right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-zinc-950/45 backdrop-blur-xs"
    >
      <div className="flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#1C4A38]" aria-hidden="true" />
            <h2
              id="order-drawer-title"
              className="font-display text-xl font-medium text-zinc-900"
            >
              Your Table Order
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmation(null);
              onClose();
            }}
            aria-label="Close Order Drawer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {confirmation ? (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-[#1C4A38]">
                <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm font-semibold">
                  Order Confirmed · {confirmation.orderNumber}
                </span>
              </div>

              <div>
                <h3 className="font-display text-2xl font-medium text-zinc-900">
                  Sent to the bar, {confirmation.customerName}.
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  Serving at <span className="font-medium text-zinc-900">{confirmation.tableLabel}</span>.
                  Our baristas have received your ticket.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-xs font-medium text-zinc-500">Order Summary</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {confirmation.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-zinc-800">
                        <span className="font-medium tabular-nums">{item.quantity}×</span>{' '}
                        {item.name}
                      </span>
                      <span className="font-medium text-zinc-900 tabular-nums">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-sm font-semibold text-zinc-900">
                  <span>Total</span>
                  <span className="tabular-nums">${confirmation.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {!isSignedIn ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600">
                  <p>
                    Want to track live order status updates? Sign in with Google before your
                    next order.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmation(null);
                      onClose();
                      onOpenLogin();
                    }}
                    className="mt-2 font-medium text-[#1C4A38] hover:underline hover:underline-offset-4 cursor-pointer"
                  >
                    Open Login Panel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmation(null);
                    onClose();
                    onOpenLogin();
                  }}
                  className="w-full min-h-[42px] rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-900 hover:bg-zinc-50 cursor-pointer"
                >
                  Track Live Order Status
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setConfirmation(null);
                  onClose();
                }}
                className="w-full min-h-[44px] rounded-lg bg-[#1C4A38] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#15392B] cursor-pointer"
              >
                Back to Menu
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-zinc-300" strokeWidth={1.5} />
              <p className="mt-3 text-base font-medium text-zinc-900">
                Your order bag is empty
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Select drinks or pastries from the menu to send an order to your table.
              </p>
            </div>
          ) : (
            <form id="place-order-form" onSubmit={handlePlaceOrder} className="space-y-5">
              {/* Table Selection */}
              <div>
                <label
                  htmlFor="order-table-select"
                  className="block text-xs font-medium text-zinc-700"
                >
                  Dining Table or Pickup
                </label>
                <select
                  id="order-table-select"
                  value={selectedTableId}
                  onChange={(e) => onChangeTableId(e.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                >
                  <option value="counter">Counter Pickup (Walk-in)</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.seats} seats)
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items */}
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500 tabular-nums">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          aria-label={`Decrease ${item.name} quantity`}
                          className="flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="h-3.5 w-3.5" />
                          ) : (
                            <Minus className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <span className="w-6 text-center text-xs font-semibold text-zinc-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          aria-label={`Increase ${item.name} quantity`}
                          className="flex h-8 w-8 items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="w-14 text-right text-sm font-semibold text-zinc-900 tabular-nums">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Details */}
              <div>
                <label
                  htmlFor="order-customer-name"
                  className="block text-xs font-medium text-zinc-700"
                >
                  Your Name
                </label>
                <input
                  id="order-customer-name"
                  type="text"
                  maxLength={80}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Aarav Gupta"
                  className="mt-1.5 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="order-notes"
                  className="block text-xs font-medium text-zinc-700"
                >
                  Preparation Notes (Optional)
                </label>
                <textarea
                  id="order-notes"
                  rows={2}
                  maxLength={300}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Oat milk, extra hot, or pastry warmed..."
                  className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-[#1C4A38] focus:outline-none"
                />
              </div>

              {error && (
                <p className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              )}
            </form>
          )}
        </div>

        {!confirmation && items.length > 0 && (
          <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-zinc-600">
                Total ({tableLabel})
              </span>
              <span className="text-base font-semibold text-zinc-900 tabular-nums">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <button
              type="submit"
              form="place-order-form"
              disabled={submitting}
              className="w-full min-h-[44px] rounded-lg bg-[#1C4A38] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15392B] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Sending Order...' : 'Place Order'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
