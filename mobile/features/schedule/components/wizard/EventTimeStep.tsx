import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Radius, Shadow } from "@/type/theme";
import { durationText } from "../../utils/wizardHelpers";
import { TimeRow } from "@/components/TimeRow";
import { FormState, EventItemDraft } from "@/type/NewScheduleTypes";

type Props = {
  form: FormState;
  patch: (p: Partial<FormState>) => void;
  eventItemDraft: EventItemDraft;
  patchEventItem: (p: Partial<EventItemDraft>) => void;
  commitEventItem: () => void;
  removeEventItem: (id: string) => void;
};

export function EventTimeStep({
  form,
  patch,
  eventItemDraft,
  patchEventItem,
  commitEventItem,
  removeEventItem,
}: Props) {
  return (
    <View style={s.body}>
      <Text style={s.title}>Time & schedule</Text>
      <Text style={s.sub}>
        Set when the event runs and add any key segments you'd like included.
      </Text>

      {/* ── Time pickers ──────────────────────────────────────────────── */}
      <View style={s.gap16}>
        <TimeRow
          label="Start Time"
          icon="play-circle-outline"
          time={form.startTime}
          onPress={() => patch({ showStartPicker: true })}
        />
        <TimeRow
          label="End Time"
          icon="stop-circle-outline"
          time={form.endTime}
          onPress={() => patch({ showEndPicker: true })}
        />
      </View>

      {form.showStartPicker && (
        <DateTimePicker
          value={form.startTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showStartPicker: false });
            if (d) patch({ startTime: d });
          }}
        />
      )}
      {form.showEndPicker && (
        <DateTimePicker
          value={form.endTime}
          mode="time"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, d) => {
            patch({ showEndPicker: false });
            if (d) patch({ endTime: d });
          }}
        />
      )}

      <View style={s.durationHint}>
        <Ionicons name="hourglass-outline" size={14} color={Colors.textMuted} />
        <Text style={s.durationText}>
          {durationText(form.startTime, form.endTime)}
        </Text>
      </View>

      {/* ── Schedule items ────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <View>
            <Text style={s.sectionLabel}>
              Schedule Items <Text style={s.optional}>(optional)</Text>
            </Text>
            <Text style={s.sectionSub}>
              Key segments the AI should build around
            </Text>
          </View>
          {!eventItemDraft.visible && (
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => patchEventItem({ visible: true })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color={Colors.accent} />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Committed items */}
        {form.eventScheduleItems.map((item) => (
          <View key={item.id} style={s.itemCard}>
            <View style={s.itemIcon}>
              <Ionicons name="list-outline" size={16} color={Colors.accent} />
            </View>
            <View style={s.itemBody}>
              <Text style={s.itemTitle}>{item.name}</Text>
              {item.duration !== "" && (
                <Text style={s.itemSub}>{item.duration}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => removeEventItem(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle-outline"
                size={20}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        ))}

        {/* Draft form */}
        {eventItemDraft.visible && (
          <View style={s.draftCard}>
            <Text style={s.draftFieldLabel}>Item Name</Text>
            <View style={s.inputRow}>
              <Ionicons
                name="create-outline"
                size={15}
                color={Colors.textMuted}
              />
              <TextInput
                style={s.inputField}
                value={eventItemDraft.name}
                onChangeText={(t) => patchEventItem({ name: t })}
                placeholder="e.g. Opening ceremony, Keynote, Dinner..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="next"
                autoFocus
              />
            </View>

            <Text style={[s.draftFieldLabel, { marginTop: 12 }]}>
              Duration <Text style={s.optional}>(optional)</Text>
            </Text>
            <View style={s.inputRow}>
              <Ionicons
                name="time-outline"
                size={15}
                color={Colors.textMuted}
              />
              <TextInput
                style={s.inputField}
                value={eventItemDraft.duration}
                onChangeText={(t) => patchEventItem({ duration: t })}
                placeholder="e.g. 30 min, 1 hr, 2 hours..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="done"
              />
            </View>

            <View style={s.draftActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => patchEventItem({ visible: false })}
                activeOpacity={0.8}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.confirmBtn,
                  !eventItemDraft.name.trim() && s.confirmBtnDisabled,
                ]}
                onPress={commitEventItem}
                disabled={!eventItemDraft.name.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={15} color={Colors.white} />
                <Text style={s.confirmText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {form.eventScheduleItems.length === 0 && !eventItemDraft.visible && (
          <Text style={s.empty}>
            No items added — the AI will build the full schedule for you.
          </Text>
        )}
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
  gap16: { gap: 16 },
  durationHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 16,
    paddingHorizontal: 4,
  },
  durationText: { fontSize: 12, color: Colors.textMuted },

  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  sectionSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  optional: { fontWeight: "400", color: Colors.textMuted },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
  },
  addBtnText: { fontSize: 12, fontWeight: "700", color: Colors.accent },

  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
    marginBottom: 8,
    ...Shadow.card,
  },
  itemIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  itemBody: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  itemSub: { fontSize: 12, color: Colors.textMuted },

  draftCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent + "40",
    padding: 16,
    gap: 4,
    marginBottom: 8,
    ...Shadow.card,
  },
  draftFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textMuted,
    marginBottom: 6,
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
  draftActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelText: { fontSize: 13, fontWeight: "600", color: Colors.textMuted },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.md,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  confirmBtnDisabled: { opacity: 0.35 },
  confirmText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
});
