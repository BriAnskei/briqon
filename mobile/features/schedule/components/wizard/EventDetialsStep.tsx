import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";

import { FormState } from "@/type/NewScheduleTypes";
import { EVENT_TYPES } from "../../contants/wizardOptions";

type Props = {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
};

export function EventDetailsStep({ form, patch }: Props) {
  return (
    <View style={s.body}>
      <Text style={s.title}>What's the occasion?</Text>
      <Text style={s.sub}>
        Pick the event type so we can shape your schedule around it.
      </Text>

      <View style={s.grid}>
        {EVENT_TYPES.map((opt) => {
          const active = form.eventType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                s.card,
                active && {
                  borderColor: opt.color,
                  backgroundColor: opt.color + "14",
                },
              ]}
              onPress={() => patch({ eventType: opt.key })}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.cardIcon,
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
              <Text style={[s.cardLabel, active && { color: opt.color }]}>
                {opt.label}
              </Text>
              {active && (
                <View style={[s.check, { backgroundColor: opt.color }]}>
                  <Ionicons name="checkmark" size={10} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {form.eventType === "other" && (
        <View style={s.otherSection}>
          <Text style={s.fieldLabel}>Describe the event</Text>
          <View style={s.inputRow}>
            <Ionicons
              name="pencil-outline"
              size={15}
              color={Colors.textMuted}
            />
            <TextInput
              style={s.inputField}
              value={form.eventOtherLabel}
              onChangeText={(t) => patch({ eventOtherLabel: t })}
              placeholder="e.g. Family reunion, Office party, Graduation..."
              placeholderTextColor={Colors.textMuted}
              returnKeyType="done"
              autoFocus
            />
          </View>
        </View>
      )}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
    minWidth: 88,
    flex: 1,
    position: "relative",
    ...Shadow.card,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  check: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  otherSection: {
    marginTop: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    ...Shadow.card,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inputField: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },
});
