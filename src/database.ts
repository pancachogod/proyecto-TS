// src/database.ts
import * as SQLite from 'expo-sqlite';

// Interfaces
export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  created_at?: string;
}

export interface Favorite {
  id?: number;
  user_id: number;
  city_name: string;
  timezone: string;
  saved_at?: string;
}

// Abrir la base de datos usando la nueva API (SDK 54)
const db = SQLite.openDatabaseSync('app.db');

// Función para crear la tabla si no existe
export const initDB = async (): Promise<void> => {
  try {
    // Habilitar foreign keys
    await db.execAsync(`PRAGMA foreign_keys = ON;`);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        city_name TEXT NOT NULL,
        timezone TEXT NOT NULL,
        saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    throw error;
  }
};

// Clase para manejar las operaciones de base de datos
export class DatabaseManager {
  // Insertar un usuario
  static async insertUser(user: Omit<User, 'id' | 'created_at'>): Promise<number> {
    try {
      const result = await db.runAsync(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [user.name, user.email, user.password]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error insertando usuario:', error);
      throw error;
    }
  }

  // Obtener todos los usuarios
  static async getUsers(): Promise<User[]> {
    try {
      const result = await db.getAllAsync('SELECT * FROM users ORDER BY id DESC') as User[];
      return result;
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      throw error;
    }
  }

  // Obtener usuario por ID
  static async getUserById(id: number): Promise<User | null> {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [id]
      ) as User | null;
      return result;
    } catch (error) {
      console.error('Error obteniendo usuario por ID:', error);
      throw error;
    }
  }

  // Obtener usuario por email (útil para login)
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM users WHERE email = ?',
        [email]
      ) as User | null;
      return result;
    } catch (error) {
      console.error('Error obteniendo usuario por email:', error);
      throw error;
    }
  }

  // Actualizar usuario
  static async updateUser(id: number, user: Partial<Omit<User, 'id'>>): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (user.name) {
        fields.push('name = ?');
        values.push(user.name);
      }
      if (user.email) {
        fields.push('email = ?');
        values.push(user.email);
      }
      if (user.password) {
        fields.push('password = ?');
        values.push(user.password);
      }

      if (fields.length === 0) {
        return false;
      }

      values.push(id);

      const result = await db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      throw error;
    }
  }

  // Eliminar usuario
  static async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      throw error;
    }
  }

  // Eliminar todos los usuarios (útil para testing)
  static async clearUsers(): Promise<void> {
    try {
      await db.runAsync('DELETE FROM users');
      console.log('Todos los usuarios eliminados');
    } catch (error) {
      console.error('Error eliminando todos los usuarios:', error);
      throw error;
    }
  }

  // ---------- FAVORITOS ----------
  static async addFavorite(userId: number, cityName: string, timezone: string): Promise<number> {
    try {
      const result = await db.runAsync(
        'INSERT INTO favorites (user_id, city_name, timezone) VALUES (?, ?, ?)',
        [userId, cityName, timezone]
      );
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Error agregando favorito:', error);
      throw error;
    }
  }

  static async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    try {
      const rows = await db.getAllAsync(
        'SELECT id, user_id, city_name, timezone, saved_at FROM favorites WHERE user_id = ? ORDER BY saved_at DESC',
        [userId]
      );
      return rows as Favorite[];
    } catch (error) {
      console.error('Error obteniendo favoritos:', error);
      throw error;
    }
  }

  static async deleteFavorite(id: number): Promise<boolean> {
    try {
      const result = await db.runAsync('DELETE FROM favorites WHERE id = ?', [id]);
      return result.changes > 0;
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      throw error;
    }
  }

  static async clearFavoritesForUser(userId: number): Promise<void> {
    try {
      await db.runAsync('DELETE FROM favorites WHERE user_id = ?', [userId]);
    } catch (error) {
      console.error('Error limpiando favoritos del usuario:', error);
      throw error;
    }
  }
}

export default db;
