import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ContactSection, type PrefilledInquiry } from './components/ContactSection';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { LoginPanelModal } from './components/LoginPanelModal';
import { MenuSection } from './components/MenuSection';
import { OrderDrawer } from './components/OrderDrawer';
import { OwnerDashboardModal } from './components/OwnerDashboardModal';
import { RoasterySection } from './components/RoasterySection';
import { TableQrModal } from './components/TableQrModal';
import { TestimonialsSection } from './components/TestimonialsSection';
import {
  DEFAULT_MENU_ITEMS,
  DEFAULT_REVIEWS,
  DEFAULT_SHOP_SETTINGS,
  DEFAULT_TABLES,
  type CustomerReview,
  type DiningTable,
  type MenuItem,
  type OrderItem,
  type ShopSettings,
} from './data/coffeeData';
import { auth, isOwnerUser } from './firebase';
import {
  subscribePublicMenuItems,
  subscribePublicReviews,
  subscribePublicTables,
  subscribeShopSettings,
} from './services/coffeeDb';

export default function App() {
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const [prefilledInquiry, setPrefilledInquiry] = useState<PrefilledInquiry | null>(null);

  const [shopSettings, setShopSettings] = useState<ShopSettings>(DEFAULT_SHOP_SETTINGS);
  const [settingsFromDb, setSettingsFromDb] = useState(false);

  const [menuItems, setMenuItems] = useState<MenuItem[]>(DEFAULT_MENU_ITEMS);
  const [menuFromDb, setMenuFromDb] = useState(false);

  const [reviews, setReviews] = useState<CustomerReview[]>(DEFAULT_REVIEWS);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsFromDb, setReviewsFromDb] = useState(false);

  const [tables, setTables] = useState<DiningTable[]>(DEFAULT_TABLES);
  const [tablesFromDb, setTablesFromDb] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>('counter');

  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [ownerDashboardOpen, setOwnerDashboardOpen] = useState(false);
  const [orderDrawerOpen, setOrderDrawerOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const isVerifiedAdmin = isOwnerUser(user?.email, user?.emailVerified);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tableParam = params.get('table');
    if (tableParam) {
      setSelectedTableId(tableParam);
      window.setTimeout(() => {
        document.getElementById('menu-catalog')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 250);
    }
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    const unsubSettings = subscribeShopSettings((settings, fromDb) => {
      setShopSettings(settings);
      setSettingsFromDb(fromDb);
    });

    const unsubMenu = subscribePublicMenuItems((items, fromDb) => {
      setMenuItems(items);
      setMenuFromDb(fromDb);
    });

    const unsubReviews = subscribePublicReviews((records, fromDb) => {
      setReviews(records);
      setReviewsFromDb(fromDb);
      setReviewsLoading(false);
    });

    const unsubTables = subscribePublicTables((tableRecords, fromDb) => {
      setTables(tableRecords);
      setTablesFromDb(fromDb);
    });

    return () => {
      unsubAuth();
      unsubSettings();
      unsubMenu();
      unsubReviews();
      unsubTables();
    };
  }, []);

  const scrollToContactAndFocus = () => {
    const contactEl = document.getElementById('contact');
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    window.setTimeout(() => {
      nameInputRef.current?.focus({ preventScroll: true });
    }, 350);
  };

  const handleInquireItem = (itemName: string, topic: string) => {
    setPrefilledInquiry({
      itemName,
      topic,
      timestamp: Date.now(),
    });
    scrollToContactAndFocus();
  };

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (existing) {
        return prev.map((entry) =>
          entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateCartQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((entry) =>
          entry.id === itemId ? { ...entry, quantity: entry.quantity + delta } : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleSelectTableAndScrollToMenu = (tableId: string) => {
    setSelectedTableId(tableId);
    document.getElementById('menu-catalog')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const handleOpenAccountAction = () => {
    if (isVerifiedAdmin) {
      setOwnerDashboardOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  const handleOpenOwnerDashboard = () => {
    if (isVerifiedAdmin) {
      setOwnerDashboardOpen(true);
    } else {
      setLoginOpen(true);
    }
  };

  useEffect(() => {
    if (!isVerifiedAdmin && ownerDashboardOpen) {
      setOwnerDashboardOpen(false);
    }
  }, [isVerifiedAdmin, ownerDashboardOpen]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900">
      <Header
        shopName={shopSettings.name}
        isSignedIn={Boolean(user)}
        isOwner={isVerifiedAdmin}
        onOpenAccountAction={handleOpenAccountAction}
      />
      <main>
        <HeroSection settings={shopSettings} />
        <MenuSection
          menuItems={menuItems}
          tables={tables}
          selectedTableId={selectedTableId}
          onChangeTableId={setSelectedTableId}
          cartItems={cartItems}
          onAddToCart={handleAddToCart}
          onUpdateCartQuantity={handleUpdateCartQuantity}
          onOpenOrderDrawer={() => setOrderDrawerOpen(true)}
          onOpenQrModal={() => setQrModalOpen(true)}
          onInquireItem={handleInquireItem}
        />
        <RoasterySection settings={shopSettings} />
        <TestimonialsSection
          reviews={reviews}
          isLoading={reviewsLoading}
          isAdmin={isVerifiedAdmin}
        />
        <ContactSection
          settings={shopSettings}
          nameInputRef={nameInputRef}
          prefilledInquiry={prefilledInquiry}
        />
      </main>
      <Footer
        settings={shopSettings}
        isSignedIn={Boolean(user)}
        isOwner={isVerifiedAdmin}
        onOpenLogin={() => setLoginOpen(true)}
        onOpenOwnerDashboard={handleOpenOwnerDashboard}
        onOpenQrModal={() => setQrModalOpen(true)}
      />

      <OrderDrawer
        isOpen={orderDrawerOpen}
        onClose={() => setOrderDrawerOpen(false)}
        items={cartItems}
        tables={tables}
        selectedTableId={selectedTableId}
        onChangeTableId={setSelectedTableId}
        onUpdateQuantity={handleUpdateCartQuantity}
        onClearBag={() => setCartItems([])}
        defaultCustomerName={user?.displayName || ''}
        isSignedIn={Boolean(user)}
        onOpenLogin={() => setLoginOpen(true)}
      />

      <TableQrModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        tables={tables}
        shopName={shopSettings.name}
        onSelectTableForOrder={handleSelectTableAndScrollToMenu}
      />

      <LoginPanelModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        user={user}
        authReady={authReady}
        onOpenOwnerDashboard={handleOpenOwnerDashboard}
      />

      {isVerifiedAdmin && (
        <OwnerDashboardModal
          isOpen={ownerDashboardOpen}
          onClose={() => setOwnerDashboardOpen(false)}
          user={user}
          authReady={authReady}
          currentSettings={shopSettings}
          settingsFromDb={settingsFromDb}
          menuFromDb={menuFromDb}
          reviewsFromDb={reviewsFromDb}
          tablesFromDb={tablesFromDb}
          onSelectTableAndBrowseMenu={handleSelectTableAndScrollToMenu}
        />
      )}
    </div>
  );
}
