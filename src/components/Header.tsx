import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  shopName: string;
  isSignedIn: boolean;
  isOwner: boolean;
  onOpenAccountAction: () => void;
}

const NAV_LINKS = [
  { href: '#menu', label: 'Menu' },
  { href: '#roastery', label: 'Roastery' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#hours', label: 'Hours' },
  { href: '#contact', label: 'Contact' },
];

export function Header({
  shopName,
  isSignedIn,
  isOwner,
  onOpenAccountAction,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const actionLabel = isOwner
    ? 'Owner Dashboard'
    : isSignedIn
      ? 'My Orders'
      : 'Sign In';

  const handlePrimaryAction = () => {
    setMobileOpen(false);
    onOpenAccountAction();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-[#FAFAFA]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-xl font-semibold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C4A38]"
        >
          {shopName}
        </a>

        {/* Zone 2: Concise single-line text navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1 transition-colors duration-150 hover:text-zinc-900 hover:underline hover:decoration-zinc-400 hover:underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C4A38]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="hidden md:inline-flex min-h-[40px] items-center justify-center rounded-lg bg-[#1C4A38] px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-[#15392B] active:scale-[0.99] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
          >
            {actionLabel}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C4A38]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-zinc-200 bg-[#FAFAFA] px-4 py-4 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex min-h-[44px] items-center rounded-lg px-3 text-base font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="mt-2 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-[#1C4A38] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#15392B] cursor-pointer"
            >
              {actionLabel}
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
