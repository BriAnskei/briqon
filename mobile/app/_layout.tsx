import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import SplashScreen from "@/components/SplashScreen";
import { buildToastConfig } from "@/components/toastConfig";
import { NewScheduleFormProvider } from "@/context/NewScheduleFormContext";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { initializeDb } from "@/src/database/init";

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<ThemeProvider>
				<ScheduleProvider>
					<NewScheduleFormProvider>
						<ScreenStack />
					</NewScheduleFormProvider>
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
