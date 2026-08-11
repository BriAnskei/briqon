import { useEffect, useState } from "react";
import * as Font from "expo-font";

// Expo font loading uses the "fontFamily" key as the resolved name.
// We register them so that `fontFamily: "DMMono"` and `fontFamily: "Inter"` resolve correctly.
const FONT_FAMILY_MAP: Record<string, any> = {
  "DMMono": require("../assets/fonts/DMMono-Regular.ttf"),
  "DMMono-Light": require("../assets/fonts/DMMono-Light.ttf"),
  "DMMono-Medium": require("../assets/fonts/DMMono-Medium.ttf"),
  "DMMono-SemiBold": require("../assets/fonts/DMMono-SemiBold.ttf"),
  "Inter": require("../assets/fonts/Inter-Regular.ttf"),
  "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
  "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
};

export function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync(FONT_FAMILY_MAP);
        setFontsLoaded(true);
      } catch (e) {
        setError(e as Error);
        // Fonts failed to load — app still works with system fonts
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  return { fontsLoaded, error };
}
