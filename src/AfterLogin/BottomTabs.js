// import React from 'react';
// import { View } from 'react-native';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Ionicons from 'react-native-vector-icons/Ionicons';

// import DashBoard from './DashBoard';
// import Home from './Home';
// import Chat from './Chat';
// import User from './User';

// const Tab = createBottomTabNavigator();

// const BottomTabs = () => {
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarShowLabel: false,
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: 'white',
//           height: 70,
//         },
//         tabBarIcon: ({ focused }) => {
//           let iconName;

//           if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
//           else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
//           else if (route.name === 'Chat') iconName = focused ? 'chatbox' : 'chatbox-outline';
//           else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

//           return (
//             <View style={{ top:12,borderRadius: 30, height:60,width:60, alignItems:'center',justifyContent:'center',backgroundColor: focused ? '#FF6BAF' : 'transparent',}}>
//               <Ionicons name={iconName} size={26} color={focused ? 'black' : '#aaa'} />
//             </View>
//           );
//         },
//       })}
//     >
//       <Tab.Screen name="Home" component={Home} />
//       <Tab.Screen name="Search" component={DashBoard} />
//       <Tab.Screen name="Chat" component={Chat} />
//       <Tab.Screen name="Profile" component={User} />
//     </Tab.Navigator>
//   );
// };

// export default BottomTabs;


import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

import DashBoard from './DashBoard';
import Home from './Home';
import Chat from './Chat';
import User from './User';

const Tab = createBottomTabNavigator();

const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          height: 70,
          borderTopWidth: 1,
          borderTopColor: '#ddd', // light grey top border
          elevation: 60, // Android shadow
          shadowColor: '#000', // iOS shadow
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbox' : 'chatbox-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

          return (
            <View style={{ top:12}}>
              <Ionicons name={iconName} size={28} color={focused ? '#FF6BAF' : '#aaa'} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Search" component={DashBoard} />
      <Tab.Screen name="Chat" component={Chat} />
      <Tab.Screen name="Profile" component={User} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
