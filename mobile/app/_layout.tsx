import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Colors } from "../type/theme";
import { ScheduleProvider } from "../context/ScheduleContext";

import { useRouter, useRootNavigationState } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  return (
    <ScheduleProvider>
      <StatusBar style="light" />
      <Stack
        // initialRouteName="schedule"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.bg },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="schedule" />
        <Stack.Screen name="confirmation" />
      </Stack>
    </ScheduleProvider>
  );
}
