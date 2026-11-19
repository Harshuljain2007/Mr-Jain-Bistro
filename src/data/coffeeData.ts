export type MenuCategory = 'espresso' | 'filter' | 'tea' | 'bakery';

export interface ShopSettings {
  name: string;
  neighborhood: string;
  address: string;
  cityStateZip: string;
  email: string;
  phone: string;
  heroHeadline: string;
  heroDescription: string;
  hoursSummary: string;
  hoursDays: string;
  weekdayHours: string;
  saturdayHours: string;
  sundayHours: string;
  roastSpotlight: string;
  roastNotes: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  categoryLabel: string;
  price: number;
  size: string;
  description: string;
  tastingNotes: string;
  originOrPrep: string;
  temperatures: ('Hot' | 'Iced')[];
  dairyFreeAvailable: boolean;
  caffeineFree: boolean;
  isAvailable: boolean;
  sortOrder: number;
}

export interface FeaturedHighlight {
  id: string;
  menuItemId: string;
  category: MenuCategory;
  categoryLabel: string;
  title: string;
  subtitle: string;
  price: number;
  image: string;
  alt: string;
}

export interface CustomerReview {
  id: string;
  authorName: string;
  authorRole: string;
  rating: number;
  quote: string;
  favoriteItem: string;
  isApproved: boolean;
  sortOrder: number;
  createdAtText?: string;
}

export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface DiningTable {
  id: string;
  tableNumber: string;
  label: string;
  seats: number;
  status: TableStatus;
  isActive: boolean;
  sortOrder: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  tableId: string;
  tableLabel: string;
  customerName: string;
  customerUid: string;
  items: OrderItem[];
  notes: string;
  totalAmount: number;
  status: OrderStatus;
  createdAtText: string;
  createdAtMs?: number;
}

export const DEFAULT_TABLES: DiningTable[] = [
  {
    id: 'T1',
    tableNumber: 'T1',
    label: 'Table 1 · Window',
    seats: 2,
    status: 'available',
    isActive: true,
    sortOrder: 10,
  },
  {
    id: 'T2',
    tableNumber: 'T2',
    label: 'Table 2 · Window',
    seats: 2,
    status: 'available',
    isActive: true,
    sortOrder: 20,
  },
  {
    id: 'T3',
    tableNumber: 'T3',
    label: 'Table 3 · Oak Counter',
    seats: 4,
    status: 'available',
    isActive: true,
    sortOrder: 30,
  },
  {
    id: 'T4',
    tableNumber: 'T4',
    label: 'Table 4 · Courtyard',
    seats: 4,
    status: 'available',
    isActive: true,
    sortOrder: 40,
  },
  {
    id: 'T5',
    tableNumber: 'T5',
    label: 'Table 5 · Corner Booth',
    seats: 6,
    status: 'available',
    isActive: true,
    sortOrder: 50,
  },
  {
    id: 'T6',
    tableNumber: 'T6',
    label: 'Table 6 · Patio',
    seats: 4,
    status: 'available',
    isActive: true,
    sortOrder: 60,
  },
];

export const DEFAULT_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-ananya-sharma',
    authorName: 'Ananya Sharma',
    authorRole: 'Architect, Sitapura',
    rating: 5,
    quote:
      'Stopped in before a site visit and had the cleanest V60 pour-over I have tasted in Jaipur. The morning light across the oak counter makes it an easy place to settle in for an hour.',
    favoriteItem: 'Single-Origin V60 Pour Over',
    isApproved: true,
    sortOrder: 10,
  },
  {
    id: 'rev-rohan-mehta',
    authorName: 'Rohan Mehta',
    authorRole: 'Product Designer, Malviya Nagar',
    rating: 5,
    quote:
      'The cardamom knot comes out warm with real freshly crushed green cardamom, not syrup. Paired with an oat cortado, it has become my Tuesday morning ritual.',
    favoriteItem: 'Swedish Cardamom Knot',
    isApproved: true,
    sortOrder: 20,
  },
  {
    id: 'rev-meera-kulkarni',
    authorName: 'Meera Kulkarni',
    authorRole: 'University Lecturer, Pratap Nagar',
    rating: 5,
    quote:
      'Most cafes rush matcha, but here they whisk first-harvest Uji tea properly to order. Balanced, smooth, and zero chalkiness even over ice.',
    favoriteItem: 'Ceremonial Uji Matcha Latte',
    isApproved: true,
    sortOrder: 30,
  },
  {
    id: 'rev-vikram-rathore',
    authorName: 'Vikram Rathore',
    authorRole: 'Software Engineer, Sitapura',
    rating: 5,
    quote:
      'We ordered two pastry boxes and batch coffee carafes for a 15-person studio workshop. Everything arrived right at 8:30 AM, still crisp and piping hot.',
    favoriteItem: 'Cultured Butter Croissant',
    isApproved: true,
    sortOrder: 40,
  },
  {
    id: 'rev-kavya-nair',
    authorName: 'Kavya Nair',
    authorRole: 'Ceramicist, Tonk Road',
    rating: 4,
    quote:
      'Love the quiet atmosphere and the stoneware cups. The Yuzu Espresso Tonic is bright and refreshing on warm afternoons when you want something lighter than milk.',
    favoriteItem: 'Yuzu Espresso Tonic',
    isApproved: true,
    sortOrder: 50,
  },
  {
    id: 'rev-dev-choudhary',
    authorName: 'Dev Choudhary',
    authorRole: 'Founder, JECRC Incubation',
    rating: 5,
    quote:
      'Consistently dialed-in espresso and hospitable staff who actually know the roast dates and origin notes of every bean on bar.',
    favoriteItem: 'House Cortado',
    isApproved: true,
    sortOrder: 60,
  },
];

