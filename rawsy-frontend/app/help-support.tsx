import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TextInput as RNTextInput, 
  ActivityIndicator, 
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
  Divider 
} from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import api from '../services/api';

interface FAQ {
  _id?: string;
  question: string;
  answer: string;
  tags?: string[];
  visible?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const HelpSupportScreen: React.FC = () => {
  const { theme } = useTheme();
  const paperTheme = usePaperTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<string>('faq');
  const [search, setSearch] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Get all unique tags from FAQs
  const allTags = Array.from(new Set(faqs.flatMap(faq => faq.tags || []))).filter(Boolean);

  useEffect(() => {
    if (activeTab === 'faq') {
      fetchFAQs();
    } 
  }, [activeTab, selectedTag]);

  const fetchFAQs = async (): Promise<void> => {
    try {
      setLoading(true);
      const params: any = {};
      if (selectedTag) {
        params.tag = selectedTag;
      }
      
      const response = await api.get('/support/faq', { params });
      setFaqs(response.data.faqs || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchFAQs();
    setRefreshing(false);
  };

  const handleTagPress = (tag: string): void => {
    if (selectedTag === tag) {
      setSelectedTag(null); // Deselect if same tag is clicked
    } else {
      setSelectedTag(tag); // Select new tag
    }
  };

  const clearFilters = (): void => {
    setSelectedTag(null);
    setSearch('');
  };

  // Filter FAQs based on search and selected tag
  const filteredFAQs: FAQ[] = faqs.filter((faq: FAQ) => {
    const matchesSearch = search === '' || 
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    
    // Tag filtering is already handled by the backend when selectedTag is set
    return matchesSearch;
  });

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
            {/* Search Bar */}
            <Surface style={[styles.searchContainer, { backgroundColor: paperTheme.colors.surface }]}>
              <RNTextInput
                placeholder="Search FAQs..."
                placeholderTextColor={paperTheme.colors.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: paperTheme.colors.onSurface }]}
              />
            </Surface>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <Surface style={[styles.tagsContainer, { backgroundColor: paperTheme.colors.surface }]}>
                <Text variant="bodyMedium" style={[styles.tagsTitle, { color: paperTheme.colors.onSurface }]}>
                  Filter by Category:
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
                  <View style={styles.tagsRow}>
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
                    {(selectedTag || search) && (
                      <Chip
                        onPress={clearFilters}
                        mode="outlined"
                        style={styles.clearChip}
                        compact
                        icon="close"
                      >
                        Clear
                      </Chip>
                    )}
                  </View>
                </ScrollView>
              </Surface>
            )}

            {/* Active Filters Info */}
            {(selectedTag || search) && (
              <Surface style={[styles.filterInfo, { backgroundColor: paperTheme.colors.surface }]}>
                <Text variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>
                  Showing results for: 
                  {selectedTag && ` Category: "${selectedTag}"`}
                  {search && ` Search: "${search}"`}
                </Text>
              </Surface>
            )}

            {/* Loading State */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={paperTheme.colors.primary} />
                <Text style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 12 }}>
                  Loading FAQs...
                </Text>
              </View>
            )}

            {/* Error State */}
            {error && !loading && (
              <Surface style={[styles.errorContainer, { backgroundColor: paperTheme.colors.errorContainer }]}>
                <MaterialIcons 
                  name="error-outline" 
                  size={24} 
                  color={paperTheme.colors.error} 
                  style={styles.errorIcon}
                />
                <Text style={{ color: paperTheme.colors.error, textAlign: 'center' }}>
                  {error}
                </Text>
              </Surface>
            )}

            {/* FAQ List */}
            {!loading && !error && (
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
                        marginTop: 12
                      }}
                    >
                      No FAQs found. Try adjusting your search or filters.
                    </Text>
                    {(selectedTag || search) && (
                      <Chip
                        onPress={clearFilters}
                        mode="outlined"
                        style={styles.clearButton}
                        compact
                      >
                        Clear All Filters
                      </Chip>
                    )}
                  </View>
                ) : (
                  filteredFAQs.map((faq: FAQ, index: number) => (
                    <View key={faq._id || index}>
                      <List.Accordion
                        title={faq.question}
                        titleStyle={{ color: paperTheme.colors.onSurface }}
                        titleNumberOfLines={3}
                        style={{ backgroundColor: paperTheme.colors.surface }}
                      >
                        <List.Item
                          title={faq.answer}
                          titleNumberOfLines={0}
                          titleStyle={{ 
                            color: paperTheme.colors.onSurfaceVariant,
                            lineHeight: 20
                          }}
                          descriptionStyle={{ lineHeight: 20 }}
                        />
                        {faq.tags && faq.tags.length > 0 && (
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
                        )}
                      </List.Accordion>
                      {index < filteredFAQs.length - 1 && (
                        <Divider style={styles.faqDivider} />
                      )}
                    </View>
                  ))
                )}
              </Surface>
            )}
          </>
        ) : (
          /* Contact Tab */
          <Surface style={[styles.contactContainer, { backgroundColor: paperTheme.colors.surface }]}>
            <View style={styles.contactHeader}>
              <MaterialIcons 
                name="contact-support" 
                size={32} 
                color={paperTheme.colors.primary} 
              />
              <Text variant="titleLarge" style={styles.contactTitle}>
                Need Further Assistance?
              </Text>
            </View>
            
            <Text variant="bodyMedium" style={[styles.contactText, { color: paperTheme.colors.onSurfaceVariant }]}>
              If you have other questions or need additional support that is not covered in our FAQs, please contact our administration team directly.
            </Text>
            
            <View style={styles.contactInfo}>
              <View style={styles.contactMethod}>
                <MaterialIcons 
                  name="email" 
                  size={20} 
                  color={paperTheme.colors.primary} 
                />
                <Text variant="bodyLarge" style={styles.contactDetail}>
                  admin@gmail.com
                </Text>
              </View>
            </View>

            <Divider style={styles.contactDivider} />

            <Text variant="bodySmall" style={[styles.contactNote, { color: paperTheme.colors.onSurfaceVariant }]}>
              Please include detailed information about your inquiry to help us assist you better.
            </Text>
          </Surface>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 16,
    height: 40,
  },
  tagsContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  tagsTitle: {
    marginBottom: 12,
    fontWeight: '500',
  },
  tagsScroll: {
    flexGrow: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagChip: {
    height: 32,
  },
  clearChip: {
    height: 32,
    marginLeft: 4,
  },
  clearButton: {
    marginTop: 16,
  },
  filterInfo: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  faqContainer: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  faqDivider: {
    marginHorizontal: 16,
  },
  faqTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqTagChip: {
    height: 24,
  },
  faqTagText: {
    fontSize: 12,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  errorContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorIcon: {
    marginBottom: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactContainer: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contactTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  contactText: {
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  contactInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactDetail: {
    fontWeight: '500',
  },
  contactDivider: {
    marginVertical: 16,
  },
  contactNote: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HelpSupportScreen;