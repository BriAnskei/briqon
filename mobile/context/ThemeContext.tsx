import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useColorScheme } from "react-native";
import {
  type ColorScheme,
  darkThemePalette,
  lightThemePalette,
  setActiveTheme,
  type Theme,
} from "@/type/theme";
import { useFonts } from "@/hooks/useFonts";
import SplashScreen from "@/components/SplashScreen";

type ThemeValue = {
  colorScheme: ColorScheme;
  colors: Theme;
};

const ThemeContext = createContext<ThemeValue>({
  colorScheme: "dark",
  colors: darkThemePalette,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme() ?? "dark";
  const colors = scheme === "dark" ? darkThemePalette : lightThemePalette;

  const { fontsLoaded } = useFonts();

  // Keep the live `Colors` proxy in sync so inline usages and useStyles()
  // hooks read the correct palette during the same render pass.
  setActiveTheme(scheme);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(colors.bg).catch(() => {});
    NavigationBar.setButtonStyleAsync(scheme === "dark" ? "light" : "dark").catch(() => {});
  }, [colors, scheme]);

  if (!fontsLoaded) {
    return <SplashScreen />;
  }

  return (
    <ThemeContext.Provider value={{ colorScheme: scheme, colors }}>
      <StatusBar style={scheme} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
