import { getDatabase } from "../database/db";
import * as SQLite from "expo-sqlite";

export abstract class BaseRepository {
	private dbPromise = getDatabase();

	/**
	 * Executes operations within an ACID transaction
	 * @param callback - Function that receives a db instance and performs operations
	 * @returns Promise resolving to the callback's return value
	 */
	public async transaction<T>(
		callback: (db: SQLite.SQLiteDatabase) => Promise<T>,
	): Promise<T> {
		const db = await this.dbPromise;
		let res!: T;
		await db.withTransactionAsync(async () => {
			res = await callback(db);
		});

		return res;
	}

	/**
	 * Executes a SQL query that doesn't return data (INSERT, UPDATE, DELETE, etc.)
	 * @param sql - The SQL query string to execute
	 * @param params - Optional parameters to bind to the SQL query (prevents SQL injection)
	 * @param db - Optional database instance (useful for transactions)
	 * @returns Promise with the run result (includes lastInsertRowId and changes)
	 */
	protected async run(
		sql: string,
		params: SQLite.SQLiteBindParams = [],
		db?: SQLite.SQLiteDatabase,
	) {
		const database = db ?? (await this.dbPromise);

		return database.runAsync(sql, params);
	}

	/**
	 * Retrieves the first row from a query result set
	 * @param sql - The SQL SELECT query string
	 * @param params - Optional parameters to bind to the SQL query
	 * @returns Promise with the first matching row as type T, or null if no rows found
	 * @example const user = await this.first<User>("SELECT * FROM users WHERE id = ?", [userId]);
	 */
	protected async first<T>(sql: string, params: SQLite.SQLiteBindParams = []) {
		const db = await this.dbPromise;
		return db.getFirstAsync<T>(sql, params);
	}

	/**
	 * Retrieves all rows from a query result set
	 * @param sql - The SQL SELECT query string
	 * @param params - Optional parameters to bind to the SQL query
	 * @param db - Optional database instance (useful for transactions)
	 * @returns Promise with an array of all matching rows as type T[]
	 * @example const users = await this.all<User>("SELECT * FROM users WHERE age > ?", [18]);
	 */
	protected async all<T>(
		sql: string,
		params: SQLite.SQLiteBindParams = [],
		db?: SQLite.SQLiteDatabase,
	) {
		const database = db ?? (await this.dbPromise);
		return database.getAllAsync<T>(sql, params);
	}
}
