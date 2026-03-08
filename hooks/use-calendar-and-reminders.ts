import * as Calendar from "expo-calendar";
import * as Notifications from "expo-notifications";

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

/**
 * Hook for managing calendar events and reminders for shifts
 * Handles permissions, event creation, and reminder setup
 */
export const useCalendarAndReminders = () => {
  /**
   * Request calendar and notification permissions from the user
   */
  const requestPermissions = async (): Promise<RequestPermissionsResult> => {
    try {
      const calendarPermission =
        await Calendar.requestCalendarPermissionsAsync();
      const notificationPermission =
        await Notifications.requestPermissionsAsync();

      const calendarGranted =
        calendarPermission.status === "granted" ||
        calendarPermission.status === "undetermined";
      const notificationGranted =
        notificationPermission.granted ||
        notificationPermission.status === "undetermined";

      return {
        calendarGranted,
        notificationGranted,
      };
    } catch (error) {
      console.error("Error requesting permissions:", error);
      throw new Error(
        "Failed to request calendar and notification permissions",
      );
    }
  };

  /**
   * Check if calendar and notification permissions are granted
   */
  const checkPermissions = async (): Promise<RequestPermissionsResult> => {
    try {
      const calendarPermission = await Calendar.getCalendarPermissionsAsync();
      const notificationPermission = await Notifications.getPermissionsAsync();

      return {
        calendarGranted: calendarPermission.status === "granted",
        notificationGranted: notificationPermission.granted,
      };
    } catch (error) {
      console.error("Error checking permissions:", error);
      return { calendarGranted: false, notificationGranted: false };
    }
  };

  /**
   * Get or create the default calendar for the app
   */
  const getOrCreateCalendar = async (): Promise<string> => {
    try {
      const calendars = await Calendar.getCalendarsAsync();
      const existingCalendar = calendars.find(
        (cal) => cal.title === "Shifts Calendar",
      );

      if (existingCalendar) {
        return existingCalendar.id;
      }

      // Create a new calendar if it doesn't exist
      const newCalendar = await Calendar.createCalendarAsync({
        title: "Shifts Calendar",
        color: "#70C601",
        entityType: Calendar.EntityTypes.EVENT,
        source: {
          name: "Shifts Calendar",
          type: "CUSTOM",
        },
        name: "shiftsCalendar",
      });

      return newCalendar;
    } catch (error) {
      console.error("Error getting or creating calendar:", error);
      throw new Error("Failed to get or create calendar");
    }
  };

  /**
   * Add a shift event to the calendar with reminders
   */
  const addShiftToCalendar = async (
    event: ShiftCalendarEvent,
  ): Promise<CalendarEventResult> => {
    try {
      // Check and request permissions
      const permissions = await checkPermissions();

      if (!permissions.calendarGranted || !permissions.notificationGranted) {
        const result = await requestPermissions();
        if (!result.calendarGranted || !result.notificationGranted) {
          throw new Error("Calendar and notification permissions are required");
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
        timeZone: "auto",
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

  /**
   * Remove a shift event from the calendar
   */
  const removeShiftFromCalendar = async (eventId: string): Promise<void> => {
    try {
      const calendars = await Calendar.getCalendarsAsync();
      const shiftsCalendar = calendars.find(
        (cal) => cal.title === "Shifts Calendar",
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

  /**
   * Cancel a specific notification reminder
   */
  const cancelReminder = async (reminderId: string): Promise<void> => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      console.log("Reminder cancelled:", reminderId);
    } catch (error) {
      console.error("Error cancelling reminder:", error);
      throw error;
    }
  };

  /**
   * Get all scheduled reminders (notifications)
   */
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

  /**
   * Clear all shift reminders and calendar events
   */
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
