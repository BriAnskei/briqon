import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Radius, Shadow } from "@/type/theme";

import * as z from "zod";
import { SetActiveModal } from "@/features/schedule-conversation/components/review/modal/SetActiveModal";
import { CreateActiveSchedule } from "@/src/models/active_schedule.model";
import { CreateSchedule } from "@/src/models/schedule.model";

type ScheduleResult = z.infer<any>;

const MOCK_RESULT: ScheduleResult = {
  summary: {
    categories: [
      { name: "Coding", total: "11 hours", total_minutes: 660 },
      {
        name: "Meals",
        total: "2 hr 50 min",
        total_minutes: 170,
        sub_activity: [
          { name: "Breakfast", total: "1 hr 5 min", total_minutes: 65 },
          { name: "Lunch", total: "45 min", total_minutes: 45 },
          { name: "Dinner", total: "45 min", total_minutes: 45 },
          { name: "Snack", total: "15 min", total_minutes: 15 },
        ],
      },
      {
        name: "Education",
        total: "2 hours",
        total_minutes: 120,
        sub_activity: [
          { name: "School / Class", total: "2 hours", total_minutes: 120 },
        ],
      },
      { name: "Breaks", total: "1 hr 25 min", total_minutes: 85 },
      {
        name: "Personal Time",
        total: "45 min",
        total_minutes: 45,
        sub_activity: [
          {
            name: "Wind Down / Prepare for Bed",
            total: "45 min",
            total_minutes: 45,
          },
        ],
      },
    ],
  },
  schedule: [
    { start_time: "06:00", end_time: "07:05", activity: "Breakfast" },
    { start_time: "07:05", end_time: "08:25", activity: "Coding" },
    { start_time: "08:25", end_time: "08:35", activity: "Break" },
    { start_time: "08:35", end_time: "09:55", activity: "Coding" },
    { start_time: "09:55", end_time: "10:05", activity: "Break" },
    { start_time: "10:05", end_time: "11:25", activity: "Coding" },
    { start_time: "11:25", end_time: "11:35", activity: "Break" },
    { start_time: "11:35", end_time: "12:20", activity: "Lunch" },
    { start_time: "12:20", end_time: "13:00", activity: "Coding" },
    { start_time: "13:00", end_time: "15:00", activity: "School / Class" },
    { start_time: "15:00", end_time: "15:10", activity: "Break" },
    { start_time: "15:10", end_time: "16:30", activity: "Coding" },
    { start_time: "16:30", end_time: "16:45", activity: "Snack" },
    { start_time: "16:45", end_time: "17:45", activity: "Coding" },
    { start_time: "17:45", end_time: "17:55", activity: "Break" },
    { start_time: "17:55", end_time: "18:40", activity: "Dinner" },
    { start_time: "18:40", end_time: "20:00", activity: "Coding" },
    { start_time: "20:00", end_time: "20:10", activity: "Break" },
    { start_time: "20:10", end_time: "21:30", activity: "Coding" },
    { start_time: "21:30", end_time: "21:40", activity: "Break" },
    { start_time: "21:40", end_time: "23:00", activity: "Coding" },
    { start_time: "23:00", end_time: "23:15", activity: "Break" },
    {
      start_time: "23:15",
      end_time: "00:00",
      activity: "Wind Down / Prepare for Bed",
    },
  ],
};

function mockGenerateScheduleRequest(): Promise<{
  success: boolean;
  res?: ScheduleResult;
  error?: string;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, res: MOCK_RESULT });
    }, 1800);
  });
}

type Step = "sending" | "understanding" | "creating" | "done";

const STEP_LABELS: Record<Step, string> = {
  sending: "Sending request...",
  understanding: "Understanding your request...",
  creating: "Creating your schedule...",
  done: "Done",
};

const STEP_ORDER: Step[] = ["sending", "understanding", "creating"];
const UNDERSTANDING_DELAY = 600;

