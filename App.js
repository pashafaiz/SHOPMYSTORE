import { Text, StyleSheet, View } from 'react-native'
import React, { Component } from 'react'
import Navigator from './src/Navigation/Navigator'
// import Navigator from './src/Navigation/Navigator'

export default class App extends Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <Navigator/>
      </View>
    )
  }
}

const styles = StyleSheet.create({})