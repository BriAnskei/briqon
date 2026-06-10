import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { Colors, Radius, Shadow } from "@/type/theme";

// ── Per-type design tokens ────────────────────────────────────────────────────

type ToastVariant = "success" | "error" | "info" | "warning";

const VARIANT: Record<
  ToastVariant,
  {
    accent: string;
    soft: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  success: {
    accent: Colors.success,
    soft: Colors.successSoft,
    icon: "check-circle-outline",
  },
  error: {
    accent: Colors.danger,
    soft: Colors.dangerSoft,
    icon: "robot-confused-outline",
  },
  info: {
    accent: Colors.accent,
    soft: Colors.accentSoft,
    icon: "information-outline",
  },
  warning: {
    accent: Colors.warning,
    soft: Colors.warningSoft,
    icon: "alert-circle-outline",
  },
};

// ── Shared toast card ─────────────────────────────────────────────────────────

function ToastCard({
  type,
  text1,
  text2,
}: ToastConfigParams<unknown> & { type: ToastVariant }) {
  const v = VARIANT[type];

  return (
    <View style={[s.card, Shadow.card]}>
      {/* Left accent bar */}
      <View style={[s.accentBar, { backgroundColor: v.accent }]} />

      {/* Icon bubble */}
      <View style={[s.iconWrap, { backgroundColor: v.soft }]}>
        <MaterialCommunityIcons name={v.icon} size={22} color={v.accent} />
      </View>

      {/* Text */}
      <View style={s.textWrap}>
        {!!text1 && (
          <Text style={s.title} numberOfLines={1}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={s.body} numberOfLines={3}>
            {text2}
          </Text>
        )}
      </View>
    </View>
  );
}

// ── Exported config ───────────────────────────────────────────────────────────

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard {...props} type="success" />,
  error: (props) => <ToastCard {...props} type="error" />,
  info: (props) => <ToastCard {...props} type="info" />,
  warning: (props) => <ToastCard {...props} type="warning" />,
};

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    minHeight: 64,
  },
  accentBar: {
    width: 4,
    alignSelf: "stretch",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 14,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    letterSpacing: 0.1,
  },
  body: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
});
