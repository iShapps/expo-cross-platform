import { AppText, Icon, IconBadge, PressableCard, type IconName } from "@/components/design";
import { Radius, Space, type Tone } from "@/constants/design";
import { INotification } from "@/data-types/notifications";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Href, Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { formatMediumDateTime } from "../utils/date-time";

interface NotificationCardProps {
  notification: INotification;
  onPress?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
}) => {
  const { colors } = useAppTheme();

  const getNotificationIcon = (): IconName => {
    switch (notification.notification_type) {
      case "shifts":
        return "calendar-outline";
      case "statement-details":
        return "cash-outline";
      case "documents":
        return "document-text-outline";
      default:
        return "notifications-outline";
    }
  };

  const getNotificationTone = (): Tone => {
    switch (notification.notification_type) {
      case "shifts":
        return "primary";
      case "statement-details":
        return "blue";
      case "documents":
        return "violet";
      default:
        return "primary";
    }
  };

  const timeFormatted = formatMediumDateTime(notification.created_at);
  const isUnread = !notification.is_expired;

  const getHref = (): Href => {
    switch (notification.notification_type) {
      case "shifts":
        return {
          pathname: "/(main)/[shiftId]",
          params: { shiftId: notification.shift_id.toString() },
        };

      case "documents":
        return "/(tabs)/documents";

      default:
        return "/(main)/notifications";
    }
  };
  return (
    <Link href={getHref()} asChild>
      <PressableCard
        accessibilityRole="link"
        style={[
          styles.card,
          isUnread && { borderColor: colors.primarySoft },
        ]}
      >
        <View>
          <IconBadge icon={getNotificationIcon()} tone={getNotificationTone()} size={44} />
          {isUnread && (
            <View
              style={[
                styles.unreadDot,
                { backgroundColor: colors.primary, borderColor: colors.surface },
              ]}
            />
          )}
        </View>

        <View style={styles.content}>
          <AppText variant="headline" numberOfLines={1}>
            {notification.title}
          </AppText>
          <AppText variant="footnote" color="textSecondary" numberOfLines={2}>
            {notification.message}
          </AppText>
          <AppText variant="caption" color="textTertiary" style={styles.time}>
            {timeFormatted}
          </AppText>
        </View>

        <Icon name="chevron-forward" size={18} color={colors.textTertiary} style={styles.chevron} />
      </PressableCard>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
    minHeight: 76,
  },
  unreadDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  time: {
    marginTop: Space.xxs,
  },
  chevron: {
    alignSelf: "center",
  },
});