export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  name: 'Mr. Jain Bistro',
  neighborhood: 'Jaipur',
  address: 'Sitapura',
  cityStateZip: 'Jaipur, Rajasthan',
  email: 'iam.harshuljain@gmail.com',
  phone: '+91 7665712877',
  heroHeadline: 'Small-batch espresso and morning pastry, brewed fresh in Sitapura.',
  heroDescription:
    'We roast washed single-origin coffees every Tuesday morning, pair them with freshly baked pastries at dawn, and pour each cup to order at our bistro bar.',
  hoursSummary: '7:00 AM – 6:00 PM',
  hoursDays: 'Open Daily · Walk-ins welcome',
  weekdayHours: '7:00 AM – 6:00 PM',
  saturdayHours: '7:30 AM – 6:00 PM',
  sundayHours: '8:00 AM – 5:00 PM',
  roastSpotlight: 'Ethiopia Guji Washed',
  roastNotes: 'Bergamot, White Peach, Honey',
};

export const HERO_IMAGE = {
  src: '/src/assets/images/hero_coffee_bar_1795094461356.jpg',
  alt: 'Sunlit white oak espresso bar at Mr. Jain Bistro with barista preparing pour-over coffee',
};

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  espresso: 'Espresso & Milk',
  filter: 'Pour Over & Cold',
  tea: 'Tea & Matcha',
  bakery: 'Morning Bakery',
};

export const CATEGORY_TABS: { id: 'all' | MenuCategory; label: string }[] = [
  { id: 'all', label: 'All Menu' },
  { id: 'espresso', label: 'Espresso & Milk' },
  { id: 'filter', label: 'Pour Over & Cold' },
  { id: 'tea', label: 'Tea & Matcha' },
  { id: 'bakery', label: 'Morning Bakery' },
];

