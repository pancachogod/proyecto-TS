import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { DatabaseManager } from '../database';

// --- Interfaces de TypeScript para la aplicación ---
interface User {
  name: string;
  email: string;
  id: string | number;
}

interface Navigation {
  replace: (screen: string) => void;
}

interface Route {
  params?: {
    user?: User;
  };
}

interface HomeScreenProps {
  navigation: Navigation;
  route: Route;
}

interface CityTimeData {
  name: string;
  dateTime: Date | 'Error';
  timezone: string | null; // Guardará la zona horaria de la ciudad
}

// --- Componente Principal para Expo Go / React Native ---
export default function HomeScreen({ navigation, route }: HomeScreenProps) {
  // Simulación de datos de usuario si no se reciben
  const { user } = route.params || { user: { name: 'Usuario de Prueba', email: 'usuario@expo.com', id: '12345' } };

  const [timeData, setTimeData] = useState<CityTimeData[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Inicia en true para mostrar el indicador

  // Guardar ciudad/horario como favorito para el usuario actual
  const handleSaveFavorite = async (cityName: string, timezone: string | null) => {
    if (!timezone) {
      Alert.alert('Error', 'No se puede guardar esta ciudad.');
      return;
    }
    try {
      const uid = typeof user?.id === 'string' ? parseInt(user.id, 10) : (user?.id as number);
      if (!uid || Number.isNaN(uid)) {
        Alert.alert('Error', 'Usuario inválido. Vuelve a iniciar sesión.');
        return;
      }
      await DatabaseManager.addFavorite(uid, cityName, timezone);
      Alert.alert('Favoritos', 'Guardado en favoritos');
    } catch (error) {
      console.error('Error guardando favorito:', error);
      Alert.alert('Error', 'No se pudo guardar en favoritos');
    }
  };

  // Eliminar SOLO la cuenta actual
  const handleDeleteAccount = () => {
    Alert.alert('Eliminar mi cuenta', 'Esto eliminará tu cuenta y tus favoritos. ¿Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const uid = typeof user?.id === 'string' ? parseInt(user.id, 10) : (user?.id as number);
            if (!uid || Number.isNaN(uid)) {
              Alert.alert('Error', 'Usuario inválido. Vuelve a iniciar sesión.');
              return;
            }
            await DatabaseManager.deleteUser(uid);
            Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada');
            navigation.replace('Login');
          } catch (error) {
            console.error('Error eliminando cuenta:', error);
            Alert.alert('Error', 'No se pudo eliminar la cuenta');
          }
        },
      },
    ]);
  };

  // Función para obtener la hora de las capitales
  const fetchTimezones = async () => {
    setLoading(true);
    const cities = [
      { name: 'Bogotá', timezone: 'America/Bogota' },
      { name: 'Buenos Aires', timezone: 'America/Argentina/Buenos_Aires' },
      { name: 'São Paulo', timezone: 'America/Sao_Paulo' },
      { name: 'Lima', timezone: 'America/Lima' },
      { name: 'Santiago', timezone: 'America/Santiago' },
    ];

    try {
      const results = await Promise.all(
        cities.map(async (city) => {
          try {
            const response = await fetch(`https://worldtimeapi.org/api/timezone/${city.timezone}`);
            if (!response.ok) throw new Error('Respuesta de red no fue exitosa');
            const data = await response.json();
            return {
              name: city.name,
              dateTime: new Date(data.utc_datetime),
              timezone: data.timezone, // Guardamos la zona horaria correcta
            };
          } catch (error) {
            console.error(`Error fetching time for ${city.name}:`, error);
            return { name: city.name, dateTime: 'Error' as 'Error', timezone: null };
          }
        })
      );
      setTimeData(results);
    } catch (error) {
      console.error("Error general al obtener zonas horarias:", error);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para la carga inicial y el temporizador
  useEffect(() => {
    fetchTimezones();

    const timer = setInterval(() => {
      setTimeData((prevTimeData) =>
        prevTimeData.map((city) => {
          if (city.dateTime instanceof Date) {
            return {
              ...city,
              dateTime: new Date(city.dateTime.getTime() + 1000),
            };
          }
          return city;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', onPress: () => navigation.replace('Login'), style: 'destructive' },
    ]);
  };

  // Eliminar todos los usuarios de la base de datos
  const handleClearUsers = () => {
    Alert.alert(
      'Eliminar usuarios',
      'Esta acción eliminará todos los usuarios almacenados. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.clearUsers();
              Alert.alert('Listo', 'Todos los usuarios fueron eliminados');
            } catch (error) {
              console.error('Error limpiando usuarios:', error);
              Alert.alert('Error', 'No se pudieron eliminar los usuarios');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Sección de Bienvenida */}
      <View style={styles.sectionContainer}>
        <Text style={styles.welcomeTitle}>¡Bienvenido!</Text>
        <Text style={styles.welcomeUser}>{user?.name}</Text>
        <Text style={styles.welcomeEmail}>{user?.email}</Text>
      </View>

      {/* Sección de Información del Usuario */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Tu Información</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Nombre:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.name}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
        </View>
        <View style={[styles.infoCard, { borderBottomWidth: 0 }]}>
          <Text style={styles.infoLabel}>ID:</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{user?.id}</Text>
        </View>
      </View>

      {/* Sección de Horarios */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Horarios de Suramérica 🌎</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
        ) : (
          <>
            {timeData.map((city, index) => (
              <View key={index} style={styles.timezoneCard}>
                <Text style={styles.cityName}>{city.name}</Text>
                {city.dateTime instanceof Date && city.timezone ? (
                  <>
                    <Text style={styles.timeText}>
                      {city.dateTime.toLocaleTimeString('es-ES', { timeZone: city.timezone })}
                    </Text>
                    <Text style={styles.dateText}>
                      {city.dateTime.toLocaleDateString('es-ES', { timeZone: city.timezone })}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleSaveFavorite(city.name, city.timezone)}
                      style={styles.favoriteButton}
                    >
                      <Text style={styles.buttonText}>Guardar favorita</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={styles.errorText}>Error al cargar</Text>
                )}
              </View>
            ))}
            <TouchableOpacity onPress={fetchTimezones} style={styles.syncButton}>
              <Text style={styles.buttonText}>Sincronizar Relojes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const uid = typeof user?.id === 'string' ? parseInt(user.id, 10) : (user?.id as number);
                // @ts-ignore
                (navigation as any).navigate('Favorites', { userId: uid });
              }}
              style={styles.syncButton}
            >
              <Text style={styles.buttonText}>Ver Favoritos</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Botón de Cerrar Sesión */}
      <TouchableOpacity onPress={handleDeleteAccount} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Eliminar mi cuenta</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
      
    </ScrollView>
  );
}

// --- Hoja de Estilos de React Native ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  contentContainer: {
    padding: 20,
  },
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1c1c1e',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeUser: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeEmail: {
    fontSize: 16,
    color: '#6c6c6e',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  infoLabel: {
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#8e8e93',
    flexShrink: 1,
    textAlign: 'right',
  },
  timezoneCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cityName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  timeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginVertical: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6c6c6e',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
  syncButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  favoriteButton: {
    backgroundColor: '#5856D6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#FF9500',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

