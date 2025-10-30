import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Appbar, 
  TextInput, 
  Button, 
  Card,
  Text,
  useTheme
} from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootState, AppDispatch } from '../../store';
import { updateCategory } from '../../store/slices/categoriesSlice';
import { RootStackParamList } from '../../types';

const PRESET_COLORS = [
  '#2196F3', // Blue
  '#4CAF50', // Green  
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#3F51B5', // Indigo
];

type EditCategoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditCategory'>;
type EditCategoryScreenRouteProp = RouteProp<RootStackParamList, 'EditCategory'>;

const EditCategoryScreen = () => {
  const theme = useTheme();
  const navigation = useNavigation<EditCategoryScreenNavigationProp>();
  const route = useRoute<EditCategoryScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { categoryId } = route.params;
  const { categories, loading } = useSelector((state: RootState) => state.categories);
  const category = categories.find(c => c.id === categoryId);

  const [name, setName] = useState(category?.name || '');
  const [selectedColor, setSelectedColor] = useState(category?.color || PRESET_COLORS[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setSelectedColor(category.color);
    }
  }, [category]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Category not found');
      return;
    }

    try {
      await dispatch(updateCategory({
        id: categoryId,
        updates: {
          name: name.trim(),
          color: selectedColor,
        }
      })).unwrap();

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (!category) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={handleCancel} />
          <Appbar.Content title="Category Not Found" />
        </Appbar.Header>
        <View style={styles.errorContainer}>
          <Text>Category not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content title="Edit Category" />
        <Appbar.Action 
          icon="check" 
          onPress={handleSave}
          disabled={loading}
        />
      </Appbar.Header>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Category Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Color
            </Text>
            
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <Button
                  key={color}
                  mode={selectedColor === color ? 'contained' : 'outlined'}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorButton,
                    { backgroundColor: selectedColor === color ? color : 'transparent' },
                    { borderColor: color }
                  ]}
                  contentStyle={styles.colorButtonContent}
                >
                  {' '}
                </Button>
              ))}
            </View>

            <View style={styles.preview}>
              <Text variant="titleSmall" style={styles.sectionTitle}>
                Preview
              </Text>
              <View style={styles.previewContainer}>
                <View 
                  style={[
                    styles.previewColor, 
                    { backgroundColor: selectedColor }
                  ]} 
                />
                <Text variant="titleMedium" style={styles.previewText}>
                  {name || 'Category Name'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={!name.trim()}
            style={styles.saveButton}
          >
            Update Category
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  colorButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 2,
  },
  colorButtonContent: {
    width: 44,
    height: 44,
  },
  preview: {
    marginTop: 16,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  previewColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  previewText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    paddingVertical: 16,
  },
  saveButton: {
    paddingVertical: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});

export default EditCategoryScreen;
