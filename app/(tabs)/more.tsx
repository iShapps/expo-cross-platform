import { isAuthError } from "@/api-actions/error-utils";

import { updateAvailability } from "@/api-queries/profile";
import {
  AppSwitch,
  AppText,
  Avatar,
  BusyOverlay,
  Card,
  Chip,
  IconButton,
  ListGroup,
  ListRow,
} from "@/components/design";
import TabsHeader from "@/components/shared/tabs-header";
import { Radius, Space } from "@/constants/design";
import { useProfileData } from "@/data-store/use-account-store";
import { useTenantStore } from "@/data-store/use-tenant-store";
import { User } from "@/data-types/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFirstVisitTour } from "@/hooks/use-first-visit-tour";
import { useIsFocused } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import { CopilotStep, walkthroughable } from "react-native-copilot";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../ctx";

const WalkthroughableView = walkthroughable(View);

export default function More() {
  const { signOut } = useSession();
  const queryClient = useQueryClient();
  const profileStore = useProfileData();
  const userDetails = profileStore.userDetails;
  const organizationName = useTenantStore((state) => state.tenant?.name);
  const hcp = userDetails?.hcp;
  const [optimisticValue, setOptimisticValue] = useState<boolean | null>(null);
  const isAvailable =
    optimisticValue !== null
      ? optimisticValue
      : Boolean(hcp?.available_for_job);


  const isFocused = useIsFocused();

  useFirstVisitTour("more", isFocused && !!userDetails);

  const handleLogout = () => {
    // add confirmation dialog
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Yes, Logout",
        style: "destructive",
        onPress: () => {
          signOut();
          // router.replace("/(main)/index");
        },
      },
    ]);
    // signOut();
    // router.replace("/(main)/index")
  };

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

  const { colors } = useAppTheme();
  const professions = userDetails?.hcp?.hcp_professions ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <TabsHeader
        title="More"
        right={
          <IconButton
            icon="log-out-outline"
            accessibilityLabel="Log out"
            onPress={handleLogout}
          />
        }
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Card radius={Radius.xl} padding={Space.lg} raised style={styles.profileCard}>
          <Avatar
            name={userDetails?.name}
            uri={userDetails?.hcp?.image_url ?? null}
            size={64}
          />
          <View style={styles.profileInfo}>
            <AppText variant="title3" numberOfLines={1}>
              {userDetails?.name ?? "—"}
            </AppText>
            <AppText variant="footnote" color="textSecondary" numberOfLines={1}>
              {userDetails?.email ?? "—"}
            </AppText>
            {professions.length > 0 && (
              <View style={styles.chipRow}>
                {professions.map((prfession, index) => (
                  <Chip
                    key={index}
                    label={prfession?.profession?.name ?? "—"}
                    tone="primary"
                  />
                ))}
              </View>
            )}
          </View>
        </Card>

        <CopilotStep
          name="more-availability"
          order={1}
          active={isFocused}
          text="Turn this on to let facilities know you're available for new shifts — turn it off anytime you don't want new offers."
        >
          <WalkthroughableView>
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
          </WalkthroughableView>
        </CopilotStep>

        <CopilotStep
          name="more-links"
          order={2}
          active={isFocused}
          text="Manage your profile details, browse the facilities you work with, and adjust app settings here."
        >
          <WalkthroughableView>
            <ListGroup title="Account">
              <ListRow
                icon="business-outline"
                title="Organization"
                value={organizationName ?? "—"}
                onPress={() => router.push("/(main)/switch-organization")}
              />
              <ListRow
                icon="person-circle-outline"
                title="Your profile"
                onPress={() => router.push("/(main)/account")}
              />
              <ListRow
                icon="map-outline"
                title="Facilities"
                onPress={() => router.push("/(main)/facilities")}
              />
              <ListRow
                icon="settings-outline"
                title="Settings"
                onPress={() => router.push("/(main)/settings")}
                isLast
              />
            </ListGroup>
          </WalkthroughableView>
        </CopilotStep>

        <ListGroup>
          <ListRow
            icon="log-out-outline"
            title="Log out"
            destructive
            onPress={handleLogout}
            isLast
          />
        </ListGroup>
      </ScrollView>

      {updateAvailabilityMutation.isPending && (
        <BusyOverlay message="Updating availability..." />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Space.gutter,
    paddingTop: Space.xs,
    paddingBottom: 120,
    gap: Space.lg,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Space.xxs + 2,
    marginTop: Space.xs,
  },
});
