import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Surface } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';

interface QuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  max?: number;
  min?: number;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  onQuantityChange,
  max = 100,
  min = 1,
  disabled = false,
}: QuantitySelectorProps) {
  const { theme } = useTheme();

  const handleDecrease = () => {
    if (quantity > min) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onQuantityChange(quantity + 1);
    }
  };

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]} elevation={0}>
      <IconButton
        icon="minus"
        size={20}
        onPress={handleDecrease}
        disabled={disabled || quantity <= min}
        iconColor={quantity <= min ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
      />
      <View style={styles.quantityContainer}>
        <Text variant="titleMedium" style={[styles.quantityText, { color: theme.colors.onSurface }]}>
          {quantity}
        </Text>
      </View>
      <IconButton
        icon="plus"
        size={20}
        onPress={handleIncrease}
        disabled={disabled || quantity >= max}
        iconColor={quantity >= max ? theme.colors.onSurfaceDisabled : theme.colors.onSurface}
      />
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  quantityContainer: {
    paddingHorizontal: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  quantityText: {
    fontWeight: '600',
  },
});
