import { useState } from 'react';
import { View, StyleSheet, Alert, TextInput } from 'react-native';
import { Text, Button } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import api from '../services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function ReviewForm() {
  const router = useRouter();
const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert('Invalid Rating', 'Rating must be between 1 and 5');
      return;
    }

    try {
      setLoading(true);

      await api.post(`/reviews/${orderId}`, {
        rating,
        comment,
      });

      Alert.alert('Success', 'Review submitted successfully');
      router.back();
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.response?.data?.error || 'Failed to submit review'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Rate this supplier</Text>

      <View style={styles.ratingRow}>
        <Slider
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={rating}
          onValueChange={setRating}
          style={{ flex: 1 }}
        />
        <Text style={{ marginLeft: 8 }}>{rating} ⭐</Text>
      </View>

      <Text variant="titleSmall" style={{ marginTop: 12 }}>
        Comment (optional)
      </Text>
      <TextInput
        style={styles.textarea}
        value={comment}
        onChangeText={setComment}
        placeholder="Write a comment..."
        multiline
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        Submit Review
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  textarea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    textAlignVertical: 'top', // ensures multiline text aligns at top
  },
});
