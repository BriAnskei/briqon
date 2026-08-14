import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import { ErrorCard } from "@/features/schedule/components/GenerateScheduleScreen/components/ErrorCard";
import { GenerationFooter } from "@/features/schedule/components/GenerateScheduleScreen/components/GenerationFooter";
import { GenerationProgress } from "@/features/schedule/components/GenerateScheduleScreen/components/GenerationProgress";
import { RegenerateCard } from "@/features/schedule/components/GenerateScheduleScreen/components/RegenerateCard";
import { ScheduleTimeline } from "@/features/schedule/components/GenerateScheduleScreen/components/ScheduleTimeline";
import { ScreenHeader } from "@/features/schedule/components/GenerateScheduleScreen/components/ScreenHeader";
import { SummaryCard } from "@/features/schedule/components/GenerateScheduleScreen/components/SummaryCard";
import { ActivationConflictModal } from "@/features/schedule/components/GenerateScheduleScreen/modal/ActivationConflictModal";
import { SaveScheduleModal } from "@/features/schedule/components/GenerateScheduleScreen/modal/SaveScheduleModal";
import { SetActiveModal } from "@/features/schedule/components/GenerateScheduleScreen/modal/SetActiveModal";
import { useGenerateScheduleScreen } from "@/features/schedule/hooks/generation/useGenerateScheduleScreen";
import { Colors } from "@/type/theme";

export default function GenerateScheduleScreen() {
  const s = useSStyles();
  const {
    handleRegenerate,
    completedSteps,
    result,
    error,
    isGenerating,
    saveScheduleModalState,
    setActiveModalState,
    showRegenerateCard,

    handleBackToForm,
    handleGoHome,
    handleSetActive,
    handleSaveSchedule,
  } = useGenerateScheduleScreen();

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <ScreenHeader onBack={handleBackToForm} onHome={handleGoHome} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isGenerating && !error && <GenerationProgress completedSteps={completedSteps} />}

        {error && !isGenerating && <ErrorCard error={error} onRetry={handleRegenerate} />}

        {!isGenerating && result && (
          <View style={s.resultSection}>
            {showRegenerateCard && (
              <RegenerateCard
                onRegenerate={handleRegenerate}
                isGenerating={isGenerating}
              />
            )}

            <SummaryCard summaries={result.summary} subSummaries={result.subSummary} />

            <ScheduleTimeline schedule={result.schedule} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {!isGenerating && result && (
        <GenerationFooter onSave={handleSaveSchedule} onSetActive={handleSetActive} />
      )}

      {/*Modals*/}
      <SaveScheduleModal
        visible={saveScheduleModalState.isSaveModalOpen}
        onClose={saveScheduleModalState.closeSaveSchedModal}
        handleSave={saveScheduleModalState.handleSaveSchedule}
        setName={saveScheduleModalState.setName}
        name={saveScheduleModalState.name}
        isSaving={saveScheduleModalState.isSaving}
      />

      <SetActiveModal {...setActiveModalState} />
      <ActivationConflictModal {...setActiveModalState} />
    </SafeAreaView>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: Colors.bg },

        scroll: { flex: 1 },
        scrollContent: { paddingHorizontal: 24, paddingTop: 20 },

        resultSection: { marginTop: 20, gap: 20 },
      }),
    [colors],
  );
}
