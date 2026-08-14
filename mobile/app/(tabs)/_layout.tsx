import { Tabs } from "expo-router";
import { BottomTabBar } from "../../components/BottomTabBar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="schedules" />
    </Tabs>
  );
}
