import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { Radius } from "@/type/theme";

interface ResolveInfoPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  fromRef: React.RefObject<any>;
}

export function ResolveInfoPopover({
  isOpen,
  onClose,
  fromRef,
}: ResolveInfoPopoverProps) {
  const s = useStyles();
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const hasMeasuredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasMeasuredRef.current = false;
      setPopoverPosition(null);
      return;
    }

    if (hasMeasuredRef.current) return;

    const timer = setTimeout(() => {
      if (!fromRef.current) return;
      fromRef.current.measureInWindow((x: number, y: number) => {
        setPopoverPosition({ x, y });
        hasMeasuredRef.current = true;
      });
    }, 50);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, fromRef]);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        {popoverPosition !== null && (
          <View
            style={[
              s.popover,
              {
                left: Math.max(
                  8,
                  Math.min(
                    popoverPosition.x - 150 + 15,
                    Dimensions.get("window").width - 308,
                  ),
                ),
                top: popoverPosition.y + 30,
              },
            ]}
          >
            {/* Arrow pointing down toward the info button */}
            <View style={s.arrow} />

            <ScrollView
              style={s.scrollView}
              contentContainerStyle={s.content}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={s.title}>How Conflict Resolution Works</Text>

              <Text style={s.bodyText}>
                When you activate a schedule that overlaps with another active schedule,
                Briqon automatically resolves the conflict so that each day belongs to
                only one active schedule.
              </Text>

              <Text style={s.subtitle}>Reorder Days</Text>

              <Text style={s.bodyText}>
                If the existing schedule still has days that don't conflict, only the
                conflicting days are transferred to the new schedule. The remaining days
                stay in the existing schedule.
              </Text>

              <View style={s.example}>
                <Text style={s.label}>Existing Schedule</Text>
                <Text style={s.exampleText}>Mon • Tue • Wed • Thu</Text>

                <Text style={s.label}>New Schedule</Text>
                <Text style={s.exampleText}>Wed • Thu</Text>

                <Text style={s.label}>Result</Text>
                <Text style={s.exampleText}>Existing → Mon • Tue</Text>
                <Text style={s.exampleText}>New → Wed • Thu</Text>
              </View>

              <Text style={s.subtitle}>Remove Empty Schedule</Text>

              <Text style={s.bodyText}>
                If every day in the existing schedule conflicts with the new schedule, the
                existing schedule no longer contains any active days and is automatically
                removed.
              </Text>

              <View style={s.example}>
                <Text style={s.label}>Existing Schedule</Text>
                <Text style={s.exampleText}>Mon • Tue</Text>

                <Text style={s.label}>New Schedule</Text>
                <Text style={s.exampleText}>Mon • Tue</Text>

                <Text style={s.label}>Result</Text>
                <Text style={s.exampleText}>Existing schedule is removed.</Text>
              </View>

              <Text style={s.subtitle}>Selected Days Only</Text>

              <Text style={s.bodyText}>
                If you choose to resolve only specific conflicting days, only those
                selected days are removed from the existing schedule. Any unselected days
                remain active.
              </Text>
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );
}

function useStyles() {
  const { colors } = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        popover: {
          backgroundColor: colors.bgModal,
          borderRadius: Radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          width: 300,
          maxHeight: 400,
          flex: 1,
          position: "absolute",
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },

        backdrop: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.35)",
        },

        arrow: {
          position: "absolute",
          top: -10,
          left: "50%",
          marginLeft: -10,
          width: 0,
          height: 0,
          borderLeftWidth: 10,
          borderRightWidth: 10,
          borderTopWidth: 10,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: colors.bgModal,
        },

        scrollView: {
          flex: 1,
        },

        content: {
          paddingHorizontal: 18,
          paddingVertical: 18,
          gap: 12,
          paddingTop: 12,
        },

        title: {
          fontSize: 16,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
        },

        subtitle: {
          fontSize: 13,
          fontFamily: "Inter-SemiBold",
          fontWeight: "600",
          color: colors.textPrimary,
          marginTop: 2,
        },

        bodyText: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          lineHeight: 18,
          color: colors.textSecondary,
        },

        example: {
          backgroundColor: colors.bgElevated,
          borderRadius: Radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          gap: 4,
        },

        label: {
          fontSize: 11,
          fontFamily: "DMMono-Medium",
          fontWeight: "500",
          color: colors.accent,
          marginTop: 2,
        },

        exampleText: {
          fontSize: 12,
          fontFamily: "Inter",
          fontWeight: "400",
          lineHeight: 18,
          color: colors.textPrimary,
        },
      }),
    [colors],
  );
}
