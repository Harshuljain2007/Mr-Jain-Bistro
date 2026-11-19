import { Download, Printer, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { DiningTable } from '../data/coffeeData';

interface TableQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: DiningTable[];
  shopName: string;
  onSelectTableForOrder: (tableId: string) => void;
}

export function TableQrModal({
  isOpen,
  onClose,
  tables,
  shopName,
  onSelectTableForOrder,
}: TableQrModalProps) {
  if (!isOpen) return null;

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://mrjainbistro.app/';

  const getTableUrl = (tableId: string) =>
    `${baseUrl}?table=${encodeURIComponent(tableId)}#menu`;

  const handleDownloadSvg = (tableId: string, label: string) => {
    const svgEl = document.getElementById(`qr-svg-${tableId}`);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-qr-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/45 p-4 backdrop-blur-xs"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-5 w-5 text-[#1C4A38]" aria-hidden="true" />
            <div>
              <h2
                id="table-qr-title"
                className="font-display text-xl font-medium text-zinc-900"
              >
                Table QR Codes for Food &amp; Drink Ordering
              </h2>
              <p className="text-xs text-zinc-500">
                Scan any table code with a phone camera or select a table to test ordering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" aria-hidden="true" />
              Print Cards
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Table QR Codes"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => {
              const tableUrl = getTableUrl(table.id);
              return (
                <div
                  key={table.id}
                  className="flex flex-col items-center rounded-xl border border-zinc-200 bg-[#FAFAFA] p-5 text-center"
                >
                  <p className="text-xs font-medium text-zinc-500">{shopName}</p>
                  <h3 className="mt-0.5 font-display text-lg font-medium text-zinc-900">
                    {table.label}
                  </h3>
                  <p className="text-xs text-zinc-500 tabular-nums">
                    {table.seats} {table.seats === 1 ? 'seat' : 'seats'} · Code {table.tableNumber}
                  </p>

                  <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3">
                    <QRCodeSVG
                      id={`qr-svg-${table.id}`}
                      value={tableUrl}
                      size={148}
                      level="M"
                      fgColor="#18181B"
                      bgColor="#FFFFFF"
                    />
                  </div>

                  <p className="mt-3 max-w-full truncate text-[11px] text-zinc-500">
                    ?table={table.id}#menu
                  </p>

                  <div className="mt-4 flex w-full items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTableForOrder(table.id);
                        onClose();
                      }}
                      className="flex-1 min-h-[38px] rounded-lg bg-[#1C4A38] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#15392B] cursor-pointer"
                    >
                      Order for {table.tableNumber}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSvg(table.id, table.label)}
                      aria-label={`Download QR SVG for ${table.label}`}
                      className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
