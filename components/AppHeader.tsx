import { StyleSheet, Text, View } from 'react-native';

export default function AppHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>VITURA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  content: {
    alignItems: 'flex-start',
  },
  appName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'green',
  },
});
