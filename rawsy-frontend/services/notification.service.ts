import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Newer SDKs expect these fields as well
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  getExpoPushToken: async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: { allowAlert: true, allowBadge: true, allowSound: true, provideAppNotificationSettings: true },
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission not granted for notifications');
        return null;
      }

      // Get Expo push token (no placeholder projectId). If you use EAS push you can pass projectId here.
      const token = await Notifications.getExpoPushTokenAsync();
      console.log('Expo push token:', token);

      // Register device token with backend so server can send push notifications
      try {
        await api.post('/auth/save-device-token', { deviceToken: token.data });
        console.log('Registered device token with backend');
      } catch (err) {
        const e: any = err;
        console.warn('Failed to register device token with backend', e?.response?.data || e?.message || String(e));
      }

      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  scheduleLocalNotification: async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
  },
};
