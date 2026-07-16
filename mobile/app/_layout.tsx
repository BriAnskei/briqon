import SplashScreen from "@/components/SplashScreen";
import { toastConfig } from "@/components/toastConfig";
import { AIProvider } from "@/context/AIContext";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { initializeDb } from "@/src/database/init";
import { Stack } from "expo-router";
import { useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ScheduleProvider>
        <AIProvider>
          <ScreenStack />
        </AIProvider>
      </ScheduleProvider>
      <Toast config={toastConfig} />
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
      <Stack.Screen
        name="schedule/schedule-conversation"
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
