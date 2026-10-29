import { AppText } from "@/components/design";
import { FontFamily, Radius, Space, Touch } from "@/constants/design";
import { useAppTheme } from "@/hooks/use-app-theme";
import { StyleSheet, View } from "react-native";
import GooglePlacesTextInput from "react-native-google-places-textinput";

export type AddressAutocompleteResult = {
  address: string;
  latitude: string;
  longitude: string;
  city: string;
  suburb: string;
  postCode: string;
};

type Props = {
  value: string;
  onSelect: (result: AddressAutocompleteResult) => void;
  label?: string;
};

/** Google Places address search that resolves address + lat/long + city/suburb/post code together. */
export function AddressAutocomplete({ value, onSelect, label = "Address" }: Props) {
  const { colors } = useAppTheme();
  const PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

  return (
    <View style={styles.wrap}>
      <AppText variant="subhead">{label}</AppText>
      <GooglePlacesTextInput
        apiKey={PLACES_KEY}
        fetchDetails={true}
        detailsFields={["formattedAddress", "location", "addressComponents"]}
        onPlaceSelect={(place) => {
          const details = place.details as {
            formattedAddress?: string;
            location?: { latitude: number; longitude: number };
            addressComponents?: {
              longText: string;
              types: string[];
            }[];
          } | null;

          const get = (type: string) =>
            details?.addressComponents?.find((c) => c.types.includes(type))
              ?.longText ?? "";
          onSelect({
            address: details?.formattedAddress ?? "",
            latitude: details?.location
              ? String(details.location.latitude)
              : "",
            longitude: details?.location
              ? String(details.location.longitude)
              : "",
            suburb:
              get("sublocality_level_1") ||
              get("sublocality") ||
              get("neighborhood") ||
              get("locality"),
            city: get("locality") || get("administrative_area_level_2"),
            postCode: get("postal_code"),
          });
        }}
        includedRegionCodes={["AU"]}
        nestedScrollEnabled={true}
        hideOnKeyboardDismiss={true}
        debounceDelay={400}
        value={value}
        placeHolderText="Start typing your address..."
        minCharsToFetch={2}
        autoCapitalize="words"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="search"
        textContentType="streetAddressLine1"
        style={{
          container: {
            width: "100%",
          },
          inputContainer: {
            minHeight: Touch.button,
            borderWidth: 1.5,
            borderColor: colors.surfaceMuted,
            borderRadius: Radius.md,
            backgroundColor: colors.surfaceMuted,
            paddingHorizontal: Space.md,
          },
          input: {
            color: colors.text,
            fontFamily: FontFamily.regular,
            fontSize: 16,
          },
          suggestionsContainer: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: Radius.md,
            marginTop: Space.xxs,
            maxHeight: 250,
            overflow: "hidden",
          },
          suggestionItem: {
            paddingHorizontal: Space.md,
            paddingVertical: Space.sm,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
          suggestionText: {
            main: {
              fontFamily: FontFamily.medium,
              fontSize: 15,
              color: colors.text,
            },
            secondary: {
              fontFamily: FontFamily.regular,
              fontSize: 13,
              color: colors.textSecondary,
            },
          },
          loadingIndicator: {
            color: colors.textSecondary,
          },
          placeholder: {
            color: colors.textTertiary,
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Space.xs,
  },
});
