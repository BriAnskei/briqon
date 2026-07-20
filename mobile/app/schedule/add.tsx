import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radius, Shadow } from "@/type/theme";
import { useWizardForm } from "@/features/schedule/hooks/useWizardForm";

import { TypeStep } from "@/features/schedule/components/wizard/TypeStep";
import { TimeWindowSettings } from "@/features/schedule/components/wizard/TimeWindowSettings";
import { BreaksStep } from "@/features/schedule/components/wizard/BreaksStep";
import { PriorityStep } from "@/features/schedule/components/wizard/PriorityStep";
import { AppointmentsSection } from "@/features/schedule/components/wizard/AppointmentsSection";
import { MealsSection } from "@/features/schedule/components/wizard/MealsSection";

import { EventTimeStep } from "@/features/schedule/components/wizard/EventTimeStep";
import { EventItemsStep } from "@/features/schedule/components/wizard/EventItemsStep";
import { StepIndicator } from "@/components/StepIndecator";
import { EventDetailsStep } from "@/features/schedule/components/wizard/EventDetialsStep";
import {
  SummaryCard,
  personalSummaryItems,
  eventSummaryItems,
} from "@/features/schedule/components/wizard/SummaryCard";
import {
  EVENT_STEP_LABELS,
  PERSONAL_STEP_LABELS,
} from "@/features/schedule/contants/wizardOptions";

export default function AddScheduleScreen() {
  const s = useSStyles();
  const w = useWizardForm();
  const stepLabels = w.isEvent ? EVENT_STEP_LABELS : PERSONAL_STEP_LABELS;

  const renderStep = () => {
    if (w.step === 0)
      return (
        <TypeStep
          scheduleType={w.form.scheduleType}
          onChange={(v) => w.patch({ scheduleType: v })}
        />
      );

    if (w.isEvent) {
      if (w.step === 1)
        return <EventDetailsStep form={w.form} patch={w.patch} />;
      if (w.step === 2) return <EventTimeStep form={w.form} patch={w.patch} />;
      if (w.step === 3) return <EventItemsStep {...w.eventItemsState} />;
    } else {
      if (w.step === 1)
        return <TimeWindowSettings form={w.form} patch={w.patch} />;
      if (w.step === 2) return <AppointmentsSection {...w.apptState} />;
      if (w.step === 3) return <MealsSection {...w.mealsState} />;
      if (w.step === 4)
        return (
          <BreaksStep
            breakFrequency={w.form.breakFrequency}
            onChange={(v) => w.patch({ breakFrequency: v })}
          />
        );
      if (w.step === 5) return <PriorityStep form={w.form} patch={w.patch} />;
    }
  };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={w.handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {w.step === 0 ? (
            <Text style={s.headerTitle}>Choose a schedule type</Text>
          ) : (
            <>
              <Text style={s.headerTitle}>New Schedule</Text>
              <Text style={s.headerSub}>
                Step {w.step + 1} of {w.totalSteps}
              </Text>
            </>
          )}
        </View>
        {/* Spacer to keep title centred */}
        <View style={{ width: 38 }} />
      </View>

      {/* ── Step indicator (hidden on the type-selection step) ──────────── */}
      {w.step > 0 && <StepIndicator step={w.step - 1} labels={stepLabels} />}

      {/* ── Content ────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {w.step > 0 &&
            (w.isEvent
              ? w.eventSummary && (
                  <SummaryCard items={eventSummaryItems(w.eventSummary)} />
                )
              : w.personalSummary && (
                  <SummaryCard
                    items={personalSummaryItems(w.personalSummary)}
                  />
                ))}
          {renderStep()}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer CTA ─────────────────────────────────────────────────── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.nextBtn, !w.canProceed() && s.nextBtnDisabled]}
          onPress={w.handleNext}
          disabled={!w.canProceed()}
          activeOpacity={0.85}
        >
          <Text style={s.nextBtnText}>
            {w.isLastStep() ? "Generate Schedule" : "Continue"}
          </Text>
          <Ionicons
            name={w.isLastStep() ? "sparkles-outline" : "arrow-forward"}
            size={18}
            color={Colors.bg}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.accent,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.bg,
    letterSpacing: 0.2,
  },
}),
    [colors],
  );
};
