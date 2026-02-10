import { IProfileDocument } from "@/data-types/profile";
import AntDesign from "@expo/vector-icons/AntDesign";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Fontisto from "@expo/vector-icons/Fontisto";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React from "react";

import { Pressable, StyleSheet, Text, View } from "react-native";

interface DocumentCardProps {
  document: IProfileDocument;
}

const isExpired = (expiry?: string) => {
  if (!expiry) return false;
  return new Date(expiry) < new Date();
};

const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  const expired = isExpired(document.expiry_date);
  // Dynamic icon selection based on document name
  let iconComponent = (
    <MaterialCommunityIcons
      name="file-document-multiple-outline"
      size={38}
      color={expired ? "#e53935" : "#aaa"}
      style={styles.icon}
    />
  );
  const docName = document.name.toLowerCase();
  if (docName.includes("ain qualification")) {
    iconComponent = (
      <AntDesign
        name="idcard"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("other qualification")) {
    iconComponent = (
      <MaterialCommunityIcons
        name="certificate-outline"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("working with children")) {
    iconComponent = (
      <MaterialCommunityIcons
        name="file-document-multiple-outline"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("manual handling")) {
    iconComponent = (
      <MaterialCommunityIcons
        name="file-document-multiple-outline"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("passport") || docName.includes("medicare")) {
    iconComponent = (
      <Fontisto
        name="passport-alt"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("police clearance")) {
    iconComponent = (
      <MaterialCommunityIcons
        name="badge-account-outline"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("drivers license")) {
    iconComponent = (
      <FontAwesome
        name="drivers-license-o"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  } else if (docName.includes("influenza vaccine")) {
    iconComponent = (
      <Fontisto
        name="injection-syringe"
        size={38}
        color={expired ? "#e53935" : "#aaa"}
        style={styles.icon}
      />
    );
  }
  return (
    <View style={[styles.card, expired && styles.expiredCard]}>
      <View style={styles.iconWrapper}>
        {iconComponent}
        <View
          style={[
            styles.statusDot,
            document.status === "active"
              ? styles.statusDotActive
              : styles.statusDotInactive,
          ]}
        />
      </View>
      <View style={styles.infoColumn}>
        <Text style={styles.createdAt}>
          uploaded on {new Date(document.created_at).toLocaleDateString()}
        </Text>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, expired && styles.expiredText]}
            numberOfLines={1}
          >
            {document.name}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {document.mandatory_status === "yes" ? "Mandatory" : "Optional"}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.metaText}>
            {document.expiry_date_mandatory === "yes"
              ? "Expiry required"
              : "No expiry"}
          </Text>
        </View>
      </View>
      <Pressable
        style={styles.moreIconBtn}
        onPress={() => {
          /* TODO: open document details page */
        }}
        hitSlop={8}
      >
        <MaterialIcons name="more-horiz" size={26} color="#2979ff" />
      </Pressable>
    </View>
  );
};

export default DocumentCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 5,
    borderColor: "#f1f1f1",
    borderWidth: 1,
    gap: 0,
  },
  expiredCard: {
    borderColor: "#e53935",
    backgroundColor: "#fff5f5",
  },
  iconWrapper: {
    position: "relative",
    marginRight: 16,
    marginLeft: 2,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    zIndex: 1,
  },
  statusDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 2,
  },
  statusDotActive: {
    backgroundColor: "#43d047",
  },
  statusDotInactive: {
    backgroundColor: "#e53935",
  },
  infoColumn: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
  createdAt: {
    fontSize: 11,
    color: "#aaa",
    marginBottom: 2,
    marginLeft: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    flexShrink: 1,
    marginRight: 8,
    letterSpacing: 0.2,
  },
  moreIconBtn: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 16,
    alignSelf: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#888",
    fontWeight: "500",
  },
  dot: {
    fontSize: 10,
    color: "#bbb",
    marginHorizontal: 3,
    marginTop: -1,
  },
  expiredText: {
    color: "#e53935",
    fontWeight: "bold",
  },
});
