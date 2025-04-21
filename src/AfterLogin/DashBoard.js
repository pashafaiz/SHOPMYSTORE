
// import React, { useEffect, useRef, useState } from 'react';
// import {
//   FlatList,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   Keyboard,
//   Image,
//   Dimensions,
//   ScrollView,
//   RefreshControl,
// } from 'react-native';
// import Header from '../Components/Header';
// import { categoryData, sliderData } from '../constants/Dummy_Data';
// import img from '../assets/Images/img';
// import Colors from '../constants/Colors';
// import Filterbar from '../Components/Filterbar';
// import Strings from '../constants/Strings';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import ProductModal from '../Products/ProductModal';
// import Loader from '../Components/Loader';
// import { createProductApi, deleteProductApi, getAllProductsApi, updateProductApi } from '../../apiClient';
// import Toast from 'react-native-toast-message';

// const { width, height } = Dimensions.get('window');
// const numColumns = 4;
// const itemSize = width / numColumns;

// const log = (message, data = {}) => {
//   console.log(JSON.stringify({ timestamp: new Date().toISOString(), message, ...data }, null, 2));
// };

// const DashBoard = ({ navigation }) => {
//   const [search, setSearch] = useState('');
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [suggestions, setSuggestions] = useState([]);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const flatListRef = useRef(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [activeFilter, setActiveFilter] = useState(null);
//   const [token, setToken] = useState('');
//   const [userId, setUserId] = useState('');
//   const [modalVisible, setModalVisible] = useState(false);
//   const [currentProduct, setCurrentProduct] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);

//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [selectedPostcode, setSelectedPostcode] = useState('');
//   const [selectedGender, setSelectedGender] = useState('');

//   useEffect(() => {
//     const loadUserData = async () => {
//       try {
//         log('Loading User Data');
//         const storedUser = await AsyncStorage.getItem('user');
//         const userToken = await AsyncStorage.getItem('userToken');
//         if (storedUser && userToken) {
//           const parsedUser = JSON.parse(storedUser);
//           log('User Data Loaded', { userId: parsedUser.id });
//           setUserId(parsedUser.id || '');
//           setToken(userToken);
//         } else {
//           log('No User Data or Token Found');
//         }
//       } catch (err) {
//         log('Load User Data Error', { error: err.message });
//         Toast.show({ type: 'error', text1: 'Failed to load user data' });
//       }
//     };

//     loadUserData();
//     fetchProducts();
//   }, []);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       const nextIndex = (currentIndex + 1) % sliderData.length;
//       flatListRef.current?.scrollToIndex({
//         index: nextIndex,
//         animated: true,
//       });
//       setCurrentIndex(nextIndex);
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [currentIndex]);

//   const fetchProducts = async () => {
//     try {
//       log('Fetching Products');
//       setLoading(true);
//       const { ok, data } = await getAllProductsApi();
//       log('Products Response', { ok, data });
//       setLoading(false);
//       if (ok && data.products) {
//         setProducts(data.products);
//         setFilteredProducts(data.products);
//       } else {
//         Toast.show({ type: 'error', text1: data.msg || 'Failed to fetch products' });
//       }
//     } catch (err) {
//       log('Fetch Products Error', { error: err.message });
//       setLoading(false);
//       Toast.show({ type: 'error', text1: 'Something went wrong' });
//     }
//   };

//   const onRefresh = async () => {
//     log('Refreshing Products');
//     setRefreshing(true);
//     await fetchProducts();
//     setRefreshing(false);
//   };

//   const handleSearch = (text) => {
//     try {
//       log('Searching Products', { search: text });
//       setSearch(text);
//       setIsExpanded(false);
//       const results = products.filter((item) =>
//         item.name?.toLowerCase().includes(text.toLowerCase())
//       );
//       setFilteredProducts(results);

//       if (text.length > 0) {
//         setSuggestions(results);
//       } else {
//         setSuggestions([]);
//       }
//     } catch (err) {
//       log('Search Error', { error: err.message });
//       Toast.show({ type: 'error', text1: 'Failed to search products' });
//     }
//   };

//   const handleToggle = (filterName) => {
//     log('Toggling Filter', { filterName });
//     setActiveFilter((prev) => (prev === filterName ? null : filterName));
//   };

