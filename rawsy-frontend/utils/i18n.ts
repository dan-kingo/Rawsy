import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'am' | 'om';

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
  { code: 'om', label: 'Afaan Oromo' },
];

// Translation dictionary
export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    account: 'Account',
    profile: 'Profile',

    // Actions
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
    checkout: 'Checkout',
    requestQuote: 'Request Quote',
    placeOrder: 'Place Order',
    cancel: 'Cancel',
    accept: 'Accept',
    reject: 'Reject',
    upload: 'Upload',
    submit: 'Submit',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    viewDetails: 'View Details',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    continueText: 'Continue',

    // Labels
    price: 'Price',
    stock: 'Stock',
    supplier: 'Supplier',
    orders: 'Orders',
    myOrders: 'My Orders',
    wishlist: 'Wishlist',
    quotes: 'Quotes',
    total: 'Total',
    quantity: 'Quantity',
    category: 'Category',
    description: 'Description',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    company: 'Company',
    role: 'Role',
    status: 'Status',
    language: 'Language',
    selectLanguage: 'Select Language',

    // Order Status
    orderPlaced: 'Order Placed',
    orderConfirmed: 'Confirmed',
    orderInTransit: 'In Transit',
    orderDelivered: 'Delivered',
    orderRejected: 'Rejected',
    orderCancelled: 'Cancelled',

    // Quote Status
    quotePending: 'Pending',
    quoteCounterOffer: 'Counter Offer',
    quoteAcceptedBySupplier: 'Accepted by Supplier',
    quoteAccepted: 'Accepted',
    quoteRejected: 'Rejected',
    quoteCancelled: 'Cancelled',
    quoteConverted: 'Converted to Order',

    // Payment
    paymentMethod: 'Payment Method',
    paymentStatus: 'Payment Status',
    cashOnDelivery: 'Cash on Delivery',
    paymentPending: 'Pending',
    paymentCompleted: 'Completed',
    paymentFailed: 'Failed',

    // Messages
    welcomeBack: 'Welcome back',
    noProductsFound: 'No products found',
    noOrdersFound: 'No orders found',
    noQuotesFound: 'No quote requests',
    emptyCart: 'Your cart is empty',
    loading: 'Loading',
    success: 'Success',
    error: 'Error',
    loginSuccess: 'Login successful',
    registerSuccess: 'Registration successful',
    addedToCart: 'Added to cart',
    orderPlacedSuccess: 'Order placed successfully',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    negotiable: 'Negotiable Price',

    // Profile
    accountInformation: 'Account Information',
    preferences: 'Preferences',
    darkMode: 'Dark Mode',
    enabled: 'Enabled',
    disabled: 'Disabled',
    support: 'Support',
    helpSupport: 'Help & Support',
    about: 'About',

    // Notifications
    newOrderReceived: 'New Order Received',
    orderAccepted: 'Order Accepted',
    orderShipped: 'Order Shipped',
    quoteRequested: 'Quote Requested',
    quoteCountered: 'Supplier Counter Offer',
  },

  am: {
    // Navigation
    home: 'መነሻ',
    products: 'ምርቶች',
    cart: 'ጋሪ',
    account: 'መለያ',
    profile: 'መገለጫ',

    // Actions
    addToCart: 'ወደ ጋሪ አክል',
    buyNow: 'አሁኑኑ ግዛ',
    checkout: 'ክፍያ',
    requestQuote: 'ዋጋ ጠይቅ',
    placeOrder: 'ትዕዛዝ ስጥ',
    cancel: 'ሰርዝ',
    accept: 'ተቀበል',
    reject: 'አትቀበል',
    upload: 'ስቀል',
    submit: 'አስገባ',
    save: 'አስቀምጥ',
    delete: 'ሰርዝ',
    edit: 'አስተካክል',
    viewDetails: 'ዝርዝር ይመልከቱ',
    login: 'ግባ',
    register: 'ይመዝገቡ',
    logout: 'ውጣ',
    continueText: 'ቀጥል',

    // Labels
    price: 'ዋጋ',
    stock: 'አክሲዮን',
    supplier: 'አቅራቢ',
    orders: 'ትዕዛዞች',
    myOrders: 'የእኔ ትዕዛዞች',
    wishlist: 'ተመኛ ዝርዝር',
    quotes: 'ዋጋዎች',
    total: 'ድምር',
    quantity: 'ብዛት',
    category: 'ምድብ',
    description: 'መግለጫ',
    name: 'ስም',
    email: 'ኢሜይል',
    phone: 'ስልክ',
    password: 'የይለፍ ቃል',
    confirmPassword: 'የይለፍ ቃል አረጋግጥ',
    company: 'ኩባንያ',
    role: 'ሚና',
    status: 'ሁኔታ',
    language: 'ቋንቋ',
    selectLanguage: 'ቋንቋ ይምረጡ',

    // Order Status
    orderPlaced: 'ትዕዛዝ ተሰጥቷል',
    orderConfirmed: 'ተረጋግጧል',
    orderInTransit: 'በመንገድ ላይ',
    orderDelivered: 'ደርሷል',
    orderRejected: 'ተከልክሏል',
    orderCancelled: 'ተሰርዟል',

    // Quote Status
    quotePending: 'በመጠባበቅ ላይ',
    quoteCounterOffer: 'ተፈጻሚ ቅናሽ',
    quoteAcceptedBySupplier: 'በአቅራቢ ተቀባይነት አግኝቷል',
    quoteAccepted: 'ተቀባይነት አግኝቷል',
    quoteRejected: 'ተከልክሏል',
    quoteCancelled: 'ተሰርዟል',
    quoteConverted: 'ወደ ትዕዛዝ ተለውጧል',

    // Payment
    paymentMethod: 'የክፍያ ዘዴ',
    paymentStatus: 'የክፍያ ሁኔታ',
    cashOnDelivery: 'በማድረስ ጊዜ ክፍያ',
    paymentPending: 'በመጠባበቅ ላይ',
    paymentCompleted: 'ተጠናቅቋል',
    paymentFailed: 'አልተሳካም',

    // Messages
    welcomeBack: 'እንኳን ደና መጣህ',
    noProductsFound: 'ምርቶች አልተገኙም',
    noOrdersFound: 'ትዕዛዞች አልተገኙም',
    noQuotesFound: 'የዋጋ ጥያቄዎች የሉም',
    emptyCart: 'የእርስዎ ጋሪ ባዶ ነው',
    loading: 'በመጫን ላይ',
    success: 'ተሳክቷል',
    error: 'ስህተት',
    loginSuccess: 'መግባት ተሳክቷል',
    registerSuccess: 'ምዝገባ ተሳክቷል',
    addedToCart: 'ወደ ጋሪ ታክሏል',
    orderPlacedSuccess: 'ትዕዛዝ በተሳካ ሁኔታ ተሰጥቷል',
    inStock: 'በአክሲዮን ውስጥ',
    outOfStock: 'ከክምችት ውጭ',
    negotiable: 'ተደራሽ ዋጋ',

    // Profile
    accountInformation: 'የመለያ መረጃ',
    preferences: 'ምርጫዎች',
    darkMode: 'ጨለማ ሁነታ',
    enabled: 'ነቅቷል',
    disabled: 'ተሰናክሏል',
    support: 'ድጋፍ',
    helpSupport: 'እገዛ እና ድጋፍ',
    about: 'ስለ',

    // Notifications
    newOrderReceived: 'አዲስ ትዕዛዝ ደርሷል',
    orderAccepted: 'ትዕዛዝ ተቀባይነት አግኝቷል',
    orderShipped: 'ትዕዛዝ ተልኳል',
    quoteRequested: 'ዋጋ ተጠይቋል',
    quoteCountered: 'የአቅራቢ ተፈጻሚ ቅናሽ',
  },

  om: {
    // Navigation
    home: 'Mana',
    products: 'Oomishaalee',
    cart: 'Gaarii',
    account: 'Akkaawuntii',
    profile: 'Piroofayilii',

    // Actions
    addToCart: 'Gara Gaarii Itti Dabaluu',
    buyNow: 'Ammuma Bitaa',
    checkout: 'Kaffaltii',
    requestQuote: 'Gatii Gaafadhu',
    placeOrder: 'Ajaja Kennuu',
    cancel: 'Haquu',
    accept: 'Fudhadhu',
    reject: 'Diduuf',
    upload: 'Fe\'uu',
    submit: 'Galchuu',
    save: 'Kuusuu',
    delete: 'Haquu',
    edit: 'Gulaaluu',
    viewDetails: 'Bal\'ina Ilaali',
    login: 'Seenuu',
    register: 'Galmaa\'uu',
    logout: 'Bahuu',
    continueText: 'Itti Fufu',

    // Labels
    price: 'Gatii',
    stock: 'Istooka',
    supplier: 'Dhiyeessaa',
    orders: 'Ajajawwan',
    myOrders: 'Ajajawwan Koo',
    wishlist: 'Tarree Hawwii',
    quotes: 'Gatiiilee',
    total: 'Waliigala',
    quantity: 'Hamma',
    category: 'Ramaddii',
    description: 'Ibsa',
    name: 'Maqaa',
    email: 'Iimeelii',
    phone: 'Bilbila',
    password: 'Jecha Darbii',
    confirmPassword: 'Jecha Darbii Mirkaneessi',
    company: 'Dhaabbata',
    role: 'Gahee',
    status: 'Haala',
    language: 'Afaan',
    selectLanguage: 'Afaan Filadhu',

    // Order Status
    orderPlaced: 'Ajajni Kennameera',
    orderConfirmed: 'Mirkanaa\'eera',
    orderInTransit: 'Karaa Irra Jira',
    orderDelivered: 'Dhiyaateera',
    orderRejected: 'Fudhatama Dhabe',
    orderCancelled: 'Haqameera',

    // Quote Status
    quotePending: 'Eegaa Jiru',
    quoteCounterOffer: 'Kaawuntarii',
    quoteAcceptedBySupplier: 'Dhiyeessaan Fudhateera',
    quoteAccepted: 'Fudhateera',
    quoteRejected: 'Haqumeera',
    quoteCancelled: 'Haqameera',
    quoteConverted: 'Gara Ajajaatti Jijjiirame',

    // Payment
    paymentMethod: 'Mala Kaffaltii',
    paymentStatus: 'Haala Kaffaltii',
    cashOnDelivery: 'Yeroo Dhiyaatu Kaffaltii',
    paymentPending: 'Eegaa Jiru',
    paymentCompleted: 'Xumurame',
    paymentFailed: 'Kufate',

    // Messages
    welcomeBack: 'Baga Deebitanii',
    noProductsFound: 'Oomishaaleen Hin Argamne',
    noOrdersFound: 'Ajajawwan Hin Argamne',
    noQuotesFound: 'Gaaffilee Gatii Hin Jiran',
    emptyCart: 'Gaarii Keessan Duwwaa Dha',
    loading: 'Fe\'aa Jiru',
    success: 'Milkaa\'eera',
    error: 'Dogoggora',
    loginSuccess: 'Seenuun Milkaa\'eera',
    registerSuccess: 'Galmaa\'uun Milkaa\'eera',
    addedToCart: 'Gara Gaarii Dabalameera',
    orderPlacedSuccess: 'Ajajni Haala Gaariin Kennameera',
    inStock: 'Istooka Keessa',
    outOfStock: 'Istooka Keessaa Baha',
    negotiable: 'Gatii Haasaawaa',

    // Profile
    accountInformation: 'Odeeffannoo Akkaawuntii',
    preferences: 'Filannoo',
    darkMode: 'Haalata Dukkanaa',
    enabled: 'Dandeessifameera',
    disabled: 'Dandeeffifamee Hin Jiru',
    support: 'Deeggarsa',
    helpSupport: 'Gargaarsa fi Deeggarsa',
    about: 'Waa\'ee',

    // Notifications
    newOrderReceived: 'Ajajni Haaraan Argameera',
    orderAccepted: 'Ajajni Fudhatameera',
    orderShipped: 'Ajajni Ergameera',
    quoteRequested: 'Gatiin Gaafatameera',
    quoteCountered: 'Kaawuntarii Dhiyeessaa',
  },
};

// Get translation
export const t = (key: string, lang: Language = 'en'): string => {
  return translations[lang][key] || translations['en'][key] || key;
};

// Save language to AsyncStorage
export const saveLanguage = async (lang: Language) => {
  await AsyncStorage.setItem('appLanguage', lang);
};

// Get language from AsyncStorage
export const getLanguage = async (): Promise<Language> => {
  const lang = await AsyncStorage.getItem('appLanguage');
  return (lang as Language) || 'en';
};
