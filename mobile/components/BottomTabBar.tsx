import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/type/theme";

type TabKey = "alarm" | "schedules" | "add";

type TabDef = {
  key: TabKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  routeName: string;
};

const TABS: TabDef[] = [
  {
    key: "alarm",
    icon: "alarm-outline",
    iconActive: "alarm",
    label: "Alarm",
    routeName: "index",
  },
  {
    key: "schedules",
    icon: "calendar-outline",
    iconActive: "calendar",
    label: "Schedules",
    routeName: "schedules",
  },
  {
    key: "add",
    icon: "add-circle-outline",
    iconActive: "add-circle-outline",
    label: "Add New",
    routeName: "",
  },
];

export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const router = useRouter();

  const activeRouteKey = state.index === 0 ? "alarm" : "schedules";

  const handlePress = (tab: TabDef) => {
    if (tab.key === "add") {
      router.push("/schedule/add");
      return;
    }
    navigation.navigate(tab.routeName);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={s.tabBar}>
      {/* ← dynamic paddingBottom */}
      {TABS.map((tab) => {
        const active = tab.key === activeRouteKey;
        const iconColor = active ? Colors.accent : Colors.textMuted;
        const iconName = active ? tab.iconActive : tab.icon;

        return (
          <TouchableOpacity
            key={tab.key}
            style={s.tabItem}
            onPress={() => handlePress(tab)}
            activeOpacity={0.7}
          >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <Text
              style={[
                s.tabLabel,
                { color: active ? Colors.accent : Colors.textMuted },
                active && s.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {active && <View style={s.tabActiveDot} />}
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  tabActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
    marginTop: 1,
  },
});