//   const handleSuggestionSelect = (value) => {
//     try {
//       log('Suggestion Selected', { value });
//       setSearch(value);
//       setSuggestions([]);
//       const results = products.filter((item) =>
//         item.name?.toLowerCase().includes(value.toLowerCase())
//       );
//       setFilteredProducts(results);
//       Keyboard.dismiss();
//     } catch (err) {
//       log('Suggestion Select Error', { error: err.message });
//       Toast.show({ type: 'error', text1: 'Failed to select suggestion' });
//     }
//   };

//   const handleAddProduct = () => {
//     log('Add Product Clicked');
//     setCurrentProduct(null);
//     setModalVisible(true);
//   };

//   const handleEditProduct = (product) => {
//     try {
//       log('Editing Product', { product });
//       setCurrentProduct(product);
//       setModalVisible(true);
//     } catch (err) {
//       log('Edit Product Error', { error: err.message });
//       Toast.show({ type: 'error', text1: 'Failed to open edit modal' });
//     }
//   };

//   const handleDeleteProduct = async (productId) => {
//     try {
//       log('Deleting Product', { productId });
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         log('No Token Found');
//         Toast.show({ type: 'error', text1: 'No token found' });
//         return;
//       }

//       const { ok, data } = await deleteProductApi(token, productId);
//       log('Delete Product Response', { ok, data });
//       if (ok) {
//         fetchProducts();
//         Toast.show({ type: 'success', text1: 'Product deleted successfully' });
//       } else {
//         Toast.show({ type: 'error', text1: data.msg || 'Failed to delete product' });
//       }
//     } catch (err) {
//       log('Delete Product Error', { error: err.message });
//       Toast.show({ type: 'error', text1: 'Something went wrong' });
//     }
//   };

//   const handleSubmitProduct = async (productData) => {
//     try {
//       log('Submitting Product', { productData, currentProduct });
//       setLoading(true);
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         log('No Token Found');
//         setLoading(false);
//         Toast.show({ type: 'error', text1: 'No token found' });
//         return;
//       }

//       const productPayload = { ...productData, createdBy: userId };
//       const { ok, data } = currentProduct
//         ? await updateProductApi(token, currentProduct.id, productPayload)
//         : await createProductApi(token, productPayload);
//       log('Product Submit Response', { ok, data });
//       setLoading(false);

//       if (ok) {
//         fetchProducts();
//         Toast.show({
//           type: 'success',
//           text1: currentProduct ? 'Product updated successfully' : 'Product created successfully',
//         });
//         setModalVisible(false);
//       } else {
//         Toast.show({ type: 'error', text1: data.msg || 'Failed to manage product' });
//       }
//     } catch (err) {
//       log('Submit Product Error', { error: err.message });
//       setLoading(false);
//       Toast.show({ type: 'error', text1: 'Something went wrong' });
//     }
//   };

//   const RenderProductList = ({ item }) => (
//     <TouchableOpacity
//       style={styles.itemBox}
//       activeOpacity={0.7}
//       onPress={() => {
//         log('Product Clicked', { productId: item.id });
//         navigation.navigate('ProductDetail', { productId: item.id });
//       }}
     
//     >
//       <View style={styles.product_Img}>
//         <Image
//           source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/120' }}
//           style={styles.productImage}
//           resizeMode="contain"
//           onError={(error) => log('Product Image Error', { error: error.nativeEvent })}
//         />
//       </View>
//       <Text style={styles.itemText}>{item.name}</Text>
//       <Text style={styles.priceText}>₹{item.price}</Text>
//     </TouchableOpacity>
//   );

//   const RenderSliderList = ({ item }) => (
//     <View style={styles.slide}>
//       <Image source={item.image} style={styles.image} />
//       <View style={styles.overlay}>
//         <Text style={styles.Slider_text}>{item.title}</Text>
//       </View>
//     </View>
//   );

//   const RenderCategoryList = ({ item }) => (
//     <TouchableOpacity style={styles.itemContainer}>
//       <View style={styles.imageWrapper}>
//         <Image source={item.image} style={styles.image} />
//       </View>
//       <Text style={styles.label} numberOfLines={1}>
//         {item.name}
//       </Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={{ flex: 1 }}>
//       <ScrollView
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//         }
//       >
//         <Header
//           isSearch={true}
//           searchValue={search}
//           onSearchChange={handleSearch}
//           showLeftIcon={true}
//           leftIcon={img.drawer}
//           showRightIcon1={true}
//           rightIcon1={img.notification1}
//           showRightIcon2={true}
//           rightIcon2={img.add}
//           onRightIcon2Press={handleAddProduct}
//         />

