import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Colors, Radius, Shadow } from "@/type/theme";
import { SetActiveModal } from "@/features/schedule-conversation/components/review/modal/SetActiveModel";
import { ScheduleListItem } from "@/features/schedule-conversation/components/review/ScheduleListItem";
import { useScheduleReview } from "@/features/schedule-conversation/hooks/review/userScheduleReview";

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const {
    scheduleItems, // ← real items from the selected conversation block
    modalVisible,
    openModal,
    closeModal,
    handleSave,
    handleConfirmActive,
    goBack,
  } = useScheduleReview();

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Review Schedule</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* ── Schedule list ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel}>Schedule Preview</Text>
        <View style={s.card}>
          {scheduleItems.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No schedule selected.</Text>
            </View>
          ) : (
            scheduleItems.map((item, index) => (
              <ScheduleListItem key={index} item={item} index={index} />
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Bottom action bar ── */}
      <View
        style={[
          s.btnBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
        ]}
      >
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={s.saveBtnText}>Save Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.activeBtn}
          onPress={openModal}
          activeOpacity={0.88}
        >
          <Text style={s.activeBtnText}>Set as Active</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal ── */}
      <SetActiveModal
        visible={modalVisible}
        onClose={closeModal}
        onConfirm={handleConfirmActive}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backIcon: { fontSize: 22, color: Colors.textSecondary },
  headerTitle: { fontSize: 16, fontWeight: "600", color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  btnBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgElevated,
  },
  saveBtnText: { fontSize: 14, fontWeight: "600", color: Colors.textSecondary },
  activeBtn: {
    flex: 2,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
    backgroundColor: Colors.accent,
    ...Shadow.accent,
  },
  activeBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});
