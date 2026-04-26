import { toastConfig } from "@/components/toastConfig";
import { ScheduleProvider } from "@/context/ScheduleContext";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ScheduleProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          // initialRouteName="schedule/review"
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="schedule/add"
            options={{
              presentation: "card", // or "modal" if you prefer sheet behaviour
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

          <Stack.Screen name="confirmation" />
        </Stack>
      </ScheduleProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
