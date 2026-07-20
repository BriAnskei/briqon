import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius } from "@/type/theme";

interface ErrorCardProps {
	error: string;
	onRetry: () => void;
}

export function ErrorCard({ error, onRetry }: ErrorCardProps) {
	const s = useSStyles();
	return (
		<>
			<View style={s.errorCard}>
				<Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
				<Text style={s.errorText}>{error}</Text>
			</View>
			<TouchableOpacity
				style={s.retryBtn}
				onPress={onRetry}
				activeOpacity={0.85}
			>
				<Ionicons name="refresh-outline" size={16} color={Colors.bg} />
				<Text style={s.retryBtnText}>Retry</Text>
			</TouchableOpacity>
		</>
	);
}

function useSStyles() {
	const { colors } = useTheme();
	return useMemo(
		() =>
			StyleSheet.create({
				errorCard: {
					flexDirection: "row",
					alignItems: "center",
					gap: 10,
					borderWidth: 1,
					borderColor: Colors.danger,
					backgroundColor: Colors.dangerSoft,
					borderRadius: Radius.md,
					padding: 14,
				},
				errorText: { color: Colors.danger, fontSize: 13, flex: 1 },

				retryBtn: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "center",
					gap: 8,
					backgroundColor: Colors.accent,
					borderRadius: Radius.md,
					paddingVertical: 12,
					marginTop: 12,
				},
				retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.bg },
			}),
		[colors],
	);
}
