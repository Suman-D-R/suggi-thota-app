import { StyleSheet, Text, View } from 'react-native';

export default function AppHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>SUGGI THOTA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
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
