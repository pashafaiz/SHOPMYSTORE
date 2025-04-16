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
// } from 'react-native';

// import Header from '../Components/Header';
// import dummyData, { categoryData, sliderData } from '../constants/Dummy_Data';
// import img from '../assets/Images/img';
// import Colors from '../constants/Colors';
// import Filterbar from '../Components/Filterbar';
// import Strings from '../constants/Strings';

// const { width, height } = Dimensions.get('window');
// const numColumns = 4;
// const itemSize = width / numColumns;

// const DashBoard = () => {
//   const [search, setSearch] = useState('');
//   const [filteredData, setFilteredData] = useState(dummyData);
//   const [suggestions, setSuggestions] = useState([]);
//   const [isExpanded, setIsExpanded] = useState(false);
//   const flatListRef = useRef(null);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [activeFilter, setActiveFilter] = useState(null);

//   // Selected Filter Values
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [selectedPostcode, setSelectedPostcode] = useState('');
//   const [selectedGender, setSelectedGender] = useState('');

//   // useEffect(async() => {
//   //   let userdataaa = await AsyncStorage.getItem("userData")
//   //   console.log("----getdata---->",userdataaa);
//   //   const interval = setInterval(() => {
//   //     const nextIndex = (currentIndex + 1) % sliderData.length;
//   //     flatListRef.current?.scrollToIndex({
//   //       index: nextIndex,
//   //       animated: true,
//   //     });
//   //     setCurrentIndex(nextIndex);
//   //   }, 2000);

//   //   return () => clearInterval(interval);
//   // }, [currentIndex]);

//   useEffect(() => {
//     const fetchData = async () => {
//       const userdataaa = await AsyncStorage.getItem("userData");
//       console.log("----getdata---->", userdataaa);
//     };
  
//     fetchData();
  
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
  
//   const handleSearch = (text) => {
//     setSearch(text);
//     setIsExpanded(false);
//     const results = dummyData?.filter((item) =>
//       item?.Product_name?.toLowerCase().includes(text.toLowerCase())
//     );
//     setFilteredData(results);

//     if (text?.length > 0) {
//       setSuggestions(results);
//     } else {
//       setSuggestions([]);
//     }
//   };

//   const handleToggle = (filterName) => {
//     setActiveFilter(prev => (prev === filterName ? null : filterName));
//   };

//   const handleSuggestionSelect = (value) => {
//     setSearch(value);
//     setSuggestions([]);
//     const results = dummyData?.filter((item) =>
//       item.Product_name?.toLowerCase()?.includes(value?.toLowerCase())
//     );
//     setFilteredData(results);
//     Keyboard.dismiss();
//   };

//   return (
//     <View style={{ flex: 1 }}>
//       <ScrollView>
//         <Header
//           isSearch={true}
//           searchValue={search}
//           onSearchChange={handleSearch}
//           showLeftIcon={true}
//           leftIcon={img.drawer}
//           showRightIcon1={true}
//           rightIcon1={img.notification1}
//         />

//         {suggestions?.length > 0 && (
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
//               {(isExpanded ? suggestions : suggestions.slice(0, 5))?.map((item) => (
//                 <TouchableOpacity
//                   key={item?.id}
//                   onPress={() => handleSuggestionSelect(item?.Product_name)}
//                   style={styles.suggestionItem}
//                 >
//                   <Text style={styles.suggestionText}>{item?.Product_name}</Text>
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

//         <View style={{
//           height: height * 0.2,
//           backgroundColor: Colors.lightPurple,
//           width: width * 0.9,
//           alignSelf: "center",
//           borderRadius: 20
//         }}>
//           <FlatList
//             ref={flatListRef}
//             data={sliderData}
//             horizontal
//             pagingEnabled
//             showsHorizontalScrollIndicator={false}
//             keyExtractor={(item) => item.id}
//             renderItem={({ item }) => <RenderSliderList item={item} />}
//             onScrollToIndexFailed={() => { }}
//           />
//         </View>

//         <Text style={styles.category}>{Strings.filterCatagory}</Text>

//         <FlatList
//           data={categoryData}
//           keyExtractor={(item, index) => index.toString()}
//           renderItem={({ item }) => <RenderCategoryList item={item} />}
//           numColumns={numColumns}
//           contentContainerStyle={styles.flatListContainer}
//           showsVerticalScrollIndicator={false}
//         />
//         <View style={{ flexDirection: "row", justifyContent: "space-between" }}>

//           <Text style={styles.category}>{Strings.featureProduct}</Text>
//           <TouchableOpacity>
//             <Text style={[styles.category, { color: Colors.pink }]}>{"View All"}</Text>
//           </TouchableOpacity>
//         </View>
//         <FlatList
//           data={filteredData}
//           numColumns={2}
//           keyExtractor={(item) => item.id.toString()}
//           contentContainerStyle={styles.listContainer}
//           renderItem={({ item }) => <RenderProductList item={item} />}
//           showsVerticalScrollIndicator={false}
//         />
//       </ScrollView>
//     </View>
//   );
// };

