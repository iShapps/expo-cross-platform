import { isAuthError } from "@/api-actions/error-utils";
import { updateAvailability } from "@/api-queries/profile";
import {
  AppSwitch,
  AppText,
  Avatar,
  BusyOverlay,
  Card,
  IconBadge,
  InfoRow,
  ListGroup,
  ListRow,
  ScreenHeader,
} from "@/components/design";
import { Radius, Space } from "@/constants/design";
import { useConfigSettings } from "@/data-store/config-store";
import { useProfileData } from "@/data-store/use-account-store";
import { User } from "@/data-types/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMediumDate } from "@/utils/date-time";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const configSettings = useConfigSettings();

  const queryClient = useQueryClient();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;

  const hcp = userDetails?.hcp;
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);
  const isAvailable =
    optimisticValue !== null
      ? optimisticValue
      : Boolean(hcp?.available_for_job);

  const professions = hcp?.hcp_professions ?? [];

  const updateAvailabilityMutation = useMutation({
    mutationFn: (status: number) => updateAvailability(status),
  });

  const toggleAvailability = (value: boolean) => {
    setOptimisticValue(value);
    updateAvailabilityMutation.mutate(value ? 1 : 0, {
      onSuccess: (response) => {
        setOptimisticValue(null);
        if (response.status) {
          const nextUserDetails = userDetails
            ? {
                ...userDetails,
                hcp: { ...userDetails.hcp, available_for_job: value ? 1 : 0 },
              }
            : null;

          profileStore.setUserDetails(nextUserDetails);
          queryClient.setQueryData<User | undefined>(
            ["profile-details"],
            (old) => {
              if (!old) return nextUserDetails ?? old;
              return {
                ...old,
                hcp: { ...old.hcp, available_for_job: value ? 1 : 0 },
              };
            },
          );
          Alert.alert("Success", response.message);
        } else {
          Alert.alert("Error", response.message);
        }
      },
      onError: (error) => {
        setOptimisticValue(null);
        if (isAuthError(error)) return;
        Alert.alert(
          "Error",
          error instanceof Error
            ? error.message
            : "An error occurred while updating your status.",
        );
      },
    });
  };

  const avatarImageSource = `${configSettings?.configSettings?.image_path?.hcp_path}${encodeURIComponent(
    `${userDetails?.hcp?.hcp_prefix}${userDetails?.hcp?.id}`,
  )}/image/${userDetails?.hcp?.image}`;

  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card radius={Radius.xl} padding={Space.lg} raised style={styles.heroCard}>
          <Avatar
            name={userDetails?.name}
            uri={hcp?.image ? avatarImageSource : null}
            size={72}
          />
          <AppText variant="title3" align="center">
            {userDetails?.name ?? "—"}
          </AppText>
          <AppText variant="footnote" color="textSecondary" align="center">
            {userDetails?.email ?? "—"}
          </AppText>
          {!!hcp?.address && (
            <AppText variant="caption" color="textTertiary" align="center">
              {hcp.address}
            </AppText>
          )}
        </Card>

        <ListGroup title="Availability">
          <ListRow
            icon="briefcase-outline"
            title="Available for jobs"
            subtitle="Toggle your availability for shifts"
            right={
              <AppSwitch
                value={isAvailable}
                onValueChange={toggleAvailability}
                disabled={updateAvailabilityMutation.isPending}
              />
            }
            isLast
          />
        </ListGroup>

        <Section title="Personal details">
          <InfoRow label="Full name" value={userDetails?.name ?? "—"} />
          <InfoRow label="Phone" value={hcp?.contact_number ?? "—"} />
          <InfoRow
            label="Date of birth"
            value={formatMediumDate(hcp?.date_of_birth ? hcp?.date_of_birth : "—")}
          />
          <InfoRow
            label="Gender"
            value={
              hcp?.gender
                ? `${hcp?.gender?.charAt(0).toLocaleUpperCase()}${hcp?.gender?.slice(1)}`
                : "—"
            }
            isLast
          />
        </Section>

        {professions.length > 0 && (
          <View style={styles.section}>
            <AppText variant="overline" color="textTertiary" style={styles.sectionTitle}>
              Professions
            </AppText>
            {professions.map((item: any) => (
              <Card
                key={String(item?.id)}
                radius={Radius.lg}
                padding={Space.md}
                style={styles.professionCard}
              >
                <IconBadge icon="ribbon-outline" tone="primary" size={40} />
                <View style={styles.flex}>
                  <AppText variant="headline">{item?.profession?.name ?? "—"}</AppText>
                  <AppText variant="footnote" color="textSecondary">
                    {item?.category?.name ?? "—"} · {item?.level?.name ?? "—"}
                  </AppText>
                </View>
              </Card>
            ))}
          </View>
        )}

        <Section title="Address">
          <InfoRow label="Address" value={hcp?.address ?? "—"} />
          <InfoRow label="Suburb" value={hcp?.suburb_name ?? "—"} />
          <InfoRow label="City" value={hcp?.city_name ?? "—"} />
          <InfoRow
            label="State"
            value={hcp?.state_id ? String(hcp?.state_id) : "—"}
          />
          <InfoRow label="Post code" value={hcp?.post_code ?? "—"} />
          <InfoRow
            label="Country"
            value={hcp?.country_id ? String(hcp?.country_id) : "—"}
            isLast
          />
        </Section>
      </ScrollView>

      {updateAvailabilityMutation.isPending && (
        <BusyOverlay message="Updating profile status..." />
      )}
    </SafeAreaView>
  );
}

/** Titled card of InfoRows. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="overline" color="textTertiary" style={styles.sectionTitle}>
        {title}
      </AppText>
      <Card radius={Radius.xl} padding={Space.md} style={styles.infoCard}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: Space.xxl,
    gap: Space.lg,
  },
  heroCard: {
    alignItems: "center",
    gap: Space.xxs,
  },
  section: {
    gap: Space.xs,
  },
  sectionTitle: {
    paddingHorizontal: Space.xxs,
  },
  infoCard: {
    paddingVertical: Space.xxs,
  },
  professionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.sm,
  },
});
