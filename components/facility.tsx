import { Colors } from "@/constants/theme";
import { IFacility } from "@/data-types/facilities";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Fontisto, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface FacilityCardCardProps {
  facility: IFacility;
}

const FacilityCard: React.FC<FacilityCardCardProps> = ({ facility }) => {
  const openMaps = async () => {
    const address = facility.address;

    if (!address) return;

    const encodedAddress = encodeURIComponent(address);

    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?q=${encodedAddress}`
        : `geo:0,0?q=${encodedAddress}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Unable to open maps application.");
    }
  };

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const styles = getStyles(theme);

  return (
    <Pressable
      onPress={openMaps}
      style={[
        styles.heroCard,
        {
          backgroundColor: theme.heroBg,
          borderColor: theme.heroBorder,
        },
      ]}
    >
      <View style={styles.heroContent}>
        <Text style={[styles.heroName, { color: theme.primaryText }]}>
          {facility.name ?? "—"}
        </Text>
        <View style={styles.heroText}>
          {/* phone icon */}
          <MaterialCommunityIcons
            name="phone"
            size={15}
            color={theme.activeText}
          />
          <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
            {facility.contact_person ?? "—"} - {facility.contact_number ?? "—"}
          </Text>
        </View>

        <View style={styles.heroText}>
          <MaterialCommunityIcons
            name="email-newsletter"
            size={15}
            color={theme.activeText}
          />
          <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
            {facility.post_code ?? "—"}
          </Text>
        </View>
        <View style={styles.heroText}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={16}
            color={theme.activeText}
          />
          <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
            {facility.address ?? "—"}
          </Text>
        </View>
        <View style={styles.heroText}>
          <Fontisto name="world-o" size={12} color={theme.activeText} />
          <Text style={[styles.heroMeta, { color: theme.secondaryText }]}>
            {facility.state?.name ?? "—"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default FacilityCard;

const getStyles = (theme: typeof Colors.light) =>
  StyleSheet.create({
    heroCard: {
      marginTop: 8,
      backgroundColor: theme.heroBg,
      borderRadius: 5,
      padding: 10,
      display: "flex",
      flexDirection: "column",
      gap: 12,
      borderWidth: 1,
      borderColor: theme.heroBorder,
    },
    heroText: {
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    heroIconWrap: {
      height: 64,
      width: 64,
      borderRadius: 5,
      backgroundColor: theme.heroIconBg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroContent: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 5,
    },
    heroName: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.primaryText,
    },
    heroMeta: {
      fontSize: 12,
      color: theme.secondaryText,
      marginTop: 2,
    },
  });