// const RenderProductList = ({ item }) => (
//   <TouchableOpacity style={styles.itemBox} activeOpacity={0.7}>
//     <View style={styles.product_Img}>
//       <Image
//         source={item.product_Img}
//         style={styles.productImage}
//         resizeMode="contain"
//       />
//     </View>
//     <Text style={styles.itemText}>{item.Product_name}</Text>
//   </TouchableOpacity>
// );

// const RenderSliderList = ({ item }) => (
//   <View style={styles.slide}>
//     <Image source={item.image} style={styles.image} />
//     <View style={styles.overlay}>
//       <Text style={styles.Slider_text}>{item.title}</Text>
//     </View>
//   </View>
// );

// const RenderCategoryList = ({ item }) => (
//   <TouchableOpacity style={styles.itemContainer}>
//     <View style={styles.imageWrapper}>
//       <Image source={item.image} style={styles.image} />
//     </View>
//     <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
//   </TouchableOpacity>
// );

// export default DashBoard;

// const styles = StyleSheet.create({
//   listContainer: {
//     paddingBottom: 20,
//     alignItems: "center"
//   },
//   itemBox: {
//     width: width * 0.45,
//     backgroundColor: Colors.pink,
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
//     marginVertical: 12
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
//     justifyContent: "center",
//   },
//   image: {
//     width: '100%',
//     height: '100%',
//     borderRadius: 10,
//     resizeMode: "contain"
//   },
//   overlay: {
//     position: 'absolute',
//     padding: 50
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
//     padding: 15
//   },
//   flatListContainer: {
//     paddingVertical: 10,
//     alignSelf: "center",
//   },
//   itemContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 10,
//     width: itemSize,
//   },
//   imageWrapper: {
//     resizeMode: "contain",
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
} from 'react-native';
import Header from '../Components/Header';
import dummyData, { categoryData, sliderData } from '../constants/Dummy_Data';
import img from '../assets/Images/img';
import Colors from '../constants/Colors';
import Filterbar from '../Components/Filterbar';
import Strings from '../constants/Strings';

const { width, height } = Dimensions.get('window');
const numColumns = 4;
const itemSize = width / numColumns;

const DashBoard = () => {
  const [search, setSearch] = useState('');
  const [filteredData, setFilteredData] = useState(dummyData);
  const [suggestions, setSuggestions] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState(null);

  // Selected Filter Values
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPostcode, setSelectedPostcode] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const userdataaa = await AsyncStorage.getItem('userData');
      console.log('----getdata---->', userdataaa);
    };

    fetchData();

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

  const handleSearch = (text) => {
    setSearch(text);
    setIsExpanded(false);
    const results = dummyData?.filter((item) =>
      item?.Product_name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredData(results);

    if (text?.length > 0) {
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleToggle = (filterName) => {
    setActiveFilter((prev) => (prev === filterName ? null : filterName));
  };

  const handleSuggestionSelect = (value) => {
    setSearch(value);
    setSuggestions([]);
    const results = dummyData?.filter((item) =>
      item.Product_name?.toLowerCase()?.includes(value?.toLowerCase())
    );
    setFilteredData(results);
    Keyboard.dismiss();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView>
        <Header
          isSearch={true}
          searchValue={search}
          onSearchChange={handleSearch}
          showLeftIcon={true}
          leftIcon={img.drawer}
          showRightIcon1={true}
          rightIcon1={img.notification1}
        />

        {suggestions?.length > 0 && (
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
              {(isExpanded ? suggestions : suggestions.slice(0, 5))?.map((item) => (
                <TouchableOpacity
                  key={item?.id}
                  onPress={() => handleSuggestionSelect(item?.Product_name)}
                  style={styles.suggestionItem}
                >
                  <Text style={styles.suggestionText}>{item?.Product_name}</Text>
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
            keyExtractor={(item) => item.id.toString()} // Changed to toString()
            renderItem={({ item }) => <RenderSliderList item={item} />}
            onScrollToIndexFailed={() => {}}
          />
        </View>

        <Text style={styles.category}>{Strings.filterCatagory}</Text>

        <FlatList
          data={categoryData}
          keyExtractor={(item, index) => `category-${index}`} // More explicit key
          renderItem={({ item }) => <RenderCategoryList item={item} />}
          numColumns={numColumns}
          contentContainerStyle={styles.flatListContainer}
          showsVerticalScrollIndicator={false}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={styles.category}>{Strings.featureProduct}</Text>
          <TouchableOpacity>
            <Text style={[styles.category, { color: Colors.pink }]}>{'View All'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredData}
          numColumns={2}
          keyExtractor={(item, index) => `product-${item.id}-${index}`} // Ensure unique keys
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => <RenderProductList item={item} />}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    </View>
  );
};

const RenderProductList = ({ item }) => (
  <TouchableOpacity style={styles.itemBox} activeOpacity={0.7}>
    <View style={styles.product_Img}>
      <Image
        source={item.product_Img}
        style={styles.productImage}
        resizeMode="contain"
      />
    </View>
    <Text style={styles.itemText}>{item.Product_name}</Text>
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

export default DashBoard;

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 20,
    alignItems: 'center',
  },
  itemBox: {
    width: width * 0.45,
    backgroundColor: Colors.pink,
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
});
