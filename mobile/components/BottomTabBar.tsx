import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
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
  const { colorScheme } = useTheme();
  const s = useSStyles();
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
    <SafeAreaView edges={["bottom"]}>
      <BlurView
        intensity={20} // backdrop-blur-sm (4px blur equivalent)
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={s.tabBar}
      >
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
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        tabBar: {
          flexDirection: "row",
          backgroundColor: colors.bgCard + "CC", // bg-card/80 (80% opacity per spec)
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: 12, // py-3
          paddingBottom: 20, // pb-5
        },
        tabItem: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          paddingHorizontal: 24, // px-6 per spec
        },
        tabLabel: {
          fontSize: 10,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          letterSpacing: 0.3,
        },
        tabLabelActive: {
          fontWeight: "500",
        },
      }),
    [colors],
  );
}
