import { createContext, useContext, useEffect } from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import {
  darkThemePalette,
  lightThemePalette,
  setActiveTheme,
  type ColorScheme,
  type Theme,
} from "@/type/theme";

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

  // Keep the live `Colors` proxy in sync so inline usages and useStyles()
  // hooks read the correct palette during the same render pass.
  setActiveTheme(scheme);

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(colors.bg).catch(() => {});
    NavigationBar.setButtonStyleAsync(scheme === "dark" ? "light" : "dark").catch(
      () => {},
    );
  }, [colors, scheme]);

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
