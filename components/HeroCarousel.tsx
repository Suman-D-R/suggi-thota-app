import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { heroBannerAPI } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - 32; // Account for padding
const ITEM_MARGIN = 16;
const SNAP_INTERVAL = CAROUSEL_WIDTH + ITEM_MARGIN; // Item width + right margin

interface CarouselItem {
  _id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  icon?: string;
  image?: string;
}

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);
  const autoScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isUserScrolling = useRef(false);
  const activeIndexRef = useRef(0);

  // Fetch hero banners from API
  useEffect(() => {
    const fetchHeroBanners = async () => {
      try {
        setLoading(true);
        const response = await heroBannerAPI.getActive();
        if (response.success && response.data?.banners) {
          setCarouselItems(response.data.banners);
        } else {
          // Fallback to empty array if API fails
          setCarouselItems([]);
        }
      } catch (error) {
        console.error('Error fetching hero banners:', error);
        setCarouselItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroBanners();
  }, []);

  // Create infinite loop: [last] [item1] [item2] [item3] [first]
  const extendedItems =
    carouselItems.length > 0
      ? [
          carouselItems[carouselItems.length - 1], // Duplicate of last item at start
          ...carouselItems,
          carouselItems[0], // Duplicate of first item at end
        ]
      : [];

  // Initialize scroll position to first real item (index 1)
  useEffect(() => {
    if (carouselItems.length > 0) {
      scrollViewRef.current?.scrollTo({
        x: SNAP_INTERVAL,
        animated: false,
      });
    }
  }, [carouselItems]);

  // Keep ref in sync with state
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Auto-scroll functionality
  const scrollToNext = useCallback(() => {
    if (isUserScrolling.current || isScrolling.current) return;

    const currentExtendedIndex = activeIndexRef.current + 1;
    const nextExtendedIndex = currentExtendedIndex + 1;
    const isWrapping = nextExtendedIndex === carouselItems.length + 1;

    // Manually update activeIndex to ensure state advances
    const nextRealIndex = isWrapping ? 0 : activeIndexRef.current + 1;
    setActiveIndex(nextRealIndex);

    isScrolling.current = true;
    scrollViewRef.current?.scrollTo({
      x: SNAP_INTERVAL * nextExtendedIndex,
      animated: true,
    });

    if (isWrapping) {
      // Wait for animation to finish, then snap back to the real first item
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: SNAP_INTERVAL, // Real first item position (index 1)
          animated: false,
        });
        isScrolling.current = false;
      }, 500);
    } else {
      // Reset scrolling flag after animation
      setTimeout(() => {
        isScrolling.current = false;
      }, 500);
    }
  }, [carouselItems.length]);

  // Set up auto-scroll interval
  useEffect(() => {
    const startAutoScroll = () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
      autoScrollIntervalRef.current = setInterval(() => {
        scrollToNext();
      }, 3000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [scrollToNext]);

  const handleScroll = (event: any) => {
    if (isScrolling.current) return;

    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SNAP_INTERVAL);

    // Map extended index to real index
    let realIndex = index;
    if (index === 0) {
      // At duplicate of last item, show last item
      realIndex = carouselItems.length - 1;
    } else if (index === extendedItems.length - 1) {
      // At duplicate of first item, show first item
      realIndex = 0;
    } else {
      // Real item (subtract 1 because of duplicate at start)
      realIndex = index - 1;
    }

    setActiveIndex(realIndex);
  };

  const handleScrollBeginDrag = () => {
    isUserScrolling.current = true;
    // Pause auto-scroll
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SNAP_INTERVAL);

    isScrolling.current = true;

    // If at duplicate of last item (index 0), jump to real last item
    if (index === 0) {
      scrollViewRef.current?.scrollTo({
        x: SNAP_INTERVAL * carouselItems.length,
        animated: false,
      });
    }
    // If at duplicate of first item (last index), jump to real first item
    else if (index === extendedItems.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: SNAP_INTERVAL,
        animated: false,
      });
    }

    setTimeout(() => {
      isScrolling.current = false;
      isUserScrolling.current = false;
      // Resume auto-scroll after a short delay
      if (!autoScrollIntervalRef.current) {
        autoScrollIntervalRef.current = setInterval(() => {
          scrollToNext();
        }, 3000);
      }
    }, 50);
  };

  // Show loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size='large' color='#4CAF50' />
      </View>
    );
  }

  // Show nothing if no items
  if (carouselItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment='start'
        decelerationRate='fast'
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {extendedItems.map((item, index) => (
          <View
            key={`${item._id}-${index}`}
            style={[
              styles.carouselItem,
              // Only apply background color and padding if there's no image
              !item.image && { backgroundColor: item.backgroundColor },
              item.image && styles.carouselItemImageOnly,
            ]}
          >
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.carouselImage}
                resizeMode='cover'
              />
            ) : (
              <View style={styles.carouselItemContent}>
                {item.icon && (
                  <Ionicons
                    name={item.icon as any}
                    size={48}
                    color='#fff'
                    style={styles.icon}
                  />
                )}
                <View style={styles.textOverlay}>
                  <Text style={styles.carouselTitle}>{item.title}</Text>
                  <Text style={styles.carouselSubtitle}>{item.subtitle}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.pagination}>
        {carouselItems.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              activeIndex === index && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  carousel: {
    paddingHorizontal: 16,
  },
  carouselContent: {
    paddingRight: 16, // Add padding at the end for the last item
  },
  carouselItem: {
    width: CAROUSEL_WIDTH,
    height: 160,
    borderRadius: 18,
    marginRight: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  carouselItemImageOnly: {
    padding: 0,
  },
  carouselItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  icon: {
    marginBottom: 12,
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  textOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  carouselSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
  },
  paginationDotActive: {
    backgroundColor: '#4CAF50',
    width: 24,
  },
});