//         {suggestions.length > 0 && (
//           <View style={styles.suggestionsContainer}>
//             <ScrollView
//               style={styles.suggestionScroll}
//               nestedScrollEnabled={true}
//               onScroll={({ nativeEvent }) => {
//                 if (!isExpanded && nativeEvent.contentOffset.y > 0) {
//                   setIsExpanded(true);
//                 }
//               }}
//               scrollEventThrottle={16}
//             >
//               {(isExpanded ? suggestions : suggestions.slice(0, 5)).map((item) => (
//                 <TouchableOpacity
//                   key={item.id?.toString() || Math.random().toString()}
//                   onPress={() => handleSuggestionSelect(item.name)}
//                   style={styles.suggestionItem}
//                 >
//                   <Text style={styles.suggestionText}>{item.name}</Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>

//             {!isExpanded && suggestions.length > 5 && (
//               <Text style={styles.loadMoreText}>⬇ Scroll to load more...</Text>
//             )}
//           </View>
//         )}

//         <View style={{ flexDirection: 'row', margin: 10 }}>
//           <Filterbar
//             title="Shop by Categories"
//             isVisible={activeFilter === 'category'}
//             onToggle={() => handleToggle('category')}
//             options={['Electronics', 'Clothing', 'Books']}
//             selectedOption={selectedCategory}
//             onOptionSelect={(value) => setSelectedCategory(value)}
//           />
//           <Filterbar
//             title="Postcode"
//             isVisible={activeFilter === 'postcode'}
//             onToggle={() => handleToggle('postcode')}
//             options={['12345', '67890', '101112']}
//             selectedOption={selectedPostcode}
//             onOptionSelect={(value) => setSelectedPostcode(value)}
//           />
//           <Filterbar
//             title="Gender"
//             isVisible={activeFilter === 'gender'}
//             onToggle={() => handleToggle('gender')}
//             options={['Male', 'Female', 'Unisex']}
//             selectedOption={selectedGender}
//             onOptionSelect={(value) => setSelectedGender(value)}
//           />
//         </View>

//         <View
//           style={{
//             height: height * 0.2,
//             backgroundColor: Colors.lightPurple,
//             width: width * 0.9,
//             alignSelf: 'center',
//             borderRadius: 20,
//           }}
//         >
//           <FlatList
//             ref={flatListRef}
//             data={sliderData}
//             horizontal
//             pagingEnabled
//             showsHorizontalScrollIndicator={false}
//             keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//             renderItem={({ item }) => <RenderSliderList item={item} />}
//             onScrollToIndexFailed={() => log('Slider Scroll Failed')}
//           />
//         </View>

//         <Text style={styles.category}>{Strings.filterCatagory}</Text>

//         <FlatList
//           data={categoryData}
//           keyExtractor={(item, index) => `category-${index}`}
//           renderItem={({ item }) => <RenderCategoryList item={item} />}
//           numColumns={numColumns}
//           contentContainerStyle={styles.flatListContainer}
//           showsVerticalScrollIndicator={false}
//         />

//         <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
//           <Text style={styles.category}>{Strings.featureProduct}</Text>
//           <TouchableOpacity>
//             <Text style={[styles.category, { color: Colors.pink }]}>{'View All'}</Text>
//           </TouchableOpacity>
//         </View>

//         <FlatList
//           data={filteredProducts}
//           numColumns={2}
//           keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
//           contentContainerStyle={styles.listContainer}
//           renderItem={({ item }) => <RenderProductList item={item} />}
//           showsVerticalScrollIndicator={false}
//         />
//       </ScrollView>

//       <ProductModal
//         visible={modalVisible}
//         onClose={() => setModalVisible(false)}
//         onSubmit={handleSubmitProduct}
//         product={currentProduct}
//       />

