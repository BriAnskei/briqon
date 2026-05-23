import SplashScreen from "@/components/SplashScreen";
import { toastConfig } from "@/components/toastConfig";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { initializeDb } from "@/src/database/init";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeDb().finally(() => setIsReady(true));
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ScheduleProvider>
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
            name="schedule/edit"
            options={{
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="schedule/schedule-conversation"
            options={{
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen name="confirmation" />
        </Stack>
      </ScheduleProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
