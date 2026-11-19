import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import {
  CATEGORY_LABELS,
  DEFAULT_MENU_ITEMS,
  DEFAULT_REVIEWS,
  DEFAULT_SHOP_SETTINGS,
  DEFAULT_TABLES,
  type CustomerReview,
  type DiningTable,
  type MenuItem,
  type OrderItem,
  type OrderRecord,
  type OrderStatus,
  type ShopSettings,
  type TableStatus,
} from '../data/coffeeData';
import { OperationType, auth, db, handleFirestoreError } from '../firebase';

export type ContactTopic =
  | 'General Inquiry'
  | 'Private Events & Catering'
  | 'Wholesale Coffee Beans'
  | 'Feedback';

export type ContactStatus = 'new' | 'read' | 'replied';

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  status: ContactStatus;
  createdAtText: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clampString(val: string, maxLength: number): string {
  return val.trim().slice(0, maxLength);
}

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 120);
  return cleaned || `item-${Date.now()}`;
}

export function subscribeShopSettings(
  onData: (settings: ShopSettings, fromDatabase: boolean) => void
): () => void {
  const path = 'shopSettings/main';
  const ref = doc(db, 'shopSettings', 'main');

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(DEFAULT_SHOP_SETTINGS, false);
        return;
      }
      const data = snapshot.data();
      onData(
        {
          name: String(data.name || DEFAULT_SHOP_SETTINGS.name),
          neighborhood: String(data.neighborhood || DEFAULT_SHOP_SETTINGS.neighborhood),
          address: String(data.address || DEFAULT_SHOP_SETTINGS.address),
          cityStateZip: String(data.cityStateZip || DEFAULT_SHOP_SETTINGS.cityStateZip),
          email: String(data.email || DEFAULT_SHOP_SETTINGS.email),
          phone: String(data.phone || DEFAULT_SHOP_SETTINGS.phone),
          heroHeadline: String(data.heroHeadline || DEFAULT_SHOP_SETTINGS.heroHeadline),
          heroDescription: String(data.heroDescription || DEFAULT_SHOP_SETTINGS.heroDescription),
          hoursSummary: String(data.hoursSummary || DEFAULT_SHOP_SETTINGS.hoursSummary),
          hoursDays: String(data.hoursDays || DEFAULT_SHOP_SETTINGS.hoursDays),
          weekdayHours: String(data.weekdayHours || DEFAULT_SHOP_SETTINGS.weekdayHours),
          saturdayHours: String(data.saturdayHours || DEFAULT_SHOP_SETTINGS.saturdayHours),
          sundayHours: String(data.sundayHours || DEFAULT_SHOP_SETTINGS.sundayHours),
          roastSpotlight: String(data.roastSpotlight || DEFAULT_SHOP_SETTINGS.roastSpotlight),
          roastNotes: String(data.roastNotes || DEFAULT_SHOP_SETTINGS.roastNotes),
        },
        true
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveShopSettings(settings: ShopSettings): Promise<void> {
  const path = 'shopSettings/main';
  const email = clampString(settings.email, 120);
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error('Shop contact email must be a valid email address.');
  }

  const payload = {
    name: clampString(settings.name, 80),
    neighborhood: clampString(settings.neighborhood, 80),
    address: clampString(settings.address, 140),
    cityStateZip: clampString(settings.cityStateZip, 80),
    email,
    phone: clampString(settings.phone, 40),
    heroHeadline: clampString(settings.heroHeadline, 160),
    heroDescription: clampString(settings.heroDescription, 400),
    hoursSummary: clampString(settings.hoursSummary, 60),
    hoursDays: clampString(settings.hoursDays, 60),
    weekdayHours: clampString(settings.weekdayHours, 60),
    saturdayHours: clampString(settings.saturdayHours, 60),
    sundayHours: clampString(settings.sundayHours, 60),
    roastSpotlight: clampString(settings.roastSpotlight, 100),
    roastNotes: clampString(settings.roastNotes, 140),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'shopSettings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function mapMenuDoc(id: string, data: Record<string, unknown>): MenuItem {
  const category =
    data.category === 'espresso' ||
    data.category === 'filter' ||
    data.category === 'tea' ||
    data.category === 'bakery'
      ? data.category
      : 'espresso';

  const tempsRaw = Array.isArray(data.temperatures) ? data.temperatures : ['Hot'];
  const temperatures = tempsRaw.filter(
    (t): t is 'Hot' | 'Iced' => t === 'Hot' || t === 'Iced'
  );

  return {
    id,
    name: String(data.name || ''),
    category,
    categoryLabel: String(data.categoryLabel || CATEGORY_LABELS[category]),
    price: typeof data.price === 'number' ? data.price : Number(data.price) || 0,
    size: String(data.size || 'Single'),
    description: String(data.description || ''),
    tastingNotes: String(data.tastingNotes || ''),
    originOrPrep: String(data.originOrPrep || ''),
    temperatures: temperatures.length > 0 ? temperatures : ['Hot'],
    dairyFreeAvailable: Boolean(data.dairyFreeAvailable),
    caffeineFree: Boolean(data.caffeineFree),
    isAvailable: data.isAvailable !== false,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 100,
  };
}

export function subscribePublicMenuItems(
  onData: (items: MenuItem[], fromDatabase: boolean) => void
): () => void {
  const path = 'menuItems';
  const q = query(collection(db, path), where('isAvailable', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_MENU_ITEMS, false);
        return;
      }
      const items = snapshot.docs
        .map((d) => mapMenuDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(items, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllMenuItems(onData: (items: MenuItem[]) => void): () => void {
  const path = 'menuItems';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapMenuDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function upsertMenuItem(item: MenuItem): Promise<void> {
  const id = sanitizeId(item.id);
  const path = `menuItems/${id}`;
  const price = Math.max(0, Math.min(50000, Number(item.price) || 0));
  const sortOrder = Math.max(0, Math.min(999, Math.round(Number(item.sortOrder) || 100)));
  const temperatures = item.temperatures.filter(
    (t): t is 'Hot' | 'Iced' => t === 'Hot' || t === 'Iced'
  );

  const payload = {
    name: clampString(item.name, 80),
    category: item.category,
    categoryLabel: clampString(CATEGORY_LABELS[item.category], 40),
    price,
    size: clampString(item.size, 30),
    description: clampString(item.description, 240),
    tastingNotes: clampString(item.tastingNotes, 160),
    originOrPrep: clampString(item.originOrPrep, 160),
    temperatures: temperatures.length > 0 ? temperatures.slice(0, 2) : ['Hot'],
    dairyFreeAvailable: Boolean(item.dairyFreeAvailable),
    caffeineFree: Boolean(item.caffeineFree),
    isAvailable: Boolean(item.isAvailable),
    sortOrder,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'menuItems', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `menuItems/${safeId}`;
  try {
    await deleteDoc(doc(db, 'menuItems', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function mapTableDoc(id: string, data: Record<string, unknown>): DiningTable {
  const status: TableStatus =
    data.status === 'occupied' || data.status === 'reserved' ? data.status : 'available';
  const seats = typeof data.seats === 'number' ? data.seats : Number(data.seats) || 2;
  return {
    id,
    tableNumber: String(data.tableNumber || id),
    label: String(data.label || `Table ${id}`),
    seats: Math.max(1, Math.min(20, Math.round(seats))),
    status,
    isActive: data.isActive !== false,
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 100,
  };
}

export function subscribePublicTables(
  onData: (tables: DiningTable[], fromDatabase: boolean) => void
): () => void {
  const path = 'diningTables';
  const q = query(collection(db, path), where('isActive', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_TABLES, false);
        return;
      }
      const tables = snapshot.docs
        .map((d) => mapTableDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(tables, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllTables(onData: (tables: DiningTable[]) => void): () => void {
  const path = 'diningTables';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const tables = snapshot.docs
        .map((d) => mapTableDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(tables);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function upsertDiningTable(table: DiningTable): Promise<void> {
  const id = sanitizeId(table.id);
  const path = `diningTables/${id}`;
  const seats = Math.max(1, Math.min(20, Math.round(Number(table.seats) || 2)));
  const sortOrder = Math.max(0, Math.min(999, Math.round(Number(table.sortOrder) || 100)));

  try {
    await setDoc(doc(db, 'diningTables', id), {
      tableNumber: clampString(table.tableNumber, 20),
      label: clampString(table.label, 60),
      seats,
      status: table.status,
      isActive: Boolean(table.isActive),
      sortOrder,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDiningTable(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `diningTables/${safeId}`;
  try {
    await deleteDoc(doc(db, 'diningTables', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function mapOrderDoc(id: string, data: Record<string, unknown>): OrderRecord {
  const ts = data.createdAt as Timestamp | null | undefined;
  const createdAtMs = ts?.toMillis ? ts.toMillis() : Date.now();
  const createdAtText = ts?.toDate
    ? ts.toDate().toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Just now';

  const status: OrderStatus =
    data.status === 'preparing' ||
    data.status === 'ready' ||
    data.status === 'served' ||
    data.status === 'cancelled'
      ? data.status
      : 'pending';

  const rawItems = Array.isArray(data.items) ? data.items : [];
  const items: OrderItem[] = rawItems.map((it: Record<string, unknown>) => ({
    id: String(it.id || ''),
    name: String(it.name || ''),
    price: typeof it.price === 'number' ? it.price : Number(it.price) || 0,
    quantity: typeof it.quantity === 'number' ? it.quantity : Number(it.quantity) || 1,
  }));

  return {
    id,
    orderNumber: String(data.orderNumber || id.slice(-6).toUpperCase()),
    tableId: String(data.tableId || 'counter'),
    tableLabel: String(data.tableLabel || 'Counter Pickup'),
    customerName: String(data.customerName || 'Guest'),
    customerUid: String(data.customerUid || ''),
    items,
    notes: String(data.notes || ''),
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : Number(data.totalAmount) || 0,
    status,
    createdAtText,
    createdAtMs,
  };
}

export async function createOrder(input: {
  tableId: string;
  tableLabel: string;
  customerName: string;
  items: OrderItem[];
  notes: string;
}): Promise<{ id: string; orderNumber: string; totalAmount: number }> {
  const customerName = clampString(input.customerName, 80);
  if (!customerName) throw new Error('Please enter your name for the order.');
  if (input.items.length === 0) throw new Error('Your order bag is empty.');

  const sanitizedItems: OrderItem[] = input.items.slice(0, 30).map((item) => ({
    id: sanitizeId(item.id),
    name: clampString(item.name, 80),
    price: Math.max(0, Math.min(50000, Number(item.price) || 0)),
    quantity: Math.max(1, Math.min(50, Math.round(Number(item.quantity) || 1))),
  }));

  const totalAmount = Number(
    sanitizedItems
      .reduce((sum, item) => sum + item.price * item.quantity, 0)
      .toFixed(2)
  );

  const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const orderNumber = `ORD-${randomSuffix}`;
  const id = sanitizeId(`ord-${Date.now()}-${randomSuffix.toLowerCase()}`);
  const path = `orders/${id}`;

  try {
    await setDoc(doc(db, 'orders', id), {
      orderNumber,
      tableId: clampString(input.tableId, 40) || 'counter',
      tableLabel: clampString(input.tableLabel, 60) || 'Counter Pickup',
      customerName,
      customerUid: auth.currentUser?.uid ?? '',
      items: sanitizedItems,
      notes: clampString(input.notes, 300),
      totalAmount: Math.min(500000, totalAmount),
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id, orderNumber, totalAmount };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeAllOrders(onData: (orders: OrderRecord[]) => void): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => mapOrderDoc(d.id, d.data())));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeMyOrders(
  uid: string,
  onData: (orders: OrderRecord[]) => void
): () => void {
  const path = 'orders';
  const q = query(collection(db, path), where('customerUid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const list = snapshot.docs
        .map((d) => mapOrderDoc(d.id, d.data()))
        .sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `orders/${safeId}`;
  try {
    await updateDoc(doc(db, 'orders', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `orders/${safeId}`;
  try {
    await deleteDoc(doc(db, 'orders', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

function mapReviewDoc(id: string, data: Record<string, unknown>): CustomerReview {
  const ts = data.createdAt as Timestamp | null | undefined;
  const createdAtText = ts?.toDate
    ? ts.toDate().toLocaleDateString([], {
        month: 'short',
        year: 'numeric',
      })
    : undefined;

  const rawRating = typeof data.rating === 'number' ? data.rating : Number(data.rating) || 5;
  const rating = Math.max(1, Math.min(5, Math.round(rawRating)));

  return {
    id,
    authorName: String(data.authorName || ''),
    authorRole: String(data.authorRole || ''),
    rating,
    quote: String(data.quote || ''),
    favoriteItem: String(data.favoriteItem || ''),
    isApproved: Boolean(data.isApproved),
    sortOrder: typeof data.sortOrder === 'number' ? data.sortOrder : 100,
    createdAtText,
  };
}

export function subscribePublicReviews(
  onData: (reviews: CustomerReview[], fromDatabase: boolean) => void
): () => void {
  const path = 'reviews';
  const q = query(collection(db, path), where('isApproved', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(DEFAULT_REVIEWS, false);
        return;
      }
      const reviews = snapshot.docs
        .map((d) => mapReviewDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(reviews, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeAllReviews(onData: (reviews: CustomerReview[]) => void): () => void {
  const path = 'reviews';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const reviews = snapshot.docs
        .map((d) => mapReviewDoc(d.id, d.data()))
        .sort((a, b) => a.sortOrder - b.sortOrder);
      onData(reviews);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createCustomerReview(input: {
  authorName: string;
  authorRole: string;
  rating: number;
  quote: string;
  favoriteItem: string;
  isApproved: boolean;
  sortOrder?: number;
}): Promise<string> {
  const authorName = clampString(input.authorName, 80);
  const authorRole = clampString(input.authorRole, 80);
  const quote = clampString(input.quote, 400);
  const favoriteItem = clampString(input.favoriteItem, 80);
  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating) || 5)));
  const sortOrder = Math.max(0, Math.min(999, Math.round(Number(input.sortOrder) || 100)));

  if (!authorName) throw new Error('Please enter your name.');
  if (!authorRole) throw new Error('Please enter your neighborhood or role.');
  if (quote.length < 10) throw new Error('Review must be at least 10 characters.');
  if (!favoriteItem) throw new Error('Please share your favorite drink or pastry.');

  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const id = sanitizeId(`rev-${Date.now()}-${randomSuffix}`);
  const path = `reviews/${id}`;

  try {
    await setDoc(doc(db, 'reviews', id), {
      authorName,
      authorRole,
      rating,
      quote,
      favoriteItem,
      isApproved: Boolean(input.isApproved),
      sortOrder,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateReviewApproval(
  id: string,
  isApproved: boolean,
  sortOrder: number
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `reviews/${safeId}`;
  try {
    await updateDoc(doc(db, 'reviews', safeId), {
      isApproved: Boolean(isApproved),
      sortOrder: Math.max(0, Math.min(999, Math.round(sortOrder))),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomerReview(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `reviews/${safeId}`;
  try {
    await deleteDoc(doc(db, 'reviews', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDatabaseDefaults(
  includeShopSettings: boolean,
  includeMenuItems: boolean,
  includeReviews = false,
  includeTables = false
): Promise<void> {
  try {
    const batch = writeBatch(db);

    if (includeShopSettings) {
      batch.set(doc(db, 'shopSettings', 'main'), {
        ...DEFAULT_SHOP_SETTINGS,
        updatedAt: serverTimestamp(),
      });
    }

    if (includeMenuItems) {
      for (const item of DEFAULT_MENU_ITEMS) {
        batch.set(doc(db, 'menuItems', sanitizeId(item.id)), {
          name: item.name,
          category: item.category,
          categoryLabel: item.categoryLabel,
          price: item.price,
          size: item.size,
          description: item.description,
          tastingNotes: item.tastingNotes,
          originOrPrep: item.originOrPrep,
          temperatures: item.temperatures,
          dairyFreeAvailable: item.dairyFreeAvailable,
          caffeineFree: item.caffeineFree,
          isAvailable: item.isAvailable,
          sortOrder: item.sortOrder,
          updatedAt: serverTimestamp(),
        });
      }
    }

    if (includeReviews) {
      for (const review of DEFAULT_REVIEWS) {
        batch.set(doc(db, 'reviews', sanitizeId(review.id)), {
          authorName: review.authorName,
          authorRole: review.authorRole,
          rating: review.rating,
          quote: review.quote,
          favoriteItem: review.favoriteItem,
          isApproved: review.isApproved,
          sortOrder: review.sortOrder,
          createdAt: serverTimestamp(),
        });
      }
    }

    if (includeTables) {
      for (const table of DEFAULT_TABLES) {
        batch.set(doc(db, 'diningTables', sanitizeId(table.id)), {
          tableNumber: table.tableNumber,
          label: table.label,
          seats: table.seats,
          status: table.status,
          isActive: table.isActive,
          sortOrder: table.sortOrder,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
  }
}

export async function submitContactMessage(input: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}): Promise<string> {
  const name = clampString(input.name, 100);
  const email = clampString(input.email, 120);
  const message = clampString(input.message, 2000);

  if (!name) throw new Error('Please enter your name.');
  if (!EMAIL_PATTERN.test(email)) throw new Error('Please enter a valid email address.');
  if (message.length < 10) throw new Error('Message must be at least 10 characters.');

  const randomSuffix = Math.random().toString(36).slice(2, 7);
  const id = sanitizeId(`msg-${Date.now()}-${randomSuffix}`);
  const path = `contactMessages/${id}`;

  try {
    await setDoc(doc(db, 'contactMessages', id), {
      name,
      email,
      topic: input.topic,
      message,
      status: 'new',
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeContactMessages(
  onData: (messages: ContactMessageRecord[]) => void
): () => void {
  const path = 'contactMessages';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ContactMessageRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        const ts = data.createdAt as Timestamp | null | undefined;
        const createdAtText = ts?.toDate
          ? ts.toDate().toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
          : 'Just now';

        const status: ContactStatus =
          data.status === 'read' || data.status === 'replied' ? data.status : 'new';

        const topic: ContactTopic =
          data.topic === 'Private Events & Catering' ||
          data.topic === 'Wholesale Coffee Beans' ||
          data.topic === 'Feedback'
            ? data.topic
            : 'General Inquiry';

        return {
          id: d.id,
          name: String(data.name || ''),
          email: String(data.email || ''),
          topic,
          message: String(data.message || ''),
          status,
          createdAtText,
        };
      });
      onData(records);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function updateContactMessageStatus(
  id: string,
  status: ContactStatus
): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `contactMessages/${safeId}`;
  try {
    await updateDoc(doc(db, 'contactMessages', safeId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteContactMessage(id: string): Promise<void> {
  const safeId = sanitizeId(id);
  const path = `contactMessages/${safeId}`;
  try {
    await deleteDoc(doc(db, 'contactMessages', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
