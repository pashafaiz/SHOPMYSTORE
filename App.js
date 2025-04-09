import { Text, StyleSheet, View, StatusBar, SafeAreaView } from 'react-native'
import React, { Component } from 'react'
import Navigator from './src/Navigation/Navigator'
// import Navigator from './src/Navigation/Navigator'

export default class App extends Component {
  render() {
    return (
      <View style={{
        flex: 1,
        backgroundColor: "white"
      }}>
        <StatusBar

          barStyle="dark-content"
          translucent={false}
        />
        <SafeAreaView style={styles.container}>
          <Navigator />
        </SafeAreaView>
      </View>
    )
  }

}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
})



