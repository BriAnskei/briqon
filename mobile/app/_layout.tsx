import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="schedule/add"
          options={{
            presentation: "card", // or "modal" if you prefer sheet behaviour
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen name="confirmation" />
      </Stack>
    </SafeAreaProvider>
  );
}