//       <Loader visible={loading} />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   listContainer: {
//     paddingBottom: 20,
//     alignItems: 'center',
//   },
//   itemBox: {
//     width: width * 0.45,
//     backgroundColor: Colors.lightPurple,
//     borderRadius: 10,
//     margin: 6,
//     alignItems: 'center',
//     padding: 10,
//   },
//   product_Img: {
//     width: width * 0.4,
//     height: height * 0.22,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: Colors.White,
//     borderRadius: 8,
//   },
//   productImage: {
//     width: '100%',
//     height: '100%',
//   },
//   itemText: {
//     fontSize: 16,
//     marginTop: 10,
//     textAlign: 'center',
//   },
//   priceText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: Colors.White,
//     marginTop: 5,
//   },
//   suggestionsContainer: {
//     backgroundColor: Colors.White,
//     paddingHorizontal: 20,
//     paddingBottom: 10,
//   },
//   suggestionScroll: {
//     maxHeight: 220,
//   },
//   suggestionItem: {
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderColor: Colors.pink,
//     borderRadius: 15,
//     borderLeftWidth: 1,
//     paddingHorizontal: 15,
//     marginVertical: 12,
//   },
//   suggestionText: {
//     fontSize: 16,
//     color: Colors.lightGray1,
//   },
//   loadMoreText: {
//     fontSize: 14,
//     color: Colors.lightGray1,
//     textAlign: 'center',
//     marginTop: 8,
//   },
//   slide: {
//     width: width * 0.9,
//     position: 'relative',
//     justifyContent: 'center',
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 10,
//     resizeMode: 'contain',
//   },
//   overlay: {
//     position: 'absolute',
//     padding: 50,
//   },
//   Slider_text: {
//     fontSize: 20,
//     color: Colors.Black,
//     fontWeight: 'bold',
//     padding: 10,
//     borderRadius: 10,
//     lineHeight: 23,
//   },
//   category: {
//     paddingHorizontal: 20,
//     padding: 15,
//   },
//   flatListContainer: {
//     paddingVertical: 10,
//     alignSelf: 'center',
//   },
//   itemContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 10,
//     width: itemSize,
//   },
//   imageWrapper: {
//     resizeMode: 'contain',
//     width: 65,
//     height: 65,
//     borderRadius: 35,
//     overflow: 'hidden',
//   },
//   label: {
//     marginTop: 5,
//     fontSize: 12,
//     color: Colors.Black,
//     textAlign: 'center',
//   },
// });

// export default DashBoard;





import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Keyboard,
  Image,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Header from '../Components/Header';
import { categoryData, sliderData } from '../constants/Dummy_Data';
import img from '../assets/Images/img';
import Colors from '../constants/Colors';
import Filterbar from '../Components/Filterbar';
import Strings from '../constants/Strings';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ProductModal from '../Products/ProductModal';
import Loader from '../Components/Loader';
import { createProductApi, deleteProductApi, getAllProductsApi, updateProductApi } from '../../apiClient';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Add this for the arrow icon

const { width, height } = Dimensions.get('window');
const numColumns = 4;
const itemSize = width / numColumns;

const log = (message, data = {}) => {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), message, ...data }, null, 2));
};

