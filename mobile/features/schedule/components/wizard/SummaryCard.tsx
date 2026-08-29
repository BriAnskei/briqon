import { Fragment, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import type {
  EventSummary,
  PersonalSummary,
} from "@/features/schedule/hooks/form/useWizardForm";
import { Radius, Shadow } from "@/type/theme";
import { formatMinutes } from "@/utils/TimeFormatter";

export type SummaryItem = { label: string; value: string };

export function SummaryCard({ items }: { items: SummaryItem[] }) {
  const s = useSStyles();
  return (
    <View style={s.card}>
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {i > 0 && <View style={s.divider} />}
          <View style={s.item}>
            <Text style={s.value}>{it.value}</Text>
            <Text style={s.label}>{it.label}</Text>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

export function personalSummaryItems(s: PersonalSummary): SummaryItem[] {
  return [
    { label: "Window", value: formatMinutes(s.windowMinutes) },
    ...(s.appointmentMinutes > 0
      ? [
          {
            label: "Appts",
            value: formatMinutes(s.appointmentMinutes),
          },
        ]
      : []),
    ...(s.mealMinutes > 0
      ? [{ label: "Meals", value: formatMinutes(s.mealMinutes) }]
      : []),
    {
      label: "Remaining",
      value: formatMinutes(s.remainingMinutes),
    },
  ];
}

export function eventSummaryItems(s: EventSummary): SummaryItem[] {
  return [
    {
      label: "Event Hours",
      value: formatMinutes(s.windowMinutes),
    },
    { label: "Items", value: String(s.totalItems) },
    {
      label: "Remaining",
      value: formatMinutes(s.remainingMinutes),
    },
  ];
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.bgCard,
          borderRadius: Radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: 14,
          paddingHorizontal: 8,
          marginBottom: 20,
          ...Shadow.card,
        },
        item: { flex: 1, alignItems: "center" },
        divider: { width: 1, height: 28, backgroundColor: colors.borderLight },
        value: {
          fontSize: 16,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
          marginBottom: 2,
        },
        label: {
          fontSize: 11,
          fontFamily: "DMMono-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
      }),
    [colors],
  );
}