export const FEATURED_HIGHLIGHTS: FeaturedHighlight[] = [
  {
    id: 'feat-cortado',
    menuItemId: 'cortado',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    title: 'House Cortado',
    subtitle: 'Double ristretto · textured whole or oat milk',
    price: 4.5,
    image: '/src/assets/images/menu_cortado_espresso_1795094462205.jpg',
    alt: 'Speckled ceramic cup with rosetta latte art cortado on pale stone table',
  },
  {
    id: 'feat-pourover',
    menuItemId: 'single-origin-v60',
    category: 'filter',
    categoryLabel: 'Pour Over & Cold',
    title: 'Single-Origin V60',
    subtitle: 'Ethiopia Guji · brewed to order in glass',
    price: 5.5,
    image: '/src/assets/images/menu_pourover_coffee_1795094462385.jpg',
    alt: 'Ceramic V60 dripper brewing amber single-origin filter coffee into a glass server',
  },
  {
    id: 'feat-matcha',
    menuItemId: 'iced-uji-matcha',
    category: 'tea',
    categoryLabel: 'Tea & Matcha',
    title: 'Iced Uji Matcha',
    subtitle: 'First-harvest Kyoto green tea · oat milk',
    price: 5.75,
    image: '/src/assets/images/menu_matcha_iced_1795094462166.jpg',
    alt: 'Iced ceremonial matcha latte layered with oat milk in a ribbed clear glass',
  },
  {
    id: 'feat-cardamom',
    menuItemId: 'cardamom-knot',
    category: 'bakery',
    categoryLabel: 'Morning Bakery',
    title: 'Sourdough Croissant & Knot',
    subtitle: 'Baked at 5:30 AM · cultured farm butter',
    price: 4.75,
    image: '/src/assets/images/menu_bakery_pastry_1795094462927.jpg',
    alt: 'Flaky laminated croissant and braided cardamom knot on a stoneware plate',
  },
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  {
    id: 'espresso-double',
    name: 'Double Espresso',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    price: 3.75,
    size: '2 oz',
    description: 'Pulled at 9 bars using our house seasonal blend with sparkling water on the side.',
    tastingNotes: 'Toasted hazelnut, dark cocoa, dried plum',
    originOrPrep: 'Colombia Huila & Brazil Mogiana blend · Roasted Tuesday',
    temperatures: ['Hot'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 10,
  },
  {
    id: 'cortado',
    name: 'House Cortado',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    price: 4.5,
    size: '4.5 oz',
    description: 'Equal parts rich double espresso and silky micro-foamed milk served in ceramic.',
    tastingNotes: 'Caramelized sugar, sweet cream, almond',
    originOrPrep: 'Whole organic Jersey milk or Minor Figures oat milk',
    temperatures: ['Hot'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 20,
  },
  {
    id: 'flat-white',
    name: 'Flat White',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    price: 4.75,
    size: '6 oz',
    description: 'Velvety micro-foam poured over a bright, balanced double shot.',
    tastingNotes: 'Milk chocolate, roasted walnut, orange zest',
    originOrPrep: '6 oz stoneware cup · Decaf Swiss Water available',
    temperatures: ['Hot'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 30,
  },
  {
    id: 'latte',
    name: 'House Bistro Latte',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    price: 5.25,
    size: '10 oz / 12 oz',
    description: 'Steamed organic milk or house oat milk over a double shot of espresso.',
    tastingNotes: 'Sweet dairy, cacao nib, mellow spice',
    originOrPrep: 'Available with house-made vanilla bean or Douglas fir honey (+$0.75)',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 40,
  },
  {
    id: 'brown-sugar-oat-shaken',
    name: 'Shaken Muscovado Oat Espresso',
    category: 'espresso',
    categoryLabel: 'Espresso & Milk',
    price: 5.75,
    size: '12 oz',
    description: 'Double espresso vigorously shaken with dark muscovado sugar, sea salt, and chilled oat milk.',
    tastingNotes: 'Molasses, toasted oat, bright espresso crema',
    originOrPrep: 'Prepared dairy-free by default over hand-cracked ice',
    temperatures: ['Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 50,
  },
  {
    id: 'batch-brew',
    name: 'Daily Filter Coffee',
    category: 'filter',
    categoryLabel: 'Pour Over & Cold',
    price: 3.5,
    size: '12 oz',
    description: 'Clean, aromatic batch-brewed filter coffee refreshed every 45 minutes.',
    tastingNotes: 'Roasted almond, red apple, clean finish',
    originOrPrep: 'Guatemala Huehuetenango · Washed Caturra',
    temperatures: ['Hot'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 60,
  },
  {
    id: 'single-origin-v60',
    name: 'Single-Origin V60 Pour Over',
    category: 'filter',
    categoryLabel: 'Pour Over & Cold',
    price: 5.5,
    size: '10 oz',
    description: 'Hand-poured in small pulses through a Japanese ceramic dripper to highlight floral clarity.',
    tastingNotes: 'Bergamot, white peach, jasmine blossom',
    originOrPrep: 'Ethiopia Guji · 2,050m elevation · Light Nordic roast',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 70,
  },
  {
    id: 'kyoto-cold-brew',
    name: '16-Hour Slow Cold Brew',
    category: 'filter',
    categoryLabel: 'Pour Over & Cold',
    price: 4.75,
    size: '12 oz',
    description: 'Steeped cold overnight for syrupy body and low acidity, served neat over large clear ice.',
    tastingNotes: 'Dark fudge, Bing cherry, cedar',
    originOrPrep: 'Direct-trade Colombia & Sumatra blend',
    temperatures: ['Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 80,
  },
  {
    id: 'tonic-espresso',
    name: 'Yuzu Espresso Tonic',
    category: 'filter',
    categoryLabel: 'Pour Over & Cold',
    price: 5.75,
    size: '10 oz',
    description: 'Bright Ethiopian espresso layered over botanical tonic water and fresh Japanese yuzu peel.',
    tastingNotes: 'Grapefruit pith, botanical quinine, floral coffee',
    originOrPrep: 'Naturally dairy-free & briskly sparkling',
    temperatures: ['Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 90,
  },
  {
    id: 'iced-uji-matcha',
    name: 'Ceremonial Uji Matcha Latte',
    category: 'tea',
    categoryLabel: 'Tea & Matcha',
    price: 5.75,
    size: '10 oz / 12 oz',
    description: 'First-harvest shade-grown Uji matcha hand-whisked with bamboo chasen over your choice of milk.',
    tastingNotes: 'Sweet umami, steamed nori, creamy finish',
    originOrPrep: 'Unsweetened by default · Kyoto Prefecture, Japan',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 100,
  },
  {
    id: 'hojicha-latte',
    name: 'Roasted Hojicha Latte',
    category: 'tea',
    categoryLabel: 'Tea & Matcha',
    price: 5.25,
    size: '10 oz',
    description: 'Slow-roasted Japanese green tea stems ground fine and steamed with milk for a cozy, nutty cup.',
    tastingNotes: 'Toasted pecan, caramel, warm wood',
    originOrPrep: 'Naturally low-caffeine evening favorite',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 110,
  },
  {
    id: 'spiced-chai',
    name: 'House Whole-Spice Chai',
    category: 'tea',
    categoryLabel: 'Tea & Matcha',
    price: 5.0,
    size: '12 oz',
    description: 'Assam black tea simmered with crushed green cardamom, fresh ginger root, black pepper, and cinnamon.',
    tastingNotes: 'Warming ginger, floral cardamom, brisk Assam',
    originOrPrep: 'Brewed daily from whole organic spices — zero concentrates',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: false,
    isAvailable: true,
    sortOrder: 120,
  },
  {
    id: 'chamomile-mint-tisane',
    name: 'Peppermint & Chamomile Tisane',
    category: 'tea',
    categoryLabel: 'Tea & Matcha',
    price: 4.0,
    size: '12 oz',
    description: 'Whole-flower Egyptian chamomile steeped with fresh garden peppermint leaves.',
    tastingNotes: 'Crisp garden mint, honeyed apple blossom',
    originOrPrep: '100% caffeine-free botanical infusion',
    temperatures: ['Hot', 'Iced'],
    dairyFreeAvailable: true,
    caffeineFree: true,
    isAvailable: true,
    sortOrder: 130,
  },
  {
    id: 'sourdough-croissant',
    name: 'Cultured Butter Croissant',
    category: 'bakery',
    categoryLabel: 'Morning Bakery',
    price: 4.5,
    size: 'Single',
    description: '72-hour naturally leavened pastry laminated with grass-fed cultured butter.',
    tastingNotes: 'Crisp honeycomb layers, toasted butter, mild tang',
    originOrPrep: 'Baked fresh at 5:30 AM using stone-milled Pacific Northwest wheat',
    temperatures: ['Hot'],
    dairyFreeAvailable: false,
    caffeineFree: true,
    isAvailable: true,
    sortOrder: 140,
  },
  {
    id: 'cardamom-knot',
    name: 'Swedish Cardamom Knot',
    category: 'bakery',
    categoryLabel: 'Morning Bakery',
    price: 4.75,
    size: 'Single',
    description: 'Hand-braided brioche dough folded with freshly mortar-crushed green cardamom and pearl sugar.',
    tastingNotes: 'Aromatic cardamom, browned butter, citrus zest',
    originOrPrep: 'Served warm throughout the morning',
    temperatures: ['Hot'],
    dairyFreeAvailable: false,
    caffeineFree: true,
    isAvailable: true,
    sortOrder: 150,
  },
  {
    id: 'olive-oil-cake',
    name: 'Meyer Lemon Olive Oil Cake',
    category: 'bakery',
    categoryLabel: 'Morning Bakery',
    price: 5.0,
    size: 'Slice',
    description: 'Tender crumb cake made with cold-pressed California olive oil, almond flour, and rosemary sugar.',
    tastingNotes: 'Bright Meyer lemon, herbaceous olive oil, toasted almond',
    originOrPrep: 'Naturally dairy-free recipe',
    temperatures: ['Hot'],
    dairyFreeAvailable: true,
    caffeineFree: true,
    isAvailable: true,
    sortOrder: 160,
  },
  {
    id: 'savory-galette',
    name: 'Heirloom Leek & Gruyère Galette',
    category: 'bakery',
    categoryLabel: 'Morning Bakery',
    price: 6.25,
    size: 'Single',
    description: 'Flaky rye-spelt crust filled with caramelized leeks, aged cave Gruyère, and fresh thyme.',
    tastingNotes: 'Savory caramelized onion, nutty alpine cheese, thyme',
    originOrPrep: 'Available from 7:30 AM until sold out',
    temperatures: ['Hot'],
    dairyFreeAvailable: false,
    caffeineFree: true,
    isAvailable: true,
    sortOrder: 170,
  },
];
