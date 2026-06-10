import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";

import { FormState } from "@/type/NewScheduleTypes";
import { BREAK_FREQUENCY_OPTIONS } from "../../contants/wizardOptions";

type Props = {
  breakFrequency: FormState["breakFrequency"];
  onChange: (v: FormState["breakFrequency"]) => void;
};

export function BreaksStep({ breakFrequency, onChange }: Props) {
  return (
    <View style={s.body}>
      <Text style={s.title}>Break frequency</Text>
      <Text style={s.sub}>
        Choose how you want your breaks distributed throughout the day.
      </Text>
      <View style={s.gap}>
        {BREAK_FREQUENCY_OPTIONS.map((opt) => {
          const active = breakFrequency === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                s.card,
                active && {
                  borderColor: opt.color,
                  backgroundColor: opt.color + "12",
                },
              ]}
              onPress={() => onChange(opt.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.iconWrap,
                  {
                    backgroundColor: active
                      ? opt.color + "25"
                      : Colors.bgElevated,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={active ? opt.color : Colors.textMuted}
                />
              </View>
              <View style={s.cardBody}>
                <Text style={[s.cardLabel, active && { color: opt.color }]}>
                  {opt.label}
                </Text>
                <Text style={s.cardDesc}>{opt.desc}</Text>
              </View>
              {active && (
                <View style={[s.check, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={13} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingTop: 8 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  gap: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 16,
    gap: 14,
    position: "relative",
    ...Shadow.card,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  cardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  cardDesc: { fontSize: 12, color: Colors.textMuted, lineHeight: 17 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
