import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Card, List, FAB } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export default function CategoryListScreen({ navigation }: any) {
  const categories = useSelector((state: RootState) => state.categories.categories);

  const renderCategory = ({ item }: any) => (
    <Card style={styles.card}>
      <List.Item
        title={item.name}
        left={() => <List.Icon icon={item.icon} color={item.color} />}
        onPress={() => navigation.navigate('CategoryDetail', { categoryId: item.id })}
      />
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {/* Add category */}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
