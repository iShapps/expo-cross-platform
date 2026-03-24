import { INotification } from "@/data-types/notifications";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, Link } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatMediumDateTime } from "../utils/date-time";

interface NotificationCardProps {
  notification: INotification;
  onPress?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  let colorScheme = useColorScheme();
  if (!colorScheme) colorScheme = "light";
  const styles = getStyles(colorScheme);

  const getNotificationIcon = () => {
    switch (notification.notification_type) {
      case "shifts":
        return "calendar-plus";
      case "statement-details":
        return "currency-usd"; // "receipt-long ";
      case "documents":
        return "file-document-arrow-right-outline";
      default:
        return "bell";
    }
  };

  const getNotificationColor = () => {
    switch (notification.notification_type) {
      case "shifts":
        return "#70C601";
      case "statement-details":
        return "#4A90E2";
      case "documents":
        return "#28A745";
      default:
        return "#70C601";
    }
  };

  const timeFormatted = formatMediumDateTime(notification.created_at);

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
      <Pressable>
        <View
          style={[styles.card, !notification.is_expired && styles.unreadCard]}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getNotificationColor()}20` },
            ]}
          >
            <MaterialCommunityIcons
              name={getNotificationIcon()}
              size={24}
              color={getNotificationColor()}
            />
            {!notification.is_expired && <View style={styles.unreadDot} />}
          </View>

          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{notification.title}</Text>
            </View>
            <Text style={styles.message} numberOfLines={2}>
              {notification.message}
            </Text>
            <Text style={styles.time}>{timeFormatted}</Text>
          </View>

          <View style={styles.detailHint}>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color="#C4C4C4"
            />
          </View>
        </View>
      </Pressable>
    </Link>
  );
};

const getStyles = (colorScheme: string) =>
  StyleSheet.create({
    card: {
      backgroundColor: colorScheme === "dark" ? "#232A2E" : "#fff",
      borderRadius: 5,
      padding: 12,
      marginBottom: 4,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: colorScheme === "dark" ? "#000" : "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
      borderWidth: 1,
      borderColor: colorScheme === "dark" ? "#36454F" : "#f0f0f0",
    },
    unreadCard: {
      backgroundColor: colorScheme === "dark" ? "#36454F" : "#F8FFF0",
      borderColor: colorScheme === "dark" ? "#f5ebcd" : "#70C601",
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      position: "relative",
      backgroundColor: colorScheme === "dark" ? "#36454F" : undefined,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colorScheme === "dark" ? "#edebe3" : "#000",
      flex: 1,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colorScheme === "dark" ? "#edebe3" : "#70C601",
      position: "absolute",
      top: -2,
      right: -2,
      borderWidth: 2,
      borderColor: colorScheme === "dark" ? "#36454F" : "#fff",
    },
    message: {
      fontSize: 13,
      color: colorScheme === "dark" ? "#edebe3" : "#666",
      lineHeight: 18,
      marginBottom: 4,
    },
    time: {
      fontSize: 11,
      color: colorScheme === "dark" ? "#edebe3" : "#999",
    },
    detailHint: {
      alignSelf: "flex-start",
      marginLeft: 8,
      marginTop: 2,
    },
  });
