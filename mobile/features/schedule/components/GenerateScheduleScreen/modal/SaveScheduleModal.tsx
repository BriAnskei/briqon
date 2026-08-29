import { useMemo } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Colors, Radius, Shadow } from "@/type/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  handleSave: () => void;
  setName: (input: string) => void;
  name: string;
  isSaving: boolean;
}

export function SaveScheduleModal({
  visible,
  onClose,
  name,
  setName,
  handleSave,
  isSaving,
}: Props) {
  const s = useSStyles();
  const canSave = name.trim().length > 0 && !isSaving;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose} // Android back button — also blocked via handleClose
    >
      <KeyboardAvoidingView
        style={s.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Save schedule</Text>
            <TouchableOpacity
              onPress={onClose}
              style={[s.closeBtn, isSaving && s.closeBtnDisabled]}
              activeOpacity={isSaving ? 1 : 0.8}
              disabled={isSaving}
            >
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Input */}
          <View style={s.body}>
            <Text style={s.label}>Schedule name</Text>
            <TextInput
              style={[s.input, isSaving && s.inputDisabled]}
              placeholder="Enter a schedule name"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoFocus
              editable={!isSaving}
            />
            <Text style={s.hint}>
              {isSaving
                ? "Saving your schedule, please wait…"
                : "Give your schedule a recognisable name so you can find it later."}
            </Text>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <TouchableOpacity
              style={[s.cancelBtn, isSaving && s.cancelBtnDisabled]}
              onPress={onClose}
              activeOpacity={isSaving ? 1 : 0.8}
              disabled={isSaving}
            >
              <Text style={[s.cancelText, isSaving && s.cancelTextDisabled]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, !isSaving && s.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.88}
              disabled={!canSave}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.textMuted} />
              ) : (
                <Text style={[s.saveText, !canSave && s.saveTextDisabled]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function useSStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.60)",
          justifyContent: "flex-end",
        },
        sheet: {
          backgroundColor: colors.bgModal,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          borderTopWidth: 1,
          borderColor: colors.border,
          paddingBottom: Platform.OS === "ios" ? 36 : 20,
        },
        handle: {
          width: 32,
          height: 3,
          borderRadius: 2,
          backgroundColor: colors.border,
          alignSelf: "center",
          marginTop: 12,
          marginBottom: 4,
        },
        header: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 22,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        title: {
          fontSize: 18,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
        },
        closeBtn: {
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.bgElevated,
          alignItems: "center",
          justifyContent: "center",
        },
        closeBtnDisabled: {
          opacity: 0.4,
        },
        closeBtnText: {
          fontSize: 11,
          fontFamily: "DMMono-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
        body: {
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 8,
        },
        label: {
          fontSize: 12,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textMuted,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginBottom: 8,
        },
        input: {
          backgroundColor: colors.bgCard,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 15,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textPrimary,
        },
        inputDisabled: {
          opacity: 0.5,
        },
        hint: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          color: colors.textMuted,
          marginTop: 8,
        },
        actions: {
          flexDirection: "row",
          gap: 10,
          paddingHorizontal: 16,
          paddingTop: 14,
        },
        cancelBtn: {
          flex: 1,
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.lg,
          paddingVertical: 15,
          alignItems: "center",
          borderWidth: 1,
          borderColor: colors.border,
        },
        cancelBtnDisabled: {
          opacity: 0.4,
        },
        cancelText: {
          fontSize: 15,
          fontFamily: "Inter-Medium",
          fontWeight: "500",
          color: colors.textSecondary,
        },
        cancelTextDisabled: { color: colors.textMuted },
        saveBtn: {
          flex: 2,
          backgroundColor: colors.accent,
          borderRadius: Radius.lg,
          paddingVertical: 15,
          alignItems: "center",
          justifyContent: "center",
          ...Shadow.accent,
        },
        saveBtnDisabled: {
          backgroundColor: colors.bgElevated,
          shadowOpacity: 0,
          elevation: 0,
        },
        saveText: {
          fontSize: 15,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.white,
        },
        saveTextDisabled: { color: colors.textMuted },
      }),
    [colors],
  );
}
