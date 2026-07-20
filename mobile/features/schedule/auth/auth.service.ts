import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";
import { api } from "@/api/client";

/** Returns a registration id token, if does it exist it will request for one */
export async function getTokenAsync() {
	let token = await SecureStore.getItemAsync("jwt");

	if (token) return token;

	// initialize installtionId
	let installationId = uuidv4();

	// request to tokenize id
	const res = await api.post(
		"api/register",
		{
			installationId,
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);

	if (!res.data.success) {
		throw new Error(res.data.error ?? "Failed to register device");
	}

	await SecureStore.setItemAsync("jwt", res.data.token);

	return res.data.token;
}
