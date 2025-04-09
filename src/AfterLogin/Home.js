import React from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

const Home = () => {
  return (
    <View style={styles.container}>
      {/* Top Search Row */}
      <View style={styles.searchRow}>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <TextInput placeholder="Search Here" style={styles.input} />
          <TouchableOpacity>
            <Icon name="search" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <FontAwesome name="bell" size={22} color="#fff" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      {/* Filter Dropdowns */}
      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.filterButton}>
          <Text>Shop by Categories ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text>Postcode ▼</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text>Gender ▼</Text>
        </TouchableOpacity>
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <Icon name="location-on" size={20} color="black" />
        <Text style={styles.locationText}> Hilden- Nordeln</Text>
        <Icon name="arrow-drop-down" size={20} />
      </View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
  flex:1,
  backgroundColor:'white'
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuButton: {
    backgroundColor: '#f8cdd0',
    padding: 10,
    borderRadius: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    marginHorizontal: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
  },
  bellButton: {
    backgroundColor: '#f8cdd0',
    padding: 10,
    borderRadius: 20,
    position: 'relative',
  },
  notificationDot: {
    width: 8,
    height: 8,
    backgroundColor: 'red',
    borderRadius: 4,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  filtersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    backgroundColor: '#f2f2f2',
    padding: 8,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
