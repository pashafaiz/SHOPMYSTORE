import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, {useState} from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';


const DashBoard = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState('All');

  const handleFilterPress = item => {
    setSelected(item);
    // No navigation here — content will change below
  };

  const renderIcon = item => {
    if (item === 'Groups') {
      return (
        <FontAwesome5
          name="users"
          size={18}
          color="black"
          style={styles.icon}
        />
      );
    } else if (item === 'Products') {
      return (
        <MaterialIcons name="lock-outline" size={20} color="black"style={styles.icon}/>
      );
    }
    return null;
  };

  const renderContent = () => {
    switch (selected) {
      case 'Groups':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>Groups Content</Text>
          </View>
        );
      case 'Products':
        return (
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>Products Content</Text>
          </View>
        );
      case 'All':
      default:
        return (
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>All Items</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.inputWrapper}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons
            name="chevron-left"
            size={28}
            color="#333"
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <TextInput
          placeholder="Search Here"
          style={styles.input}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.filterContainer}>
        {['All', 'Groups', 'Products'].map(item => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              selected === item && styles.selectedButton,
            ]}
            onPress={() => handleFilterPress(item)}>
            {renderIcon(item)}
            <Text
              style={[
                styles.filterText,
                selected === item && styles.selectedText,
              ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* 👇 Renders content based on selected filter */}
      <View style={{marginTop: 20}}>{renderContent()}</View>
      
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
    <Text style={styles.label} numberOfLines={1}>{item.name}</Text>
  </TouchableOpacity>
);

export default DashBoard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6eb',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 10,
    marginBottom: 20,
    bottom: 10,
  },
  backIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#333',
    // backgroundColor: '#ffe6eb',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 9,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ffe6eb',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: '#fff',
    bottom: 10,
  },
  selectedButton: {
    backgroundColor: '#ffe6eb',
    borderColor: '#f9c2d2',
  },
  filterText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '900',
  },
  selectedText: {
    color: '#d62857',
    fontWeight: '700',
  },
  icon: {
    marginRight: 8,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    bottom: 18,
  },
});
