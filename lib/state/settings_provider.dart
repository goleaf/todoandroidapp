import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsNotifier extends StateNotifier<ThemeMode> {
  SettingsNotifier() : super(ThemeMode.system) {
    _loadThemeMode();
  }

  Future<void> _loadThemeMode() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final themeModeIndex = prefs.getInt('theme_mode');
      if (themeModeIndex != null) {
        state = ThemeMode.values[themeModeIndex];
      }
    } catch (e) {
      print('Error loading theme mode: $e');
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('theme_mode', mode.index);
    } catch (e) {
      print('Error saving theme mode: $e');
    }
  }
}

final themeProvider = StateNotifierProvider<SettingsNotifier, ThemeMode>((ref) {
  return SettingsNotifier();
});

class LocaleNotifier extends StateNotifier<Locale?> {
  LocaleNotifier() : super(null) {
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode = prefs.getString('locale_language');
      if (languageCode != null && languageCode.isNotEmpty) {
        state = Locale(languageCode);
      }
    } catch (e) {
      print('Error loading locale: $e');
    }
  }

  Future<void> setLocale(Locale? locale) async {
    state = locale;
    try {
      final prefs = await SharedPreferences.getInstance();
      if (locale == null) {
        await prefs.remove('locale_language');
      } else {
        await prefs.setString('locale_language', locale.languageCode);
      }
    } catch (e) {
      print('Error saving locale: $e');
    }
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale?>((ref) {
  return LocaleNotifier();
});

