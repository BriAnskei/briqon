import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SaveScheduleModal } from "./SaveScheduleModal";

describe("SaveScheduleModal", () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly when visible", () => {
    const { getByText, getByPlaceholderText } = render(
      <SaveScheduleModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    expect(getByText("Save schedule")).toBeTruthy();
    expect(getByPlaceholderText("Enter a schedule name")).toBeTruthy();
  });

  it("calls onConfirm with the entered name", () => {
    const { getByPlaceholderText, getByText } = render(
      <SaveScheduleModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const input = getByPlaceholderText("Enter a schedule name");
    const saveButton = getByText("Save");

    fireEvent.changeText(input, "My New Schedule");
    fireEvent.press(saveButton);

    expect(mockOnConfirm).toHaveBeenCalledWith("My New Schedule");
  });

  it("does not call onConfirm if name is empty", () => {
    const { getByText } = render(
      <SaveScheduleModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const saveButton = getByText("Save");
    fireEvent.press(saveButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it("shows loading state and disables buttons when isSaving is true", () => {
    const { queryByText, getByText } = render(
      <SaveScheduleModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isSaving={true}
      />
    );

    // ActivityIndicator is usually found by its default role or type if not given a testID
    // But since we can't easily query ActivityIndicator without testID in some setups,
    // we check if the "Save" text is gone (since it's replaced by the indicator in the code)
    expect(queryByText("Save")).toBeNull();
    
    const cancelButton = getByText("Cancel");
    fireEvent.press(cancelButton);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("calls onClose when close button or cancel is pressed", () => {
    const { getByText } = render(
      <SaveScheduleModal
        visible={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = getByText("Cancel");
    fireEvent.press(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
