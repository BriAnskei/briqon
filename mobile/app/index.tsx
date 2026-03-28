import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Colors, Radius, Shadow } from "../type/theme";
import { useIndexGenerateInput } from "@/hooks/index/useIndexInput";

export default function HomeScreen() {
  const {
    prompt,
    setPrompt,
    isFocused,
    setIsFocused,
    canGenerate,
    loading,
    handleExamplePrompt,
    handleGenerate,
    generateButtonScale,
  } = useIndexGenerateInput();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={styles.topBar}>
          <Text style={styles.brandName}>Briqon</Text>
          <Text style={styles.brandTagline}>AI Smart Alarm Scheduling</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{"Plan your\nperfect day."}</Text>
          <Text style={styles.heroBody}>
            Describe your day in plain language — schedule and alarms set
            automatically.
          </Text>
        </View>

        {/* Prompt input */}
        <View style={[styles.inputCard, isFocused && styles.inputCardActive]}>
          <TextInput
            style={styles.textInput}
            multiline
            placeholder="e.g. I work 6am–3pm, gym for 2 hours after, then study coding..."
            placeholderTextColor={Colors.textMuted}
            value={prompt}
            onChangeText={setPrompt}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            textAlignVertical="top"
            editable={!loading}
          />
          {prompt.length > 0 && !loading && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setPrompt("")}
            >
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Example shortcut */}
        {!loading && (
          <TouchableOpacity
            style={styles.exampleRow}
            onPress={handleExamplePrompt}
            activeOpacity={0.7}
          >
            <Text style={styles.exampleText}>Try an example prompt</Text>
          </TouchableOpacity>
        )}

        {/* Loading indicator — spinner + label only */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.loadingText}>Building your schedule…</Text>
          </View>
        )}

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: generateButtonScale }] }}>
          <TouchableOpacity
            style={[
              styles.generateBtn,
              (!canGenerate || loading) && styles.generateBtnDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!canGenerate || loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.textMuted} />
            ) : (
              <Text
                style={[
                  styles.generateBtnText,
                  !canGenerate && styles.generateBtnTextDim,
                ]}
              >
                Generate Schedule
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {!loading && (
          <Text style={styles.footerDisclaimer}>Alarms stay on-device</Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 28, paddingTop: 72, paddingBottom: 52 },

  topBar: { marginBottom: 52 },
  brandName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  brandTagline: { fontSize: 13, color: Colors.textMuted },

  heroSection: { marginBottom: 40 },
  heroTitle: {
    fontSize: 38,
    fontWeight: "800",
    color: Colors.textPrimary,
    lineHeight: 47,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  heroBody: { fontSize: 15, color: Colors.textSecondary, lineHeight: 24 },

  inputCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 16,
  },
  inputCardActive: { borderColor: Colors.accent + "80" },
  textInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    minHeight: 120,
    lineHeight: 24,
  },
  clearBtn: { alignSelf: "flex-end", paddingTop: 10 },
  clearBtnText: { fontSize: 12, color: Colors.textMuted },

  exampleRow: { marginBottom: 40, paddingVertical: 4 },
  exampleText: { fontSize: 14, color: Colors.accent },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 40,
    paddingVertical: 4,
  },
  loadingText: { fontSize: 14, color: Colors.textSecondary },

  generateBtn: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    ...Shadow.accent,
  },
  generateBtnDisabled: {
    backgroundColor: Colors.bgElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateBtnText: { fontSize: 16, fontWeight: "700", color: Colors.white },
  generateBtnTextDim: { color: Colors.textMuted },

  footerDisclaimer: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
