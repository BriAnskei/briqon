import SplashScreen from "@/components/SplashScreen";
import { buildToastConfig } from "@/components/toastConfig";
import { AIProvider } from "@/context/AIContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { initializeDb } from "@/src/database/init";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<ScheduleProvider>
					<AIProvider>
						<ScreenStack />
					</AIProvider>
				</ScheduleProvider>
			</ThemeProvider>
			<Toast config={buildToastConfig()} />
		</SafeAreaProvider>
	);
}

function ScreenStack() {
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		initializeDb().finally(() => setIsReady(true));
	}, []);

	if (!isReady) {
		return <SplashScreen />;
	}
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(tabs)" />
			<Stack.Screen
				name="alarm"
				options={{
					presentation: "fullScreenModal",
					animation: "fade",
				}}
			/>
			<Stack.Screen
				name="schedule/add"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>

			<Stack.Screen
				name="schedule/generation"
				options={{
					presentation: "card",
					animation: "slide_from_right",
				}}
			/>
		</Stack>
	);
}
