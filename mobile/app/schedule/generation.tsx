import { useTheme } from "@/context/ThemeContext";
import { useMemo } from "react";
import { ErrorCard } from "@/features/schedule/components/GenerateScheduleScreen/components/ErrorCard";
import { GenerationFooter } from "@/features/schedule/components/GenerateScheduleScreen/components/GenerationFooter";
import { GenerationProgress } from "@/features/schedule/components/GenerateScheduleScreen/components/GenerationProgress";
import { RegenerateCard } from "@/features/schedule/components/GenerateScheduleScreen/components/RegenerateCard";
import { ScheduleTimeline } from "@/features/schedule/components/GenerateScheduleScreen/components/ScheduleTimeline";
import { ScreenHeader } from "@/features/schedule/components/GenerateScheduleScreen/components/ScreenHeader";
import { SummaryCard } from "@/features/schedule/components/GenerateScheduleScreen/components/SummaryCard";

import { Colors } from "@/type/theme";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGenerateScheduleScreen } from "@/features/schedule/hooks/generation/useGenerateScheduleScreen";
import { SaveScheduleModal } from "@/features/schedule/components/GenerateScheduleScreen/modal/SaveScheduleModal";

export default function GenerateScheduleScreen() {
  const s = useSStyles();
  const router = useRouter();
  const {
    handleRegenerate,
    completedSteps,
    result,
    error,
    isGenerating,
    saveScheduleModalState,
    resetSteps
  } = useGenerateScheduleScreen();

  const [showRegenerateCard, setShowRegenerateCard] = useState(false);
  useEffect(() => {
    if (!isGenerating) {
      setShowRegenerateCard(false);
      return;
    }
    const t = setTimeout(() => setShowRegenerateCard(true), 3000);
    return () => clearTimeout(t);
  }, [isGenerating]);

  const handleGoHome = () => {
    resetSteps()
    router.replace("/");
  };

  const handleBackToForm = () => {
    resetSteps()
    router.back();
  };

  const handleSetActive = () => { };

  return (
    <SafeAreaView style={s.root} edges={["top", "bottom"]}>
      <ScreenHeader onBack={handleBackToForm} onHome={handleGoHome} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isGenerating && !error && (
          <GenerationProgress completedSteps={completedSteps} />
        )}

        {error && <ErrorCard error={error} onRetry={handleRegenerate} />}

        {!isGenerating && result && (
          <View style={s.resultSection}>
            {showRegenerateCard && (
              <RegenerateCard
                onRegenerate={handleRegenerate}
                isGenerating={isGenerating}
              />
            )}

            <SummaryCard
              summaries={result.summary}
              subSummaries={result.subSummary}
            />

            <ScheduleTimeline schedule={result.schedule} />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {!isGenerating && result && (
        <GenerationFooter
          onSave={saveScheduleModalState.openSaveSchedModal}
          onSetActive={handleSetActive}
        />
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

      {/* <SetActiveModal
        visible={setActiveModalVisible}
        onClose={() => setSetActiveModalVisible(false)}
      /> */}
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
        scrollContent: { paddingHorizontal: 20, paddingTop: 20 },

        resultSection: { marginTop: 20, gap: 20 },
      }),
    [colors],
  );
}
