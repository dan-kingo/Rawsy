import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TextInput as RNTextInput, 
  RefreshControl 
} from 'react-native';
import { 
  Text, 
  Appbar, 
  List, 
  Surface, 
  useTheme as usePaperTheme, 
  SegmentedButtons, 
  Chip, 
  Divider,
  Card,
  Button
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category: 'general' | 'account' | 'orders' | 'products' | 'payments' | 'delivery';
}

const HelpSupportScreen: React.FC = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('faq');
  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Check if user is supplier or manufacturer
  const isSupplier = user?.role === 'supplier';
  
  // Manufacturer FAQs based on the document
  const manufacturerFAQs: FAQ[] = [
    {
      id: 'm1',
      question: 'How do I create an account as a manufacturer?',
      answer: 'You can create an account by clicking "Sign Up", then selecting "Manufacturer" as your role. You\'ll need to provide your phone number or email, company name, factory location, and contact details. Business verification documents are optional but recommended for added trust.',
      tags: ['account', 'registration'],
      category: 'account'
    },
    {
      id: 'm2',
      question: 'How do I search for raw materials?',
      answer: 'On the Home screen, tap the search bar or go to "Browse & Search". You can browse by category (agriculture, chemicals, metals, plastics, packaging), filter by price, location, stock availability, or supplier rating, and use keywords like "cotton" or "cement".',
      tags: ['search', 'browse', 'products'],
      category: 'products'
    },
    {
      id: 'm3',
      question: 'How do I verify supplier authenticity?',
      answer: 'Look for the "Verified Supplier" badge on supplier profiles. All suppliers on Rawsy are screened for authenticity before approval. You can also check their ratings, reviews, and company information.',
      tags: ['suppliers', 'verification', 'trust'],
      category: 'general'
    },
    {
      id: 'm4',
      question: 'What payment methods are available?',
      answer: 'Currently, we support bank transfers/deposit slips and cash on delivery (if supported by the supplier). Mobile money/Telebirr integration is planned for future updates.',
      tags: ['payments', 'checkout'],
      category: 'payments'
    },
    {
      id: 'm5',
      question: 'How do I place an order?',
      answer: '1. Add products to your cart\n2. Proceed to checkout\n3. Select delivery address (manual or map)\n4. Choose payment method\n5. Confirm order\n6. Track order status in real-time',
      tags: ['orders', 'checkout', 'cart'],
      category: 'orders'
    },
    {
      id: 'm6',
      question: 'How do I track my order?',
      answer: 'Go to "Order Tracking" in your account. You\'ll see the status: Ordered → Confirmed → In transit → Delivered. You\'ll also receive push notifications for updates.',
      tags: ['orders', 'tracking', 'delivery'],
      category: 'delivery'
    },
    {
      id: 'm7',
      question: 'Can I negotiate prices for bulk orders?',
      answer: 'Yes! For bulk orders, you can request a quote or negotiate directly with the supplier. Use the "Request Quote" option during checkout or contact the supplier through their profile.',
      tags: ['orders', 'bulk', 'negotiation'],
      category: 'orders'
    },
    {
      id: 'm8',
      question: 'How do I rate a supplier?',
      answer: 'After your order is delivered, you\'ll receive a prompt to rate the supplier. You can also go to your past orders, select the completed order, and add your rating and review.',
      tags: ['suppliers', 'ratings', 'reviews'],
      category: 'general'
    },
    {
      id: 'm9',
      question: 'What if a product is out of stock?',
      answer: 'You can add out-of-stock products to your wishlist. When the product is back in stock, you\'ll receive a notification. You can also use the "Notify Me" feature.',
      tags: ['products', 'stock', 'wishlist'],
      category: 'products'
    },
    {
      id: 'm10',
      question: 'How do I update my company information?',
      answer: 'Go to Account & Settings → Edit Company Info. You can update your contact details, factory location, and upload new verification documents anytime.',
      tags: ['account', 'profile', 'settings'],
      category: 'account'
    }
  ];

  // Supplier FAQs based on the document
  const supplierFAQs: FAQ[] = [
    {
      id: 's1',
      question: 'How do I register as a supplier?',
      answer: 'Click "Sign Up" and select "Supplier" as your role. Provide your phone number/email, business information, upload your company logo and description, and submit verification documents. Admin approval takes 24-48 hours.',
      tags: ['account', 'registration'],
      category: 'account'
    },
    {
      id: 's2',
      question: 'How do I add products to my catalog?',
      answer: '1. Go to "My Products"\n2. Tap the "+" button\n3. Add product name, price, quantity, unit type, and photos\n4. Optionally upload product datasheets or certifications\n5. Submit for approval',
      tags: ['products', 'catalog', 'upload'],
      category: 'products'
    },
    {
      id: 's3',
      question: 'How do I manage incoming orders?',
      answer: 'Go to "Manage Orders" to see new orders. You can accept or reject orders with one tap, mark orders as shipped or delivered, and communicate directly with buyers if needed.',
      tags: ['orders', 'management'],
      category: 'orders'
    },
    {
      id: 's4',
      question: 'What information appears in my supplier dashboard?',
      answer: 'Your dashboard shows: total sales, top-selling products, product views and inquiries, order history, and revenue analytics. This helps you track your performance.',
      tags: ['dashboard', 'analytics'],
      category: 'general'
    },
    {
      id: 's5',
      question: 'How do I update product stock levels?',
      answer: 'Go to "My Products", select the product, tap "Edit", update the quantity, and save. You can also set minimum order quantities for each product.',
      tags: ['products', 'stock', 'inventory'],
      category: 'products'
    },
    {
      id: 's6',
      question: 'How are payments processed?',
      answer: 'Buyers can pay via bank transfer or cash on delivery. Rawsy helps facilitate secure transactions between buyers and sellers. Payment processing details are shown in your sales analytics.',
      tags: ['payments', 'revenue'],
      category: 'payments'
    },
    {
      id: 's7',
      question: 'How do I handle order rejections?',
      answer: 'If you need to reject an order, tap "Reject Order" and optionally provide a reason. The buyer will be notified immediately. Try to accept orders whenever possible to maintain good ratings.',
      tags: ['orders', 'rejections'],
      category: 'orders'
    },
    {
      id: 's8',
      question: 'How do I get the "Verified Supplier" badge?',
      answer: 'Complete your profile with all required information, upload verification documents, and maintain good ratings. The admin team reviews all supplier accounts for verification.',
      tags: ['verification', 'badge', 'trust'],
      category: 'account'
    },
    {
      id: 's9',
      question: 'Can I offer discounts on products?',
      answer: 'Yes! When adding or editing a product, you can set discounts with percentages and expiration dates. Discounted products appear with special badges in search results.',
      tags: ['products', 'pricing', 'discounts'],
      category: 'products'
    },
    {
      id: 's10',
      question: 'What if my product gets rejected by admin?',
      answer: 'You\'ll receive a notification with the rejection reason. Common reasons include incomplete information, prohibited items, or misleading content. Edit the product based on feedback and resubmit.',
      tags: ['products', 'moderation', 'rejection'],
      category: 'products'
    }
  ];

  // Common FAQs for all users
  const commonFAQs: FAQ[] = [
    {
      id: 'c1',
      question: 'How do I contact support?',
      answer: 'You can contact our admin team at admin@rawsy.com for urgent issues. For general questions, check the FAQs first. Response time is typically within 24 hours.',
      tags: ['support', 'contact'],
      category: 'general'
    },
    {
      id: 'c2',
      question: 'What languages are supported?',
      answer: 'Rawsy supports English, Amharic, and Afaan Oromo. You can change the language in Account & Settings → Language Preferences.',
      tags: ['language', 'settings'],
      category: 'general'
    },
    {
      id: 'c3',
      question: 'Is there a mobile app?',
      answer: 'Yes! Rawsy is designed as a mobile-first platform. You can use all features on your mobile device. The app is fully testable on real devices.',
      tags: ['mobile', 'app'],
      category: 'general'
    },
    {
      id: 'c4',
      question: 'How do I reset my password?',
      answer: 'On the login screen, tap "Forgot Password". Enter your registered email or phone number, and follow the instructions sent to you.',
      tags: ['account', 'password', 'security'],
      category: 'account'
    },
    {
      id: 'c5',
      question: 'Are there any fees for using Rawsy?',
      answer: 'Rawsy is currently free for manufacturers to browse and order. Some premium features for suppliers may be introduced later. You\'ll be notified of any changes.',
      tags: ['fees', 'pricing'],
      category: 'general'
    }
  ];

  // Combine FAQs based on user role
  const allFAQs = [...commonFAQs, ...(isSupplier ? supplierFAQs : manufacturerFAQs)];

  // Get all unique tags and categories
  const allTags = Array.from(new Set(allFAQs.flatMap(faq => faq.tags))).filter(Boolean);
  const allCategories = Array.from(new Set(allFAQs.map(faq => faq.category))).filter(Boolean);

  // Category labels
  const categoryLabels: Record<string, string> = {
    'general': 'General',
    'account': 'Account',
    'orders': 'Orders',
    'products': 'Products',
    'payments': 'Payments',
    'delivery': 'Delivery'
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleTagPress = (tag: string): void => {
    if (selectedTag === tag) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
  };

  const handleCategoryPress = (category: string): void => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const clearFilters = (): void => {
    setSelectedTag(null);
    setSelectedCategory(null);
    setSearch('');
  };

  // Filter FAQs based on search, tag, and category
  const filteredFAQs: FAQ[] = allFAQs.filter((faq: FAQ) => {
    const matchesSearch = search === '' || 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    
    const matchesTag = selectedTag === null || faq.tags.includes(selectedTag);
    const matchesCategory = selectedCategory === null || faq.category === selectedCategory;
    
    return matchesSearch && matchesTag && matchesCategory;
  });

  const handleFAQPress = (id: string): void => {
    if (expandedFAQ === id) {
      setExpandedFAQ(null);
    } else {
      setExpandedFAQ(id);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('helpSupport') ?? "Help & Support"} />
      </Appbar.Header>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'faq', label: 'FAQs', icon: 'help-circle' },
            { value: 'contact', label: 'Contact', icon: 'email' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[paperTheme.colors.primary]} 
          />
        }
      >
        {activeTab === 'faq' ? (
          <>
            {/* User Role Badge */}
            <Surface style={[styles.roleBadge, { backgroundColor: paperTheme.colors.surface }]}>
              <View style={styles.roleInfo}>
                <MaterialIcons 
                  name={isSupplier ? "store" : "factory"} 
                  size={20} 
                  color={paperTheme.colors.primary} 
                />
                <Text variant="labelMedium" style={[styles.roleText, { color: paperTheme.colors.onSurface }]}>
                  {isSupplier ? 'Supplier' : 'Manufacturer'} FAQs
                </Text>
              </View>
              <Text variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>
                Showing FAQs specific to your role
              </Text>
            </Surface>

            {/* Search Bar */}
            <Surface style={[styles.searchContainer, { backgroundColor: paperTheme.colors.surface }]}>
              <RNTextInput
                placeholder="Search questions..."
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: paperTheme.colors.onSurface }]}
              />
              {search && (
                <MaterialIcons 
                  name="close" 
                  size={20} 
                  color={paperTheme.colors.onSurfaceVariant}
                  onPress={() => setSearch('')}
                  style={styles.clearSearch}
                />
              )}
            </Surface>

            {/* Categories Filter */}
            <Surface style={[styles.categoriesContainer, { backgroundColor: paperTheme.colors.surface }]}>
              <Text variant="bodyMedium" style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                Browse by Category:
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                <View style={styles.categoriesRow}>
                  {allCategories.map((category: string, index: number) => (
                    <Chip
                      key={index}
                      selected={selectedCategory === category}
                      onPress={() => handleCategoryPress(category)}
                      mode={selectedCategory === category ? 'flat' : 'outlined'}
                      style={styles.categoryChip}
                      icon={selectedCategory === category ? "check" : undefined}
                    >
                      {categoryLabels[category] || category}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </Surface>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <Surface style={[styles.tagsContainer, { backgroundColor: paperTheme.colors.surface }]}>
                <Text variant="bodyMedium" style={[styles.sectionTitle, { color: paperTheme.colors.onSurface }]}>
                  Popular Topics:
                </Text>
                <View style={styles.tagsGrid}>
                  {allTags.map((tag: string, index: number) => (
                    <Chip
                      key={index}
                      selected={selectedTag === tag}
                      onPress={() => handleTagPress(tag)}
                      mode={selectedTag === tag ? 'flat' : 'outlined'}
                      style={styles.tagChip}
                      compact
                    >
                      {tag}
                    </Chip>
                  ))}
                </View>
              </Surface>
            )}

            {/* Active Filters Info */}
            {(selectedTag || selectedCategory || search) && (
              <Surface style={[styles.filterInfo, { backgroundColor: paperTheme.colors.surface }]}>
                <View style={styles.filterInfoRow}>
                  <Text variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, flex: 1 }}>
                    Showing {filteredFAQs.length} results
                    {selectedCategory && ` in "${categoryLabels[selectedCategory]}"`}
                    {selectedTag && ` for "${selectedTag}"`}
                    {search && ` matching "${search}"`}
                  </Text>
                  <Button
                    mode="text"
                    onPress={clearFilters}
                    compact
                    textColor={paperTheme.colors.primary}
                    icon="close"
                  >
                    Clear All
                  </Button>
                </View>
              </Surface>
            )}

            {/* FAQ List */}
            <Surface style={[styles.faqContainer, { backgroundColor: paperTheme.colors.surface }]}>
              {filteredFAQs.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialIcons 
                    name="search-off" 
                    size={48} 
                    color={paperTheme.colors.onSurfaceVariant} 
                  />
                  <Text 
                    variant="bodyMedium" 
                    style={{ 
                      color: paperTheme.colors.onSurfaceVariant, 
                      textAlign: 'center',
                      marginTop: 12,
                      marginBottom: 16
                    }}
                  >
                    No FAQs found. Try adjusting your search or filters.
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={clearFilters}
                    icon="refresh"
                  >
                    Clear All Filters
                  </Button>
                </View>
              ) : (
                filteredFAQs.map((faq: FAQ, index: number) => (
                  <View key={faq.id}>
                    <Card
                      style={[
                        styles.faqCard,
                        expandedFAQ === faq.id && styles.faqCardExpanded
                      ]}
                      onPress={() => handleFAQPress(faq.id)}
                    >
                      <Card.Content>
                        <View style={styles.faqHeader}>
                          <View style={styles.faqQuestionContainer}>
                            <Text 
                              variant="titleMedium" 
                              style={[
                                styles.faqQuestion,
                                expandedFAQ === faq.id && { color: paperTheme.colors.primary }
                              ]}
                              numberOfLines={expandedFAQ === faq.id ? 10 : 2}
                            >
                              {faq.question}
                            </Text>
                            <View style={styles.faqCategory}>
                              <Chip 
                                mode="outlined" 
                                compact 
                                style={styles.faqCategoryChip}
                                textStyle={styles.faqCategoryText}
                              >
                                {categoryLabels[faq.category] || faq.category}
                              </Chip>
                            </View>
                          </View>
                          <MaterialIcons 
                            name={expandedFAQ === faq.id ? "expand-less" : "expand-more"} 
                            size={24} 
                            color={paperTheme.colors.onSurfaceVariant} 
                          />
                        </View>
                        
                        {expandedFAQ === faq.id && (
                          <>
                            <Divider style={styles.faqDivider} />
                            <Text 
                              variant="bodyMedium" 
                              style={[styles.faqAnswer, { color: paperTheme.colors.onSurfaceVariant }]}
                            >
                              {faq.answer}
                            </Text>
                            <View style={styles.faqTagsContainer}>
                              {faq.tags.map((tag: string, tagIndex: number) => (
                                <Chip 
                                  key={tagIndex} 
                                  compact 
                                  mode="outlined"
                                  style={styles.faqTagChip}
                                  textStyle={styles.faqTagText}
                                >
                                  {tag}
                                </Chip>
                              ))}
                            </View>
                          </>
                        )}
                      </Card.Content>
                    </Card>
                    {index < filteredFAQs.length - 1 && (
                      <Divider style={styles.faqCardDivider} />
                    )}
                  </View>
                ))
              )}
            </Surface>

            {/* FAQ Count */}
            <Text variant="bodySmall" style={[styles.faqCount, { color: paperTheme.colors.onSurfaceVariant }]}>
              {filteredFAQs.length} of {allFAQs.length} FAQs shown
            </Text>
          </>
        ) : (
          /* Contact Tab */
          <View style={styles.contactTab}>
            <Surface style={[styles.contactContainer, { backgroundColor: paperTheme.colors.surface }]}>
              <View style={styles.contactHeader}>
                <MaterialIcons 
                  name="contact-support" 
                  size={48} 
                  color={paperTheme.colors.primary} 
                />
                <Text variant="titleLarge" style={styles.contactTitle}>
                  Contact Support
                </Text>
              </View>
              
              <Text variant="bodyMedium" style={[styles.contactText, { color: paperTheme.colors.onSurfaceVariant }]}>
                Our support team is here to help you with any issues or questions you might have.
              </Text>
              
              <Card style={styles.contactCard}>
                <Card.Content>
                  <View style={styles.contactMethod}>
                    <MaterialIcons 
                      name="email" 
                      size={24} 
                      color={paperTheme.colors.primary} 
                    />
                    <View style={styles.contactMethodInfo}>
                      <Text variant="titleMedium" style={styles.contactMethodTitle}>
                        Email Support
                      </Text>
                      <Text variant="bodyMedium" style={[styles.contactDetail, { color: paperTheme.colors.onSurfaceVariant }]}>
                        admin@rawsy.com
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Card style={styles.contactCard}>
                <Card.Content>
                  <View style={styles.contactMethod}>
                    <MaterialIcons 
                      name="access-time" 
                      size={24} 
                      color={paperTheme.colors.primary} 
                    />
                    <View style={styles.contactMethodInfo}>
                      <Text variant="titleMedium" style={styles.contactMethodTitle}>
                        Response Time
                      </Text>
                      <Text variant="bodyMedium" style={[styles.contactDetail, { color: paperTheme.colors.onSurfaceVariant }]}>
                        Within 24 hours
                      </Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>

              <Divider style={styles.contactDivider} />

              <Text variant="bodyMedium" style={[styles.contactNote, { color: paperTheme.colors.onSurfaceVariant }]}>
                Please include the following in your email for faster assistance:
              </Text>
              
              <List.Section>
                <List.Item
                  title="Your user type"
                  description={isSupplier ? "Supplier" : "Manufacturer"}
                  left={props => <List.Icon {...props} icon="account" />}
                />
                <List.Item
                  title="Detailed description"
                  description="Explain your issue or question clearly"
                  left={props => <List.Icon {...props} icon="text" />}
                />
                <List.Item
                  title="Screenshots if applicable"
                  description="Attach screenshots to help us understand"
                  left={props => <List.Icon {...props} icon="image" />}
                />
              </List.Section>
            </Surface>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 0,
  },
  content: {
    padding: 16,
    paddingTop: 8,
  },
  roleBadge: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  roleText: {
    fontWeight: '600',
  },
  searchContainer: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 40,
  },
  clearSearch: {
    padding: 4,
  },
  categoriesContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    height: 36,
  },
  tagsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    height: 32,
  },
  filterInfo: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  filterInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  faqCard: {
    margin: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    elevation: 0,
  },
  faqCardExpanded: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  faqQuestionContainer: {
    flex: 1,
    marginRight: 12,
  },
  faqQuestion: {
    fontWeight: '600',
    marginBottom: 8,
  },
  faqCategory: {
    marginTop: 4,
  },
  faqCategoryChip: {
    height: 34,
  },
  faqCategoryText: {
    fontSize: 14,
  },
  faqDivider: {
    marginVertical: 12,
  },
  faqAnswer: {
    lineHeight: 22,
    marginBottom: 16,
  },
  faqTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  faqTagChip: {
    height: 34,
  },
  faqTagText: {
    fontSize: 14,
  },
  faqCardDivider: {
    marginHorizontal: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqCount: {
    textAlign: 'center',
    marginBottom: 64,
  },
  contactTab: {
    flex: 1,
  },
  contactContainer: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 64,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contactTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  contactText: {
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  contactCard: {
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 16,
  },
  contactDivider: {
    marginVertical: 24,
  },
  contactNote: {
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default HelpSupportScreen;