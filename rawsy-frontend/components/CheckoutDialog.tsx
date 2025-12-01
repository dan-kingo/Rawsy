import { useEffect } from 'react';
import { useRouter } from 'expo-router';

interface CheckoutDialogProps {
  visible: boolean;
  onDismiss: () => void;
  cartItems?: any[];
  totalAmount?: number;
  onSuccess?: () => void;
}

export default function CheckoutDialog({ visible, onDismiss }: CheckoutDialogProps) {
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      router.push('/checkout');
      onDismiss();
    }
  }, [visible]);

  return null;
}

