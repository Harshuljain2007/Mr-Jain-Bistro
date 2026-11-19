import type { ShopSettings } from '../data/coffeeData';

interface FooterProps {
  settings: ShopSettings;
  isSignedIn: boolean;
  isOwner: boolean;
  onOpenLogin: () => void;
  onOpenOwnerDashboard: () => void;
  onOpenQrModal: () => void;
}

export function Footer({
  settings,
  isSignedIn,
  isOwner,
  onOpenLogin,
  onOpenOwnerDashboard,
  onOpenQrModal,
}: FooterProps) {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <a
            href="#top"
            className="font-display text-lg font-semibold tracking-tight text-zinc-900"
          >
            {settings.name}
          </a>
          <p className="mt-1 text-xs text-zinc-500">
            {settings.address} · {settings.cityStateZip}
          </p>
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-6 text-xs font-medium text-zinc-600"
        >
          <a href="#menu" className="hover:text-zinc-900 hover:underline hover:underline-offset-4">
            Menu
          </a>
          <a href="#roastery" className="hover:text-zinc-900 hover:underline hover:underline-offset-4">
            Roastery
          </a>
          <a href="#reviews" className="hover:text-zinc-900 hover:underline hover:underline-offset-4">
            Reviews
          </a>
          <a href="#hours" className="hover:text-zinc-900 hover:underline hover:underline-offset-4">
            Hours
          </a>
          <a href="#contact" className="hover:text-zinc-900 hover:underline hover:underline-offset-4">
            Contact
          </a>
          <button
            type="button"
            onClick={onOpenQrModal}
            className="hover:text-zinc-900 hover:underline hover:underline-offset-4 cursor-pointer"
          >
            Table QR
          </button>
          <button
            type="button"
            onClick={onOpenLogin}
            className="hover:text-zinc-900 hover:underline hover:underline-offset-4 cursor-pointer"
          >
            {isSignedIn ? 'Profile & Orders' : 'Sign In'}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={onOpenOwnerDashboard}
              className="text-[#1C4A38] hover:text-[#15392B] hover:underline hover:underline-offset-4 cursor-pointer"
            >
              Owner Dashboard
            </button>
          )}
        </nav>

        <p className="text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} {settings.name}
        </p>
      </div>
    </footer>
  );
}
