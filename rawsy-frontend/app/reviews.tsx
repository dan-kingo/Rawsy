import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Appbar, List, Avatar, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect } from 'react';
import api from '../services/api';
import { router } from 'expo-router';

export default function SupplierReviewsScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'supplier') {
      fetchReviews();
      fetchRatingSummary();
    }
  }, [user]);

  const fetchReviews = async () => {
    if (!user?._id) return;
    try {
      setLoading(true);
      const res = await api.get(`/reviews/supplier/${user._id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      console.warn('Failed to fetch reviews', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingSummary = async () => {
  if (!user?._id) return;
  try {
    const res = await api.get(`/reviews/supplier/${user._id}/summary`);
    setReviewSummary({
      averageRating: res.data.averageRating,
      totalReviews: res.data.reviewCount, // <- map reviewCount here
    });
  } catch (err) {
    console.warn('Failed to fetch rating summary', err);
  }
};


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('reviews')} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchReviews} />
        }
      >
        {reviewSummary && (
          <Surface style={styles.summarySection} elevation={1}>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              {t('ratingSummary')}
            </Text>
            <Text>Average Rating: {reviewSummary.averageRating?.toFixed(1) || 'N/A'}</Text>
            <Text>Total Reviews: {reviewSummary.totalReviews || 0}</Text>
          </Surface>
        )}

        <Divider style={{ marginVertical: 16 }} />

        {loading ? (
          <ActivityIndicator animating size="large" />
        ) : reviews.length === 0 ? (
          <Text style={styles.noReviews}>{t('noReviewsYet')}</Text>
        ) : (
          reviews.map((review) => (
            <Surface key={review._id} style={styles.reviewItem} elevation={1}>
              <View style={styles.reviewHeader}>
                <Avatar.Text
                  size={40}
                  label={review.userName?.charAt(0).toUpperCase() || 'U'}
                  style={{ marginRight: 12 }}
                />
                <View>
                  <Text variant="titleSmall">{review.userName || 'User'}</Text>
                  <Text variant="bodySmall">Rating: {review.rating} ⭐</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{review.comment}</Text>
            </Surface>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16 },
  summarySection: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryTitle: { fontWeight: 'bold', marginBottom: 8 },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewText: { marginLeft: 52 }, // to align with avatar
  noReviews: { textAlign: 'center', marginTop: 32, fontSize: 16, color: '#666' },
});
