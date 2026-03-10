import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface ShiftCalendarEvent {
  shiftId: number;
  facilityName: string;
  profession: string;
  startTime: Date;
  endTime: Date;
  location: string;
  notes?: string;
}

interface RequestPermissionsResult {
  calendarGranted: boolean;
  notificationGranted: boolean;
}

interface CalendarEventResult {
  eventId: string;
  reminderId?: string;
}

const CALENDAR_NAME = "Shifts Calendar";
const CALENDAR_COLOR = "#70C601";

/**
 * Hook for managing calendar events and reminders for shifts
 * Handles permissions, event creation, and reminder setup
 */
export const useCalendarAndReminders = () => {
  // Request calendar and reminders (iOS) permissions .
  const requestPermissions = async (): Promise<RequestPermissionsResult> => {
    try {
      const calendarPermission =
        await Calendar.requestCalendarPermissionsAsync();

      // iOS requires Reminders permission to use getCalendarsAsync
      if (Platform.OS === "ios") {
        await Calendar.requestRemindersPermissionsAsync();
      }

      const calendarGranted = calendarPermission.status === "granted";

      return {
        calendarGranted,
        notificationGranted: true,
      };
    } catch (error) {
      console.error("Error requesting permissions:", error);
      throw new Error("Failed to request calendar permissions");
    }
  };

  // Check if calendar permission is granted

  const checkPermissions = async (): Promise<RequestPermissionsResult> => {
    try {
      const calendarPermission = await Calendar.getCalendarPermissionsAsync();

      return {
        calendarGranted: calendarPermission.status === "granted",
        notificationGranted: true, // Managed on useSettingsStore
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return { calendarGranted: false, notificationGranted: true };
    }
  };

  // Get or create the default calendar for the app.
  // On iOS, both Calendar AND Reminders permissions must be granted
  // before calling getCalendarsAsync — even for event-only calendars.
  const getOrCreateCalendar = async (): Promise<string> => {
    try {
      // Request both permissions upfront on iOS
      if (Platform.OS === "ios") {
        const [calendarPermission, remindersPermission] = await Promise.all([
          Calendar.requestCalendarPermissionsAsync(),
          Calendar.requestRemindersPermissionsAsync(),
        ]);

        if (calendarPermission.status !== "granted") {
          throw new Error("Calendar permission is required");
        }

        if (remindersPermission.status !== "granted") {
          throw new Error(
            "Reminders permission is required on iOS to access the calendar store",
          );
        }
      } else {
        const calendarPermission =
          await Calendar.requestCalendarPermissionsAsync();
        if (calendarPermission.status !== "granted") {
          throw new Error("Calendar permission is required");
        }
      }

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const existingCalendar = calendars.find(
        (cal) => cal.title === CALENDAR_NAME,
      );

      if (existingCalendar) {
        return existingCalendar.id;
      }

      // Create a new calendar if it doesn't exist
      const newCalendarId = await Calendar.createCalendarAsync({
        title: CALENDAR_NAME,
        color: CALENDAR_COLOR,
        entityType: Calendar.EntityTypes.EVENT,
        source:
          Platform.OS === "ios"
            ? {
                // On iOS, use the local calendar source
                name: "iCloud",
                type: Calendar.CalendarType.CALDAV,
                isLocalAccount: false,
              }
            : {
                name: CALENDAR_NAME,
                type: "LOCAL",
                isLocalAccount: true,
              },
        name: "shiftsCalendar",
        ownerAccount: Platform.OS === "android" ? "local" : undefined,
        accessLevel:
          Platform.OS === "android"
            ? Calendar.CalendarAccessLevel.OWNER
            : undefined,
      });

      return newCalendarId;
    } catch (error) {
      console.error("Error getting or creating calendar:", error);
      throw new Error("Failed to get or create calendar");
    }
  };

  // Add a shift event to the calendar with reminders
  const addShiftToCalendar = async (
    event: ShiftCalendarEvent,
  ): Promise<CalendarEventResult> => {
    try {
      // Check and request calendar permission only
      const permissions = await checkPermissions();

      if (!permissions.calendarGranted) {
        const result = await requestPermissions();
        if (!result.calendarGranted) {
          throw new Error("Calendar permission is required");
        }
      }

      // Get or create calendar
      const calendarId = await getOrCreateCalendar();

      // Calculate reminder times (15 minutes and 1 hour before shift)
      const fifteenMinsBefore = new Date(
        event.startTime.getTime() - 15 * 60 * 1000,
      );
      const oneHourBefore = new Date(
        event.startTime.getTime() - 60 * 60 * 1000,
      );

      // Create calendar event
      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `Shift: ${event.profession} at ${event.facilityName}`,
        startDate: event.startTime,
        endDate: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        location: event.location,
        notes: event.notes || `Shift ID: ${event.shiftId}`,
        allDay: false,
      });

      // Schedule local notifications for the shift
      const fifteenMinsMsFromNow = Math.max(
        0,
        fifteenMinsBefore.getTime() - Date.now(),
      );
      const fifteenMinsReminderId =
        fifteenMinsMsFromNow > 0
          ? await Notifications.scheduleNotificationAsync({
              content: {
                title: "Shift Reminder",
                body: `Your shift at ${event.facilityName} starts in 15 minutes!`,
                data: {
                  shiftId: event.shiftId.toString(),
                  type: "shift_reminder",
                },
                sound: "default",
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: Math.floor(fifteenMinsMsFromNow / 1000),
              },
            })
          : "";

      const oneHourMsFromNow = Math.max(
        0,
        oneHourBefore.getTime() - Date.now(),
      );
      const oneHourReminderId =
        oneHourMsFromNow > 0
          ? await Notifications.scheduleNotificationAsync({
              content: {
                title: "Shift Reminder",
                body: `Your shift at ${event.facilityName} starts in 1 hour.`,
                data: {
                  shiftId: event.shiftId.toString(),
                  type: "shift_reminder",
                },
                sound: "default",
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: Math.floor(oneHourMsFromNow / 1000),
              },
            })
          : "";

      console.log("Shift added to calendar and reminders scheduled:", {
        eventId,
        fifteenMinsReminderId,
        oneHourReminderId,
      });

      return {
        eventId,
        reminderId: fifteenMinsReminderId,
      };
    } catch (error) {
      console.error("Error adding shift to calendar:", error);
      throw error;
    }
  };

  // Remove a shift event from the calendar
  const removeShiftFromCalendar = async (eventId: string): Promise<void> => {
    try {
      // On iOS, reminders permission is needed before getCalendarsAsync
      if (Platform.OS === "ios") {
        await Calendar.requestRemindersPermissionsAsync();
      }

      const calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT,
      );
      const shiftsCalendar = calendars.find(
        (cal) => cal.title === CALENDAR_NAME,
      );

      if (!shiftsCalendar) {
        console.warn("Shifts calendar not found");
        return;
      }

      await Calendar.deleteEventAsync(eventId, {
        instanceStartDate: new Date(),
      });

      console.log("Shift removed from calendar:", eventId);
    } catch (error) {
      console.error("Error removing shift from calendar:", error);
      throw error;
    }
  };

  // Cancel a specific notification reminder
  const cancelReminder = async (reminderId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      console.log("Reminder cancelled:", reminderId);
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      throw error;
    }
  };

  // Get all scheduled reminders (notifications)
  const getScheduledReminders = async (): Promise<
    Notifications.NotificationRequest[]
  > => {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      return notifications.filter(
        (notif) => notif.content.data?.type === "shift_reminder",
      );
    } catch (error) {
      console.error("Error getting scheduled reminders:", error);
      return [];
    }
  };

  // Clear all shift reminders and calendar events
  const clearAllShiftReminders = async (): Promise<void> => {
    try {
      const reminders = await getScheduledReminders();
      for (const reminder of reminders) {
        await Notifications.cancelScheduledNotificationAsync(
          reminder.identifier,
        );
      }
      console.log("All shift reminders cleared");
    } catch (error) {
      console.error("Error clearing reminders:", error);
      throw error;
    }
  };

  return {
    requestPermissions,
    checkPermissions,
    addShiftToCalendar,
    removeShiftFromCalendar,
    cancelReminder,
    getScheduledReminders,
    clearAllShiftReminders,
  };
};
