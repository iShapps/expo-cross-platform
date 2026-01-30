import { PushNotification } from "@/data-types/dashboard";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface NotificationCardProps {
  notification: PushNotification;
  onPress?: () => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onPress,
}) => {
  const getNotificationIcon = () => {
    switch (notification.type) {
      case "shift_available":
        return "calendar-plus";
      case "shift_reminder":
        return "bell-ring";
      case "payment":
        return "currency-usd";
      case "general":
        return "information";
      default:
        return "bell";
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case "shift_available":
        return "#70C601";
      case "shift_reminder":
        return "#4A90E2";
      case "payment":
        return "#28A745";
      case "general":
        return "#666";
      default:
        return "#70C601";
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
  });

  return (
    <TouchableOpacity
      style={[styles.card, !notification.is_read && styles.unreadCard]}
      onPress={onPress}
      activeOpacity={0.7}
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
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{notification.title}</Text>
          {!notification.is_read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  unreadCard: {
    backgroundColor: "#F8FFF0",
    borderColor: "#70C601",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
    color: "#000",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#70C601",
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
    marginBottom: 4,
  },
  time: {
    fontSize: 11,
    color: "#999",
  },
});
