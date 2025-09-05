import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch, Divider } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { updateTheme, updateViewMode } from '../../store/slices/settingsSlice';

export default function SettingsScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          right={() => (
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={(value) => dispatch(updateTheme(value ? 'dark' : 'light'))}
            />
          )}
        />
        <List.Item
          title="View Mode"
          description={settings.viewMode}
          onPress={() => {/* Open view mode selector */}}
        />
      </List.Section>
      
      <Divider />
      
      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Notification Settings"
          onPress={() => navigation.navigate('NotificationSettings')}
          right={() => <List.Icon icon="chevron-right" />}
        />
      </List.Section>
      
      <Divider />
      
      <List.Section>
        <List.Subheader>Privacy & Security</List.Subheader>
        <List.Item
          title="Privacy Settings"
          onPress={() => navigation.navigate('PrivacySettings')}
          right={() => <List.Icon icon="chevron-right" />}
        />
      </List.Section>
      
      <Divider />
      
      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item
          title="Sync & Backup"
          onPress={() => navigation.navigate('SyncSettings')}
          right={() => <List.Icon icon="chevron-right" />}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
