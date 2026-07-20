import dotenv from "dotenv";

dotenv.config({ override: true });

export default {
	expo: {
		name: "briqon",
		slug: "briqon",
		extra: {
			OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
		},
	},
};
