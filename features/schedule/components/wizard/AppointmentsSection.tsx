import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";

import { formatTime, appointmentLabel } from "../../utils/wizardHelpers";
import { TimeRow } from "@/components/TimeRow";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, StyleSheet, TextInput } from "react-native";
import { APPOINTMENT_TYPES } from "../../contants/wizardOptions";
import { UseAppointmentsStateType } from "../../hooks/useAppointments";

export function AppointmentsSection({
  appointments,
  apptDraft,
  patchAppt,
  showDraft,
  hideDraft,
  commitAppointment,
  removeAppointment,
}: UseAppointmentsStateType) {
  return (
    <View style={s.body}>
      {/* ── Appointments ─────────────────────────────────────────────── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionLabel}>
            Appointments <Text style={s.optional}>(optional)</Text>
          </Text>
          {!apptDraft.visible && (
            <TouchableOpacity
              style={s.addBtn}
              onPress={showDraft}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={14} color={Colors.accent} />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Committed appointments */}
        {appointments.map((appt) => {
          const meta = APPOINTMENT_TYPES.find((t) => t.key === appt.type)!;
          return (
            <View key={appt.id} style={s.apptCard}>
              <View style={s.apptIcon}>
                <Ionicons name={meta.icon} size={16} color={Colors.accent} />
              </View>
              <View style={s.apptBody}>
                <Text style={s.apptTitle}>{appointmentLabel(appt)}</Text>
                <Text style={s.apptTime}>
                  {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeAppointment(appt.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Draft form */}
        {apptDraft.visible && (
          <View style={s.draftCard}>
            {/* Type chips */}
            <Text style={s.draftFieldLabel}>Type</Text>
            <View style={s.chipRow}>
              {APPOINTMENT_TYPES.map((t) => {
                const active = apptDraft.type === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[s.chip, active && s.chipActive]}
                    onPress={() => patchAppt({ type: t.key })}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={t.icon}
                      size={13}
                      color={active ? Colors.accent : Colors.textMuted}
                    />
                    <Text style={[s.chipText, active && s.chipTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom label */}
            {apptDraft.type === "custom" && (
              <>
                <Text style={[s.draftFieldLabel, { marginTop: 12 }]}>
                  Label
                </Text>
                <View style={s.inputRow}>
                  <Ionicons
                    name="create-outline"
                    size={15}
                    color={Colors.textMuted}
                  />
                  <TextInput
                    style={s.inputField}
                    value={apptDraft.customLabel}
                    onChangeText={(t) => patchAppt({ customLabel: t })}
                    placeholder="e.g. Gym, Therapy, Errand..."
                    placeholderTextColor={Colors.textMuted}
                    returnKeyType="done"
                  />
                </View>
              </>
            )}

            {/* Time block */}
            <Text style={[s.draftFieldLabel, { marginTop: 12 }]}>
              Time Block
            </Text>
            <View style={{ gap: 16 }}>
              <TimeRow
                label="Start"
                icon="play-circle-outline"
                time={apptDraft.startTime}
                onPress={() => patchAppt({ showStartPicker: true })}
              />
              <TimeRow
                label="End"
                icon="stop-circle-outline"
                time={apptDraft.endTime}
                onPress={() => patchAppt({ showEndPicker: true })}
              />
            </View>
            {apptDraft.showStartPicker && (
              <DateTimePicker
                value={apptDraft.startTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  patchAppt({ showStartPicker: false });
                  if (d) patchAppt({ startTime: d });
                }}
              />
            )}
            {apptDraft.showEndPicker && (
              <DateTimePicker
                value={apptDraft.endTime}
                mode="time"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, d) => {
                  patchAppt({ showEndPicker: false });
                  if (d) patchAppt({ endTime: d });
                }}
              />
            )}

            {/* Actions */}
            <View style={s.draftActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={hideDraft}
                activeOpacity={0.8}
              >
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.confirmBtn}
                onPress={commitAppointment}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark" size={15} color={Colors.white} />
                <Text style={s.confirmText}>Add Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {appointments.length === 0 && !apptDraft.visible && (
          <Text style={s.empty}>No appointments added yet.</Text>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  body: { paddingTop: 8 },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
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
  apptCard: {
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
  apptIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  apptBody: { flex: 1 },
  apptTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  apptTime: { fontSize: 12, color: Colors.textMuted },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: Colors.textMuted },
  chipTextActive: { color: Colors.accent },
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
  confirmText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  empty: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: 16,
  },
});
