import { migrateDatabase } from "./migration";

export const initializeDb = async () => {
	try {
		await migrateDatabase();
		console.log("Database initialized");
	} catch (error) {
		console.error("Database initialization failed:", error);
	}
};