const DashBoard = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPostcode, setSelectedPostcode] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        log('Loading User Data');
        const storedUser = await AsyncStorage.getItem('user');
        const userToken = await AsyncStorage.getItem('userToken');
        if (storedUser && userToken) {
          const parsedUser = JSON.parse(storedUser);
          log('User Data Loaded', { userId: parsedUser.id });
          setUserId(parsedUser.id || '');
          setToken(userToken);
        } else {
          log('No User Data or Token Found');
        }
      } catch (err) {
        log('Load User Data Error', { error: err.message });
        Toast.show({ type: 'error', text1: 'Failed to load user data' });
      }
    };

    loadUserData();
    fetchProducts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % sliderData.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }, 2000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const fetchProducts = async () => {
    try {
      log('Fetching Products');
      setLoading(true);
      const { ok, data } = await getAllProductsApi();
      log('Products Response', { ok, data });
      setLoading(false);
      if (ok && data.products) {
        setProducts(data.products);
        setFilteredProducts(data.products.slice(0, 4)); // Show only first 4 products initially
      } else {
        Toast.show({ type: 'error', text1: data.msg || 'Failed to fetch products' });
      }
    } catch (err) {
      log('Fetch Products Error', { error: err.message });
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    }
  };

  const onRefresh = async () => {
    log('Refreshing Products');
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  };

  const handleSearch = (text) => {
    try {
      log('Searching Products', { search: text });
      setSearch(text);
      setIsExpanded(false);
      const results = products.filter((item) =>
        item.name?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredProducts(results.slice(0, 4)); // Limit search results to 4
      setSuggestions(results);
    } catch (err) {
      log('Search Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Failed to search products' });
    }
  };

  const handleToggle = (filterName) => {
    log('Toggling Filter', { filterName });
    setActiveFilter((prev) => (prev === filterName ? null : filterName));
  };

  const handleSuggestionSelect = (value) => {
    try {
      log('Suggestion Selected', { value });
      setSearch(value);
      setSuggestions([]);
      const results = products.filter((item) =>
        item.name?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredProducts(results.slice(0, 4)); // Limit to 4
      Keyboard.dismiss();
    } catch (err) {
      log('Suggestion Select Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Failed to select suggestion' });
    }
  };

  const handleAddProduct = () => {
    log('Add Product Clicked');
    setCurrentProduct(null);
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    try {
      log('Editing Product', { product });
      setCurrentProduct(product);
      setModalVisible(true);
    } catch (err) {
      log('Edit Product Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Failed to open edit modal' });
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      log('Deleting Product', { productId });
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        Toast.show({ type: 'error', text1: 'No token found' });
        return;
      }

      const { ok, data } = await deleteProductApi(token, productId);
      log('Delete Product Response', { ok, data });
      if (ok) {
        fetchProducts();
        Toast.show({ type: 'success', text1: 'Product deleted successfully' });
      } else {
        Toast.show({ type: 'error', text1: data.msg || 'Failed to delete product' });
      }
    } catch (err) {
      log('Delete Product Error', { error: err.message });
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    }
  };

  const handleSubmitProduct = async (productData) => {
    try {
      log('Submitting Product', { productData, currentProduct });
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        log('No Token Found');
        setLoading(false);
        Toast.show({ type: 'error', text1: 'No token found' });
        return;
      }

      const productPayload = { ...productData, createdBy: userId };
      const { ok, data } = currentProduct
        ? await updateProductApi(token, currentProduct.id, productPayload)
        : await createProductApi(token, productPayload);
      log('Product Submit Response', { ok, data });
      setLoading(false);

      if (ok) {
        fetchProducts();
        Toast.show({
          type: 'success',
          text1: currentProduct ? 'Product updated successfully' : 'Product created successfully',
        });
        setModalVisible(false);
      } else {
        Toast.show({ type: 'error', text1: data.msg || 'Failed to manage product' });
      }
    } catch (err) {
      log('Submit Product Error', { error: err.message });
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Something went wrong' });
    }
  };

  const RenderProductList = ({ item }) => (
    <TouchableOpacity
      style={styles.itemBox}
      activeOpacity={0.7}
      onPress={() => {
        log('Product Clicked', { productId: item.id });
        navigation.navigate('ProductDetail', { productId: item.id });
      }}
    >
      <View style={styles.product_Img}>
        <Image
          source={{ uri: item.media[0]?.url || 'https://via.placeholder.com/120' }}
          style={styles.productImage}
          resizeMode="contain"
          onError={(error) => log('Product Image Error', { error: error.nativeEvent })}
        />
      </View>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.priceText}>₹{item.price}</Text>
    </TouchableOpacity>
  );

  const RenderSliderList = ({ item }) => (
    <View style={styles.slide}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.Slider_text}>{item.title}</Text>
      </View>
    </View>
  );

  const RenderCategoryList = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <View style={styles.imageWrapper}>
        <Image source={item.image} style={styles.image} />
      </View>
      <Text style={styles.label} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const handleViewAll = () => {
    log('View All Clicked');
    navigation.navigate('All_Product', { products }); // Navigate to AllProducts screen
  };

  const extraItemsCount = products.length - 4;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          isSearch={true}
          searchValue={search}
          onSearchChange={handleSearch}
          showLeftIcon={true}
          leftIcon={img.drawer}
          showRightIcon1={true}
          rightIcon1={img.notification1}
          showRightIcon2={true}
          rightIcon2={img.add}
          onRightIcon2Press={handleAddProduct}
        />

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              style={styles.suggestionScroll}
              nestedScrollEnabled={true}
              onScroll={({ nativeEvent }) => {
                if (!isExpanded && nativeEvent.contentOffset.y > 0) {
                  setIsExpanded(true);
                }
              }}
              scrollEventThrottle={16}
            >
              {(isExpanded ? suggestions : suggestions.slice(0, 5)).map((item) => (
                <TouchableOpacity
                  key={item.id?.toString() || Math.random().toString()}
                  onPress={() => handleSuggestionSelect(item.name)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!isExpanded && suggestions.length > 5 && (
              <Text style={styles.loadMoreText}>⬇ Scroll to load more...</Text>
            )}
          </View>
        )}

        <View style={{ flexDirection: 'row', margin: 10 }}>
          <Filterbar
            title="Shop by Categories"
            isVisible={activeFilter === 'category'}
            onToggle={() => handleToggle('category')}
            options={['Electronics', 'Clothing', 'Books']}
            selectedOption={selectedCategory}
            onOptionSelect={(value) => setSelectedCategory(value)}
          />
          <Filterbar
            title="Postcode"
            isVisible={activeFilter === 'postcode'}
            onToggle={() => handleToggle('postcode')}
            options={['12345', '67890', '101112']}
            selectedOption={selectedPostcode}
            onOptionSelect={(value) => setSelectedPostcode(value)}
          />
          <Filterbar
            title="Gender"
            isVisible={activeFilter === 'gender'}
            onToggle={() => handleToggle('gender')}
            options={['Male', 'Female', 'Unisex']}
            selectedOption={selectedGender}
            onOptionSelect={(value) => setSelectedGender(value)}
          />
        </View>

        <View
          style={{
            height: height * 0.2,
            backgroundColor: Colors.lightPurple,
            width: width * 0.9,
            alignSelf: 'center',
            borderRadius: 20,
          }}
        >
          <FlatList
            ref={flatListRef}
            data={sliderData}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            renderItem={({ item }) => <RenderSliderList item={item} />}
            onScrollToIndexFailed={() => log('Slider Scroll Failed')}
          />
        </View>

        <Text style={styles.category}>{Strings.filterCatagory}</Text>

        <FlatList
          data={categoryData}
          keyExtractor={(item, index) => `category-${index}`}
          renderItem={({ item }) => <RenderCategoryList item={item} />}
          numColumns={numColumns}
          contentContainerStyle={styles.flatListContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15,alignItems:"center" }}>
          <Text style={styles.category}>{Strings.featureProduct}</Text>
          <TouchableOpacity onPress={handleViewAll}>
            <View style={styles.viewAllContainer}>
              <Text style={styles.viewAllText}>{'View All'}</Text>
              <Icon name="arrow-forward-ios" size={16} color={Colors.pink} />
            </View>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => <RenderProductList item={item} />}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            extraItemsCount > 0 ? (
              <Text style={styles.moreIndicator}>More +{extraItemsCount} items...</Text>
            ) : null
          }
         
        />
      </ScrollView>

      <ProductModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitProduct}
        product={currentProduct}
      />

      <Loader visible={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
    alignItems: 'center',
    overflow:"hidden"
  },
  itemBox: {
    width: width * 0.45,
    backgroundColor: Colors.lightPurple,
    borderRadius: 10,
    margin: 6,
    alignItems: 'center',
    padding: 10,
  },
  product_Img: {
    width: width * 0.4,
    height: height * 0.22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.White,
    borderRadius: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemText: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.White,
    marginTop: 5,
  },
  suggestionsContainer: {
    backgroundColor: Colors.White,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  suggestionScroll: {
    maxHeight: 220,
  },
  suggestionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: Colors.pink,
    borderRadius: 15,
    borderLeftWidth: 1,
    paddingHorizontal: 15,
    marginVertical: 12,
  },
  suggestionText: {
    fontSize: 16,
    color: Colors.lightGray1,
  },
  loadMoreText: {
    fontSize: 14,
    color: Colors.lightGray1,
    textAlign: 'center',
    marginTop: 8,
  },
  slide: {
    width: width * 0.9,
    position: 'relative',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  overlay: {
    position: 'absolute',
    padding: 50,
  },
  Slider_text: {
    fontSize: 20,
    color: Colors.Black,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
    lineHeight: 23,
  },
  category: {
    paddingHorizontal: 20,
    padding: 15,
  },
  flatListContainer: {
    paddingVertical: 10,
    alignSelf: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: itemSize,
  },
  imageWrapper: {
    resizeMode: 'contain',
    width: 65,
    height: 65,
    borderRadius: 35,
    overflow: 'hidden',
  },
  label: {
    marginTop: 5,
    fontSize: 12,
    color: Colors.Black,
    textAlign: 'center',
  },
  moreIndicator: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginTop: 5,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: Colors.pink,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    marginRight: 5,
  },
});

export default DashBoard;