import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StepIndicator } from "@/components/StepIndecator";
import { useTheme } from "@/context/ThemeContext";
import { AppointmentsSection } from "@/features/schedule/components/wizard/AppointmentsSection";
import { BreaksStep } from "@/features/schedule/components/wizard/BreaksStep";
import { EventDetailsStep } from "@/features/schedule/components/wizard/EventDetialsStep";
import { EventItemsStep } from "@/features/schedule/components/wizard/EventItemsStep";
import { EventTimeStep } from "@/features/schedule/components/wizard/EventTimeStep";
import { MealsSection } from "@/features/schedule/components/wizard/MealsSection";
import { PriorityStep } from "@/features/schedule/components/wizard/PriorityStep";
import {
  eventSummaryItems,
  personalSummaryItems,
  SummaryCard,
} from "@/features/schedule/components/wizard/SummaryCard";
import { TimeWindowSettings } from "@/features/schedule/components/wizard/TimeWindowSettings";
import { TypeStep } from "@/features/schedule/components/wizard/TypeStep";
import {
  EVENT_STEP_LABELS,
  PERSONAL_STEP_LABELS,
} from "@/features/schedule/contants/wizardOptions";
import { useWizardForm } from "@/features/schedule/hooks/form/useWizardForm";
import { Colors, Radius, Shadow } from "@/type/theme";

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
      if (w.step === 1) return <EventDetailsStep form={w.form} patch={w.patch} />;
      if (w.step === 2) return <EventTimeStep form={w.form} patch={w.patch} />;
      if (w.step === 3) return <EventItemsStep {...w.eventItemsState} />;
    } else {
      if (w.step === 1) return <TimeWindowSettings form={w.form} patch={w.patch} />;
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
        <TouchableOpacity style={s.backBtn} onPress={w.handleBack} activeOpacity={0.7}>
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
                  <SummaryCard items={personalSummaryItems(w.personalSummary)} />
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
        root: { flex: 1, backgroundColor: colors.bg },

        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24, // px-6
          paddingVertical: 8, // py-2
          // Transparent background + no border per spec
        },
        backBtn: {
          width: 38,
          height: 38,
          borderRadius: Radius.md,
          backgroundColor: colors.bgElevated,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
        },
        headerCenter: { alignItems: "center" },
        headerTitle: {
          fontSize: 24,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
        },
        headerSub: {
          fontSize: 11,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 2,
        },

        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: 24, paddingTop: 8 },

        footer: {
          paddingHorizontal: 24,
          paddingTop: 14,
          paddingBottom: 8,
          backgroundColor: colors.bgCard,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        nextBtn: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          backgroundColor: colors.accent,
          borderRadius: 12, // py-3 spec
          paddingVertical: 12,
          ...Shadow.accent,
        },
        nextBtnDisabled: { opacity: 0.35 },
        nextBtnText: {
          fontSize: 14,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.white,
          letterSpacing: 0.2,
        },
      }),
    [colors],
  );
}
