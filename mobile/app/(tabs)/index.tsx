import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "../../type/theme";
import { useRouter } from "expo-router";

// ─── Category Colors ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  wake: "#FFB547",
  work: "#7B6FFF",
  fitness: "#1FD8A0",
  study: "#5BB8FF",
  meal: "#C084FC",
  rest: "#64748B",
  "wind-down": "#FF8C69",
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SCHEDULE = {
  name: "Workday Grind",
  alarms: [
    {
      id: "1",
      activity: "Wake Up & Morning Routine",
      startTime: "05:30 AM",
      endTime: "06:00 AM",
      category: "wake",
      alarmEnabled: true,
    },
    {
      id: "2",
      activity: "Work Shift",
      startTime: "06:00 AM",
      endTime: "03:00 PM",
      category: "work",
      alarmEnabled: false,
    },
    {
      id: "3",
      activity: "Gym Session",
      startTime: "03:30 PM",
      endTime: "05:30 PM",
      category: "fitness",
      alarmEnabled: true,
    },
    {
      id: "4",
      activity: "Dinner & Wind Down",
      startTime: "06:00 PM",
      endTime: "07:00 PM",
      category: "meal",
      alarmEnabled: true,
    },
    {
      id: "5",
      activity: "Study / Coding",
      startTime: "07:30 PM",
      endTime: "09:30 PM",
      category: "study",
      alarmEnabled: true,
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Alarm = (typeof MOCK_SCHEDULE.alarms)[0];

// ─── AlarmRow ─────────────────────────────────────────────────────────────────

function AlarmRow({
  alarm,
  index,
  onToggle,
}: {
  alarm: Alarm;
  index: number;
  onToggle: (id: string) => void;
}) {
  const color = CATEGORY_COLORS[alarm.category] ?? Colors.textMuted;

  return (
    <View style={[s.alarmRow, !alarm.alarmEnabled && s.alarmRowDim]}>
      <View style={[s.alarmAccent, { backgroundColor: color }]} />
      <Text style={s.alarmIndex}>{String(index + 1).padStart(2, "0")}</Text>
      <View style={s.alarmBody}>
        <Text style={[s.alarmActivity, !alarm.alarmEnabled && s.textDim]}>
          {alarm.activity}
        </Text>
        <View style={s.alarmTimeRow}>
          <View style={[s.alarmTimeDot, { backgroundColor: color }]} />
          <Text style={s.alarmTime}>
            {alarm.startTime} — {alarm.endTime}
          </Text>
        </View>
      </View>
      <Switch
        value={alarm.alarmEnabled}
        onValueChange={() => onToggle(alarm.id)}
        trackColor={{ false: Colors.border, true: Colors.accent + "60" }}
        thumbColor={alarm.alarmEnabled ? Colors.accent : Colors.textMuted}
        ios_backgroundColor={Colors.border}
      />
    </View>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={s.emptyCard}>
      <View style={s.emptyIconWrap}>
        <Ionicons name="alarm-outline" size={28} color={Colors.accent} />
      </View>
      <Text style={s.emptyTitle}>No Schedule Set</Text>
      <Text style={s.emptyBody}>
        You haven't set a schedule for today yet.{"\n"}Tap below to add one.
      </Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onAdd} activeOpacity={0.85}>
        <Text style={s.emptyBtnText}>+ Add Schedule</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── DotMenu ──────────────────────────────────────────────────────────────────

function DotMenu({
  visible,
  onDismiss,
  onTurnOffAll,
  onDelete,
}: {
  visible: boolean;
  onDismiss: () => void;
  onTurnOffAll: () => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={s.menuOverlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={s.menuCard}>
          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              onTurnOffAll();
              onDismiss();
            }}
            activeOpacity={0.75}
          >
            <View
              style={[s.menuIconWrap, { backgroundColor: Colors.warningSoft }]}
            >
              <Ionicons
                name="notifications-off-outline"
                size={18}
                color={Colors.warning}
              />
            </View>
            <View style={s.menuItemBody}>
              <Text style={s.menuItemLabel}>Turn Off All Alarms</Text>
              <Text style={s.menuItemSub}>
                Disable every alarm in this schedule
              </Text>
            </View>
          </TouchableOpacity>

          <View style={s.menuDivider} />

          <TouchableOpacity
            style={s.menuItem}
            onPress={() => {
              onDelete();
              onDismiss();
            }}
            activeOpacity={0.75}
          >
            <View
              style={[s.menuIconWrap, { backgroundColor: Colors.dangerSoft }]}
            >
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </View>
            <View style={s.menuItemBody}>
              <Text style={[s.menuItemLabel, { color: Colors.danger }]}>
                Delete Schedule
              </Text>
              <Text style={s.menuItemSub}>Remove today's active schedule</Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();
  const [hasSchedule, setHasSchedule] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [alarms, setAlarms] = useState(MOCK_SCHEDULE.alarms);

  const enabledCount = alarms.filter((a) => a.alarmEnabled).length;

  const handleToggle = (id: string) =>
    setAlarms((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, alarmEnabled: !a.alarmEnabled } : a,
      ),
    );

  const handleTurnOffAll = () =>
    setAlarms((prev) => prev.map((a) => ({ ...a, alarmEnabled: false })));

  const handleDelete = () => setHasSchedule(false);

  return (
    <View style={s.root}>
      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.brandName}>Briqon</Text>
          <Text style={s.brandTagline}>Smart Alarm Scheduling</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity style={s.headerBtn} activeOpacity={0.75}>
            <Ionicons
              name="menu-outline"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.headerBtn, s.headerBtnAccent]}
            onPress={() => router.push("/schedule/add")}
            activeOpacity={0.75}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Body ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.sectionRow}>
          <View>
            <Text style={s.sectionTitle}>Today's Schedule</Text>
            <Text style={s.sectionDate}>{getTodayLabel()}</Text>
          </View>
          {hasSchedule && (
            <TouchableOpacity
              style={s.dotMenuBtn}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={16}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {hasSchedule && (
          <View style={s.pillRow}>
            <View style={s.namePill}>
              <View style={s.namePillDot} />
              <Text style={s.namePillText}>{MOCK_SCHEDULE.name}</Text>
            </View>
            <View style={[s.countPill, enabledCount === 0 && s.countPillOff]}>
              <Text
                style={[
                  s.countPillText,
                  enabledCount === 0 && { color: Colors.textMuted },
                ]}
              >
                {enabledCount}/{alarms.length} alarms on
              </Text>
            </View>
          </View>
        )}

        {hasSchedule ? (
          <View style={s.alarmList}>
            {alarms.map((alarm, i) => (
              <AlarmRow
                key={alarm.id}
                alarm={alarm}
                index={i}
                onToggle={handleToggle}
              />
            ))}
          </View>
        ) : (
          <EmptyState onAdd={() => router.push("/schedule/add")} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Dot Menu ── */}
      <DotMenu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        onTurnOffAll={handleTurnOffAll}
        onDelete={handleDelete}
      />

      {/* ⛔ No BottomTabBar here — (tabs)/_layout.tsx owns it */}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 62 : 44,
    paddingBottom: 16,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.accent,
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnAccent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    ...Shadow.accent,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  sectionDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    letterSpacing: 0.1,
  },
  dotMenuBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  namePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  namePillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  namePillText: { fontSize: 13, fontWeight: "600", color: Colors.accent },
  countPill: {
    backgroundColor: Colors.successSoft,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.success + "40",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countPillOff: {
    backgroundColor: Colors.bgElevated,
    borderColor: Colors.border,
  },
  countPillText: { fontSize: 12, color: Colors.success, fontWeight: "600" },
  alarmList: { gap: 8 },
  alarmRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    paddingRight: 14,
    gap: 12,
    ...Shadow.card,
  },
  alarmRowDim: { opacity: 0.45 },
  alarmAccent: { width: 3, alignSelf: "stretch" },
  alarmIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    minWidth: 20,
  },
  alarmBody: { flex: 1, paddingVertical: 14 },
  alarmActivity: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 5,
  },
  textDim: { color: Colors.textMuted },
  alarmTimeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  alarmTimeDot: { width: 5, height: 5, borderRadius: 3 },
  alarmTime: { fontSize: 12, color: Colors.textMuted },
  emptyCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    paddingVertical: 56,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  emptyIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: Colors.accentGlow,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
  },
  emptyBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: 28,
    paddingVertical: 13,
    ...Shadow.accent,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: Platform.OS === "ios" ? 120 : 100,
    paddingRight: 20,
  },
  menuCard: {
    backgroundColor: Colors.bgModal,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 252,
    overflow: "hidden",
    ...Shadow.card,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  menuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemBody: { flex: 1 },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuItemSub: { fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});
