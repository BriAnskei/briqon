import Toast from "react-native-toast-message";

type ToastType = "success" | "error" | "info" | "warning";

interface ShowToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  /** Duration in ms. Defaults to 4000. */
  duration?: number;
  /** Screen position. Defaults to "top". */
  position?: "top" | "bottom";
}

export function useToast() {
  const showToast = ({
    type,
    title,
    message,
    duration = 4000,
    position = "top",
  }: ShowToastOptions) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: duration,
      position,
      topOffset: 56, // clears the safe-area / status bar
    });
  };

  const hideToast = () => Toast.hide();

  return { showToast, hideToast };
}
