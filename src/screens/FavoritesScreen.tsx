// src/screens/FavoritesScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { DatabaseManager, Favorite } from '../database';

interface Route {
  params?: { userId?: number | string };
}

export default function FavoritesScreen({ route, navigation }: { route: Route; navigation: any }) {
  const userIdParam = route.params?.userId;
  const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : (userIdParam as number);
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const loadFavorites = async () => {
    if (!userId || Number.isNaN(userId)) return;
    try {
      const rows = await DatabaseManager.getFavoritesByUser(userId);
      setFavorites(rows);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
      Alert.alert('Error', 'No se pudieron cargar los favoritos');
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleDeleteFavorite = async (id?: number) => {
    if (!id) return;
    try {
      const ok = await DatabaseManager.deleteFavorite(id);
      if (ok) {
        setFavorites(prev => prev.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      Alert.alert('Error', 'No se pudo eliminar el favorito');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Mis Favoritos</Text>

      {favorites.length === 0 ? (
        <Text style={styles.emptyText}>No tienes horarios guardados.</Text>
      ) : (
        favorites.map((fav) => (
          <View key={fav.id} style={styles.card}>
            <Text style={styles.city}>{fav.city_name}</Text>
            <Text style={styles.timeText}>
              {new Date().toLocaleTimeString('es-ES', { timeZone: fav.timezone })}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('es-ES', { timeZone: fav.timezone })}
            </Text>
            <TouchableOpacity onPress={() => handleDeleteFavorite(fav.id)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  contentContainer: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  emptyText: { textAlign: 'center', color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
  },
  city: { fontSize: 18, fontWeight: '600', marginBottom: 6 },
  timeText: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  dateText: { fontSize: 14, color: '#6c6c6e' },
  deleteButton: {
    marginTop: 10,
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  backButton: {
    marginTop: 8,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  backText: { color: '#fff', fontWeight: 'bold' },
});