function useScheduleGeneration() {
  const [completedSteps, setCompletedSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const generate = useCallback(async () => {
    clearTimers();
    setError(null);
    setResult(null);
    setCompletedSteps([]);
    setIsGenerating(true);

    setCompletedSteps(["sending"]);

    await new Promise<void>((resolve) => {
      const t = setTimeout(resolve, UNDERSTANDING_DELAY);
      timers.current.push(t);
    });
    setCompletedSteps((prev) => [...prev, "understanding"]);

    try {
      const response = await mockGenerateScheduleRequest();
      if (response.success && response.res) {
        setCompletedSteps((prev) => [...prev, "creating", "done"]);
        setResult(response.res);
      } else {
        setError(response.error ?? "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setError(err.message ?? "Network error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => clearTimers, []);

  return { generate, completedSteps, result, error, isGenerating };
}

export default function GenerateScheduleScreen() {
  const router = useRouter();
  const { generate, completedSteps, result, error, isGenerating } =
    useScheduleGeneration();

  const isDone = completedSteps.includes("done");
  const [setActiveModalVisible, setSetActiveModalVisible] = useState(false);

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showRegenerateCard, setShowRegenerateCard] = useState(false);
  useEffect(() => {
    if (!isDone) {
      setShowRegenerateCard(false);
      return;
    }
    const t = setTimeout(() => setShowRegenerateCard(true), 3000);
    return () => clearTimeout(t);
  }, [isDone]);

  const handleGoHome = () => {
    router.replace("/");
  };

  const handleBackToForm = () => {
    router.back();
  };

  const handleSave = () => {
    // TODO: wire to your actual save flow using CreateSchedule
  };

  const handleSetActive = () => {
    setSetActiveModalVisible(true);
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.headerIconBtn}
          onPress={handleBackToForm}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Back to form"
        >
          <Ionicons
            name="create-outline"
            size={20}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={s.headerTextGroup}>
          <Text style={s.headerTitle}>Generate Schedule</Text>
          <Text style={s.headerSub}>
            Let AI build your day based on your preferences
          </Text>
        </View>
        <TouchableOpacity
          style={s.headerIconBtn}
          onPress={handleGoHome}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go home"
        >
          <Ionicons name="home-outline" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isDone && !error && (
          <View style={s.progressCard}>
            {STEP_ORDER.map((key) => {
              const done = completedSteps.includes(key);
              const active =
                !done && completedSteps.length === STEP_ORDER.indexOf(key);
              return (
                <View key={key} style={s.stepRow}>
                  {done ? (
                    <View style={s.stepIconDone}>
                      <Ionicons name="checkmark" size={13} color={Colors.bg} />
                    </View>
                  ) : (
                    <View style={s.stepIconPending} />
                  )}
                  <Text style={[s.stepLabel, done && s.stepLabelDone]}>
                    {STEP_LABELS[key]}
                  </Text>
                  {active && (
                    <ActivityIndicator
                      size="small"
                      color={Colors.textSecondary}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        )}

        {error && (
          <View style={s.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={Colors.danger}
            />
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}
        {error && (
          <TouchableOpacity
            style={s.retryBtn}
            onPress={generate}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color={Colors.bg} />
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        )}

        {isDone && result && (
          <View style={s.resultSection}>
            {showRegenerateCard && (
              <View style={s.regenerateCard}>
                <Ionicons
                  name="sparkles-outline"
                  size={18}
                  color={Colors.accent}
                  style={{ marginTop: 1 }}
                />
                <View style={s.regenerateTextGroup}>
                  <Text style={s.regenerateQuote}>
                    Not quite right? Feel free to regenerate, or tweak your
                    preferences and try again — it only takes a moment.
                  </Text>
                  <TouchableOpacity
                    style={s.regenerateBtn}
                    onPress={generate}
                    activeOpacity={0.85}
                    disabled={isGenerating}
                  >
                    <Ionicons
                      name="refresh-outline"
                      size={14}
                      color={Colors.accent}
                    />
                    <Text style={s.regenerateBtnText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={s.summaryCard}>
              <Text style={s.summaryLabel}>Summary</Text>
              <View style={s.categoryList}>
                {result.summary.categories.map((cat, i) => (
                  <View
                    key={cat.name}
                    style={[
                      s.categoryBlock,
                      i !== result.summary.categories.length - 1 &&
                        s.categoryBlockDivider,
                    ]}
                  >
                    <View style={s.categoryHeaderRow}>
                      <Text style={s.categoryName}>{cat.name}</Text>
                      <Text style={s.categoryTotal}>{cat.total}</Text>
                    </View>
                    {cat.sub_activity && cat.sub_activity.length > 0 && (
                      <View style={s.subActivityList}>
                        {cat.sub_activity.map((sub) => (
                          <View key={sub.name} style={s.subActivityRow}>
                            <View style={s.subActivityDot} />
                            <Text style={s.subActivityName}>{sub.name}</Text>
                            <Text style={s.subActivityTotal}>{sub.total}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>

            <Text style={s.timelineTitle}>Your Schedule</Text>
            <View style={s.scheduleList}>
              {result.schedule.map((item, idx) => (
                <View key={idx} style={s.scheduleRow}>
                  <View style={s.scheduleAccent} />
                  <Text style={s.scheduleIndex}>
                    {String(idx + 1).padStart(2, "0")}
                  </Text>
                  <View style={s.scheduleBody}>
                    <Text
                      style={s.scheduleActivity}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.activity}
                    </Text>
                    <Text style={s.scheduleTime} numberOfLines={1}>
                      {item.start_time} – {item.end_time}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {isDone && result && (
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.footerBtn, s.saveBtn]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Ionicons
              name="bookmark-outline"
              size={17}
              color={Colors.textPrimary}
            />
            <Text style={s.saveBtnText}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.footerBtn, s.setActiveBtn]}
            onPress={handleSetActive}
            activeOpacity={0.85}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={17}
              color={Colors.bg}
            />
            <Text style={s.setActiveBtnText}>Set Active</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* <SetActiveModal
        visible={setActiveModalVisible}
        onClose={() => setSetActiveModalVisible(false)}
      /> */}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTextGroup: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

  progressCard: { padding: 18, gap: 14 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepIconDone: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconPending: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  stepLabel: { fontSize: 13, color: Colors.textMuted },
  stepLabelDone: { color: Colors.textPrimary, fontWeight: "600" },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerSoft,
    borderRadius: Radius.md,
    padding: 14,
  },
  errorText: { color: Colors.danger, fontSize: 13, flex: 1 },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    borderRadius: Radius.md,
    paddingVertical: 12,
    marginTop: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.bg },

  resultSection: { marginTop: 20, gap: 20 },

  regenerateCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
    borderRadius: Radius.lg,
    padding: 14,
  },
  regenerateTextGroup: { flex: 1, gap: 10 },
  regenerateQuote: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  regenerateBtnText: { fontSize: 12, fontWeight: "700", color: Colors.accent },

  summaryCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.bgCard,
    padding: 16,
    gap: 12,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  categoryList: { gap: 14 },
  categoryBlock: { gap: 8, paddingBottom: 14 },
  categoryBlockDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  categoryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryName: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  categoryTotal: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },

  subActivityList: { gap: 6, paddingLeft: 4 },
  subActivityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subActivityDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  subActivityName: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  subActivityTotal: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500",
  },

  timelineTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },

  scheduleList: { gap: 12 },
  scheduleRow: {
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
  scheduleAccent: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: Colors.accent,
  },
  scheduleIndex: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    minWidth: 20,
  },
  scheduleBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 18,
  },
  scheduleActivity: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  scheduleTime: { fontSize: 12, color: Colors.textMuted, flexShrink: 0 },

  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 15,
  },
  saveBtn: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  setActiveBtn: { backgroundColor: Colors.accent, ...Shadow.accent },
  setActiveBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.bg,
    letterSpacing: 0.2,
  },
});
