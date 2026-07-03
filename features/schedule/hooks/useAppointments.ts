import {
  Appointment,
  AppointmentDraft,
  NewScheduleFormState,
} from "@/type/NewScheduleTypes";
import { useState } from "react";
import { defaultAppointmentDraft } from "../utils/wizardHelpers";

export type UseAppointmentsStateType = {
  apptDraft: AppointmentDraft;
  patchAppt: (p: Partial<AppointmentDraft>) => void;
  showDraft: () => void;
  hideDraft: () => void;
  commitAppointment: () => void;
  removeAppointment: (id: string) => void;
  appointments: Appointment[];
};

type Payload = {
  form: NewScheduleFormState;
  setForm: React.Dispatch<React.SetStateAction<NewScheduleFormState>>;
};

const useAppointments = ({
  form,
  setForm,
}: Payload): UseAppointmentsStateType => {
  const appointments: Appointment[] = form?.appointments ?? [];

  const [apptDraft, setApptDraft] = useState<AppointmentDraft>(
    defaultAppointmentDraft(),
  );

  const patchAppt = (p: Partial<AppointmentDraft>) =>
    setApptDraft((prev) => ({ ...prev, ...p }));

  const commitAppointment = () => {
    if (!apptDraft.visible) return;

    const appt: Appointment = {
      id: Date.now().toString(),
      type: apptDraft.type,
      customLabel: apptDraft.customLabel,
      startTime: apptDraft.startTime,
      endTime: apptDraft.endTime,
    };

    setForm((prev) => ({
      ...prev,
      appointments: [...prev.appointments, appt],
    }));
    setApptDraft(defaultAppointmentDraft());
  };

  const removeAppointment = (id: string) =>
    setForm((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== id),
    }));

  return {
    apptDraft,
    patchAppt,
    showDraft: () => patchAppt({ visible: true }),
    hideDraft: () => patchAppt({ visible: false }),
    commitAppointment,
    removeAppointment,
    appointments,
  };
};

export default useAppointments;
