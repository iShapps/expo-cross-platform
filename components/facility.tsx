import { AppText, Icon, IconBadge, PressableCard } from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { IFacility } from "@/data-types/facilities";
import { useAppTheme } from "@/hooks/use-app-theme";
import React from "react";
import { Alert, Linking, Platform, StyleSheet, View } from "react-native";

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

  const { colors } = useAppTheme();

  return (
    <PressableCard
      onPress={openMaps}
      accessibilityRole="button"
      accessibilityHint="Opens the address in Maps"
      radius={Radius.lg}
      padding={Space.md}
      style={styles.card}
    >
      <IconBadge icon="business-outline" tone="primary" size={48} />
      <View style={styles.content}>
        <AppText variant="headline">{facility.name ?? "—"}</AppText>
        <View style={styles.metaRow}>
          <Icon name="location-outline" size={15} color={colors.textTertiary} />
          <AppText variant="footnote" color="textSecondary" style={styles.flex}>
            {facility.address ?? "—"}
          </AppText>
        </View>
        <View style={styles.metaRow}>
          <Icon name="globe-outline" size={15} color={colors.textTertiary} />
          <AppText variant="footnote" color="textSecondary" style={styles.flex}>
            {facility.state?.name ?? "—"}
          </AppText>
        </View>
      </View>
      <Icon name="navigate-outline" size={20} color={colors.primaryStrong} style={styles.directions} />
    </PressableCard>
  );
};

export default FacilityCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Space.sm,
  },
  content: {
    flex: 1,
    gap: Space.xxs,
  },
  flex: {
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  directions: {
    alignSelf: "center",
  },
});
