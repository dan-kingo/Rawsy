import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  Appbar,
  List,
  Avatar,
  Divider,
  Switch,
  Button,
  Surface,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useRouter } from 'expo-router';

export default function AccountScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header elevated>
        <Appbar.Content title={t('account')} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Surface style={styles.profileSection} elevation={1}>
          {user?.profileImage ? (
            <Avatar.Image
              size={80}
              source={{ uri: user.profileImage }}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text
              size={80}
              label={user?.companyName?.charAt(0).toUpperCase() || 'U'}
              style={styles.avatar}
            />
          )}
         

          <Text variant="headlineSmall" style={styles.userName}>
            {user?.companyName}
          </Text>
          <Text variant="bodyMedium" style={styles.userRole}>
           {(user?.role ?? '').charAt(0).toUpperCase() + (user?.role ?? '').slice(1)}
          </Text>

          {user?.status && (
            <Text
              variant="bodySmall"
              style={[
                styles.userStatus,
                {
                  color:
                    user.status === 'approved' || user.status === 'active'
                      ? '#10b981'
                      : user.status === 'pending'
                      ? '#f59e0b'
                      : '#dc2626',
                },
              ]}
            >
              Status: {user.status}
            </Text>
          )}
        </Surface>

        <List.Section>
          <List.Subheader>{t('accountInformation')}</List.Subheader>
          {user?.email && (
            <List.Item
              title={t('email')}
              description={user.email}
              left={(props) => <List.Icon {...props} icon="email" />}
            />
          )}
          {user?.phone && (
            <List.Item
              title={t('phone')}
              description={user.phone}
              left={(props) => <List.Icon {...props} icon="phone" />}
            />
          )}
          {user?.companyName && (
            <List.Item
              title={t('company')}
              description={user.companyName}
              left={(props) => <List.Icon {...props} icon="domain" />}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>{t('preferences')}</List.Subheader>
          <List.Item
            title={t('darkMode')}
            description={isDarkMode ? t('enabled') : t('disabled')}
            left={(props) => (
              <List.Icon {...props} icon={isDarkMode ? 'weather-night' : 'weather-sunny'} />
            )}
            right={() => <Switch value={isDarkMode} onValueChange={toggleTheme} />}
          />
          {user?.role === 'manufacturer' && (
            <List.Item
              title={t('language')}
              description={t('selectLanguage')}
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/language-settings')}
            />
          )}
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Actions</List.Subheader>
          <List.Item
  title="Notifications"
  description="View system alerts & updates"
  left={(props) => <List.Icon {...props} icon="bell" />}
  right={(props) => <List.Icon {...props} icon="chevron-right" />}
  onPress={() => router.push('/notifications')}
/>

          {user?.role === 'manufacturer' && (
            <>
              <List.Item
                title={t('orders')}
                description="View your order history"
                left={(props) => <List.Icon {...props} icon="package-variant" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push('/orders')}
              />
            </>
          )}
          {user?.role === 'supplier' && (
  <List.Item
    title="Reviews"
    description="View customer reviews"
    left={(props) => <List.Icon {...props} icon="star" />}
    right={(props) => <List.Icon {...props} icon="chevron-right" />}
    onPress={() => router.push('/reviews')}
  />
)}

          {user?.role === 'supplier' && (
            <List.Item
              title="Verification Documents"
              description="Upload business documents"
              left={(props) => <List.Icon {...props} icon="file-document" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push('/upload-verification')}
            />
          )}
          <List.Item
            title="Complete Profile"
            description="Update business information"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/complete-profile')}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>{t('support')}</List.Subheader>
          <List.Item
            title={t('helpSupport')}
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/help-support')}
          />
          <List.Item
            title={t('about')}
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/about')}
            />
          <List.Item
            title="Change Password" 
            left={(props) => <List.Icon {...props} icon="lock-reset" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/changePassword')}
          />
        </List.Section>

        <View style={styles.logoutSection}>
          <Button
            mode="contained"
            onPress={handleLogout}
            buttonColor={theme.colors.error}
            style={styles.logoutButton}
            icon="logout"
          >
            {t('logout')}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    margin: 16,
    borderRadius: 12,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    color: '#666',
    marginBottom: 8,
  },
  userStatus: {
    fontWeight: '600',
  },
  logoutSection: {
    padding: 16,
    marginTop: 8,
    marginBottom: 32,
  },
  logoutButton: {
    paddingVertical: 8,
  },
});
