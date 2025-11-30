import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Linking } from "react-native";
import { Text, Appbar, Card, Button, Surface, Chip, ActivityIndicator, Avatar, Badge } from "react-native-paper";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLanguage } from "../../context/LanguageContext";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState, useEffect } from "react";
import api from "../../services/api";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<any>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'supplier' ? '/home/supplier' : '/home/manufacturer';
      const response = await api.get(endpoint);
      setHomeData(response.data);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Content title="Rawsy" />
        </Appbar.Header>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (user?.role === 'manufacturer') {
    return <ManufacturerHome homeData={homeData} refreshing={refreshing} onRefresh={onRefresh} />;
  }

  if (user?.role === 'supplier') {
    return <SupplierDashboard homeData={homeData} refreshing={refreshing} onRefresh={onRefresh} />;
  }

  return null;
}

function ManufacturerHome({ homeData, refreshing, onRefresh }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);

  const quickActions = [
    { icon: "inventory", label: t('products'), screen: "/products" },
    { icon: "shopping-cart", label: t('cart'), screen: "/cart" },
    { icon: "favorite", label: t('wishlist'), screen: "/wishlist" },
    { icon: "request-quote", label: t('quotes'), screen: "/quotes" },
    { icon: "receipt", label: t('orders'), screen: "/orders" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Rawsy" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <Surface style={[styles.welcomeCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <Text variant="headlineSmall" style={[styles.welcomeTitle, { color: theme.colors.onSurface }]}>
            {t('welcomeBack')}, {user?.name}!
          </Text>
          <View style={styles.userInfo}>
            <Chip
              icon="account-circle"
              style={[styles.roleChip, { backgroundColor: theme.colors.primaryContainer }]}
              textStyle={{ color: theme.colors.onPrimaryContainer }}
            >
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </Chip>
          </View>
        </Surface>

        <View style={styles.section}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push(action.screen as any)}
              >
                <Card.Content style={styles.actionContent}>
                  <MaterialIcons name={action.icon as any} size={32} color={theme.colors.onSecondary} />
                  <Text variant="bodyMedium" style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                    {action.label}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {homeData?.popularMaterials && homeData.popularMaterials.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Popular Materials
              </Text>
              <Button mode="text" onPress={() => router.push('/products')}>
                View All
              </Button>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {homeData.popularMaterials.map((product: any, index: number) => (
                <Card
                  key={index}
                  style={[styles.productCard, { backgroundColor: theme.colors.surface }]}
                  onPress={() => router.push({ pathname: '/product/[id]', params: { id: product._id } })}
                >
                  <Card.Cover
                    source={{ uri: product.image || 'https://via.placeholder.com/150' }}
                    style={styles.productImage}
                  />
                  <Card.Content style={styles.productContent}>
                    <Text variant="titleSmall" numberOfLines={1} style={styles.productName}>
                      {product.name}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.productPrice, { color: theme.colors.primary }]}>
                      {product.price} ETB/{product.unit}
                    </Text>
                    {product.rating?.average > 0 && (
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={14} color="#f59e0b" />
                        <Text variant="bodySmall" style={styles.ratingText}>
                          {product.rating.average.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {homeData?.recommendedSuppliers && homeData.recommendedSuppliers.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Recommended Suppliers
            </Text>
            {homeData.recommendedSuppliers.map((supplier: any, index: number) => (
              <Card key={index} style={[styles.supplierCard, { backgroundColor: theme.colors.surface }]}> 
                <Card.Content>
                  <View style={styles.supplierRow}>
                    <Avatar.Text
                      size={48}
                      label={supplier.name?.charAt(0).toUpperCase() || 'S'}
                      style={{ backgroundColor: theme.colors.primaryContainer }}
                    />
                    <View style={styles.supplierInfo}>
                      <View style={styles.supplierNameRow}>
                        <Text variant="titleMedium" style={styles.supplierName}>
                          {supplier.name}
                        </Text>
                        {(supplier.verifiedSupplier || supplier.verified || supplier.isVerified) && (
                          <Badge style={styles.cardVerifiedBadge}>Verified</Badge>
                        )}
                      </View>
                      {supplier.companyName && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {supplier.companyName}
                        </Text>
                      )}
                      <View style={styles.supplierStats}>
                        <MaterialIcons name="star" size={14} color="#f59e0b" />
                        <Text variant="bodySmall" style={styles.ratingText}>
                          {supplier.averageRating?.toFixed(1) || '0.0'} ({supplier.reviewCount || 0})
                        </Text>
                      </View>
                    </View>
                  </View>
                </Card.Content>

                <Card.Actions>
                  <Button
                      mode="outlined"
                      compact
                      onPress={() => router.push({ pathname: '/supplier/[id]', params: { id: supplier._id } })}
                      style={styles.viewButton}
                    >
                      View
                    </Button>
                </Card.Actions>

                {expandedSupplierId === supplier._id && (
                  <Card.Content>
                    <View style={styles.supplierDetails}>
                      {supplier.companyName ? (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="business" size={16} color={theme.colors.onSurfaceVariant} />
                          <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Company:</Text>
                          <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>{supplier.companyName}</Text>
                        </View>
                      ) : null}

                      {supplier.location ? (
                        <View style={styles.detailRow}>
                          <MaterialIcons name="location-on" size={16} color={theme.colors.onSurfaceVariant} />
                          <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>Location:</Text>
                          <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>{supplier.location}</Text>
                        </View>
                      ) : null}

                      {supplier.contact ? (
                        <TouchableOpacity onPress={() => Linking.openURL(`tel:${supplier.contact}`)} style={styles.detailRow}>
                          <MaterialIcons name="phone" size={16} color={theme.colors.primary} />
                          <Text variant="bodySmall" style={[styles.detailLabel, { color: theme.colors.onSurface }]}>Contact:</Text>
                          <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.primary }]}>{supplier.contact}</Text>
                        </TouchableOpacity>
                      ) : null}

                      {supplier.verifiedSupplier ? (
                        <View style={[styles.detailRow, { marginTop: 6 }]}> 
                          <MaterialIcons name="verified" size={16} color="#10b981" />
                          <Text variant="bodySmall" style={[styles.detailValue, { color: '#10b981', marginLeft: 6 }]}>Verified Supplier</Text>
                        </View>
                      ) : null}
                    </View>
                  </Card.Content>
                )}
              </Card>
            ))}
          </View>
        )}

        {homeData?.trendingCategories && homeData.trendingCategories.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Trending Categories
            </Text>
            <View style={styles.categoryGrid}>
              {homeData.trendingCategories.map((category: any, index: number) => (
                <Chip
                  key={index}
                  style={[styles.categoryChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={{ color: theme.colors.onPrimaryContainer }}
                  onPress={() => router.push('/products')}
                >
                  {category.name} ({category.count})
                </Chip>
              ))}
            </View>
          </View>
        )}

        {homeData?.recentOrders && homeData.recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
                Recent Orders
              </Text>
              <Button mode="text" onPress={() => router.push('/orders')}>
                View All
              </Button>
            </View>
            {homeData.recentOrders.map((order: any, index: number) => (
              <Card key={index} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.orderRow}>
                    <View style={styles.orderInfo}>
                      <Text variant="titleSmall">{order.reference}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text variant="titleMedium" style={[styles.orderTotal, { color: theme.colors.primary }]}>
                        {order.total} ETB
                      </Text>
                      <Chip style={styles.statusChip} textStyle={{ fontSize: 11 }}>
                        {order.status}
                      </Chip>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SupplierDashboard({ homeData, refreshing, onRefresh }: any) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  const quickActions = [
    { icon: "inventory-2", label: "My Products", screen: "/products", color: theme.colors.primary, bg: '#dbeafe' },
    { icon: "add-box", label: "Add Product", screen: "/add-product", color: "#10b981", bg: '#d1fae5' },
    { icon: "receipt-long", label: "Orders", screen: "/orders", color: "#f59e0b", bg: '#fef3c7' },
    { icon: "chat-bubble", label: "Quotes", screen: "/quotes", color: "#8b5cf6", bg: '#ede9fe' },
  ];

  if (user?.status === "pending") {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header elevated>
          <Appbar.Content title="Supplier Dashboard" />
        </Appbar.Header>
        <ScrollView style={styles.content}>
          <Surface style={[styles.welcomeCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text variant="headlineSmall" style={styles.welcomeTitle}>
              Welcome, {user?.name}!
            </Text>
          </Surface>
          <Card style={[styles.alertCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <MaterialIcons name="info" size={24} color={theme.colors.tertiary} />
                <Text variant="titleMedium" style={[styles.alertTitle, { color: theme.colors.tertiary }]}>
                  Account Pending
                </Text>
              </View>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                Your supplier account is awaiting admin approval. You will be notified once approved.
              </Text>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title="Supplier Dashboard" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <Surface style={[styles.welcomeCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeTextContainer}>
              <Text variant="headlineSmall" style={styles.welcomeTitle}>
                Welcome back, {user?.name}!
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                Manage your business operations
              </Text>
            </View>
            {user?.profileImage ? (
                       <Avatar.Image
                         size={80}
                         source={{ uri: user.profileImage }}
                         style={styles.avatar}
                       />
                     ) : (
                       <Avatar.Text
                         size={80}
                         label={user?.name?.charAt(0).toUpperCase() || 'U'}
                         style={styles.avatar}
                       />
                     )}
          </View>
        </Surface>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <Card
                key={index}
                style={[styles.actionCard, { backgroundColor: theme.colors.surface }]}
                onPress={() => router.push(action.screen as any)}
                elevation={2}
              >
                <Card.Content style={styles.actionContent}>
                  <View style={[styles.actionIconContainer, { backgroundColor: action.bg }]}>
                    <MaterialIcons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <Text variant="bodyMedium" style={[styles.actionLabel, { color: theme.colors.onSurface }]}>
                    {action.label}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        <Surface style={[styles.statsCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Text variant="titleLarge" style={[styles.sectionTitle, { marginBottom: 16 }]}>
            Business Overview
          </Text>
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, { backgroundColor: '#dbeafe' }]} elevation={0}>
              <Card.Content style={styles.statCardContent}>
                <MaterialIcons name="inventory-2" size={32} color={theme.colors.primary} />
                <Text variant="headlineMedium" style={[styles.statValue, { color: theme.colors.primary }]}>
                  {homeData?.overview?.totalProducts || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Total Products</Text>
                <Text variant="bodySmall" style={{ color: '#10b981', marginTop: 4, fontWeight: '600' }}>
                  {homeData?.overview?.approvedProducts || 0} Approved
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: '#fef3c7' }]} elevation={0}>
              <Card.Content style={styles.statCardContent}>
                <MaterialIcons name="receipt-long" size={32} color="#f59e0b" />
                <Text variant="headlineMedium" style={[styles.statValue, { color: '#f59e0b' }]}>
                  {homeData?.overview?.totalOrders || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Total Orders</Text>
                <Text variant="bodySmall" style={{ color: '#f59e0b', marginTop: 4, fontWeight: '600' }}>
                  {homeData?.overview?.activeOrders || 0} Active
                </Text>
              </Card.Content>
            </Card>
            <Card style={[styles.statCard, { backgroundColor: '#d1fae5' }]} elevation={0}>
              <Card.Content style={styles.statCardContent}>
                <MaterialIcons name="payments" size={32} color="#10b981" />
                <Text variant="headlineMedium" style={[styles.statValue, { color: '#10b981' }]}>
                  {homeData?.overview?.totalRevenue || 0}
                </Text>
                <Text variant="bodySmall" style={styles.statLabel}>Revenue (ETB)</Text>
              </Card.Content>
            </Card>
          </View>
        </Surface>

        {homeData?.rejectedProducts && homeData.rejectedProducts.length > 0 && (
          <Card style={[styles.alertCard, { backgroundColor: '#fee2e2' }]}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <MaterialIcons name="warning" size={24} color="#dc2626" />
                <Text variant="titleMedium" style={{ color: '#dc2626', fontWeight: '600' }}>
                  Product Moderation Alert
                </Text>
              </View>
              {homeData.rejectedProducts.map((product: any, index: number) => (
                <View key={index} style={styles.rejectedItem}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                      {product.name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#991b1b', marginTop: 4 }}>
                      Reason: {product.rejectionReason}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => router.push({ pathname: '/edit-product', params: { id: product._id } })}
                    buttonColor="#dc2626"
                    compact
                    style={{ marginTop: 8 }}
                  >
                    Edit Product
                  </Button>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {homeData?.lowStockProducts && homeData.lowStockProducts.length > 0 && (
          <Card style={[styles.alertCard, { backgroundColor: '#fef3c7' }]}>
            <Card.Content>
              <View style={styles.alertHeader}>
                <MaterialIcons name="inventory" size={24} color="#f59e0b" />
                <Text variant="titleMedium" style={{ color: '#92400e', fontWeight: '600' }}>
                  Low Stock Alert
                </Text>
              </View>
              {homeData.lowStockProducts.map((product: any, index: number) => (
                <View key={index} style={styles.lowStockItem}>
                  <Text variant="bodyMedium">{product.name}</Text>
                  <Text variant="bodySmall" style={{ color: '#92400e' }}>
                    Only {product.stock} {product.unit} left
                  </Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {homeData?.pendingQuotes && homeData.pendingQuotes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Pending Quotes</Text>
              <Button mode="text" onPress={() => router.push('/quotes')}>View All</Button>
            </View>
            {homeData.pendingQuotes.map((quote: any, index: number) => (
              <Card key={index} style={[styles.quoteCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.quoteRow}>
                    <View>
                      <Text variant="titleSmall">{quote.productSnapshot?.name || quote.product?.name}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        From: {quote.buyer?.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.primary, marginTop: 4 }}>
                        Qty: {quote.quantityRequested} {quote.productSnapshot?.unit}
                      </Text>
                    </View>
                    <Button mode="contained" onPress={() => router.push('/quotes')}>
                      Respond
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {homeData?.recentOrders && homeData.recentOrders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>Recent Orders</Text>
              <Button mode="text" onPress={() => router.push('/orders')}>View All</Button>
            </View>
            {homeData.recentOrders.map((order: any, index: number) => (
              <Card key={index} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  <View style={styles.orderRow}>
                    <View style={styles.orderInfo}>
                      <Text variant="titleSmall">{order.reference}</Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {order.buyer?.name}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text variant="titleMedium" style={[styles.orderTotal, { color: theme.colors.primary }]}>
                        {order.total} ETB
                      </Text>
                      <Chip style={styles.statusChip} textStyle={{ fontSize: 11 }}>
                        {order.status}
                      </Chip>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcomeCard: { margin: 16, padding: 20, borderRadius: 12 },
  welcomeTitle: { fontWeight: "bold", marginBottom: 12 },
  userInfo: { flexDirection: "row", gap: 8 },
  roleChip: {},
  section: { padding: 16 },
  sectionTitle: { fontWeight: "bold", marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", minHeight: 110 },
  actionContent: { alignItems: "center", justifyContent: "center", padding: 12 },
  actionIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { textAlign: "center", marginTop: 4, fontWeight: '500' },
  welcomeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeTextContainer: { flex: 1, marginRight: 12 },
  horizontalScroll: { marginTop: 8 },
  productCard: { width: 150, marginRight: 12 },
  productImage: { height: 120 },
  productContent: { paddingTop: 8 },
  productName: { fontWeight: '600', marginBottom: 4 },
  productPrice: { fontWeight: 'bold', marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: '#6b7280' },
  supplierCard: { marginBottom: 12 },
  cardVerifiedBadge: { marginLeft: 8, backgroundColor: '#10b981', color: '#fff', height: 20, alignSelf: 'center' },
  supplierRow: { flexDirection: 'row', gap: 12 },
  supplierInfo: { flex: 1 },
  supplierNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  supplierName: { fontWeight: '600' },
  supplierStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {},
  orderCard: { marginBottom: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderInfo: { flex: 1 },
  orderRight: { alignItems: 'flex-end' },
  orderTotal: { fontWeight: 'bold', marginBottom: 4 },
  statusChip: { alignSelf: 'flex-end' },
  alertCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  alertTitle: { fontWeight: '600' },
  statsCard: { margin: 16, padding: 16, borderRadius: 12 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: { alignItems: 'center', flex: 1 },
   avatar: {
    marginBottom: 16,
  },
  statCard: { flex: 1, borderRadius: 12 },
  statCardContent: { alignItems: 'center', paddingVertical: 8 },
  statValue: { fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#6b7280', marginTop: 4, textAlign: 'center', fontSize: 11 },
  rejectedItem: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#fca5a5', flexDirection: 'column' },
  lowStockItem: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  quoteCard: { marginBottom: 12 },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewButton: { marginLeft: 'auto' },
  supplierDetails: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  supplierDetailText: { marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  detailLabel: { marginLeft: 6, color: '#6b7280' },
  detailValue: { marginLeft: 8 },
  verifiedBadge: { backgroundColor: '#10b981', color: '#fff', marginLeft: 8 },
  supplierHeaderRow: { flexDirection: 'row', alignItems: 'center' },
});
