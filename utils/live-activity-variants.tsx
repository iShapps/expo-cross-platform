import { IShift } from "@/data-types/shifts";
import React from "react";
import { Voltra } from "voltra";

// Live Activity palette — the design system's dark theme (constants/design.ts).
// Live Activities render natively (SwiftUI), so they use the system font and
// SF Symbols rather than Outfit / Ionicons.
const BG = "#0D110F";
const BRAND = "#7FD41A";
const TEXT = "#EEF2EA";
const TEXT_MUTED = "rgba(238,242,234,0.6)";
const TEXT_FAINT = "rgba(238,242,234,0.45)";
const TRACK = "rgba(255,255,255,0.14)";
const HAIRLINE = "rgba(255,255,255,0.08)";

export function buildVariants(shift: IShift, now: Date) {
  const shiftStart = new Date(shift.start_time).getTime();
  const shiftEnd = new Date(shift.end_time).getTime();

  const total = shiftEnd - shiftStart;
  const elapsed = now.getTime() - shiftStart;
  const progress = Math.min(Math.max(elapsed / total, 0), 1);
  const progressPercent = Math.round(progress * 100);

  const remainingDiff = shiftEnd - now.getTime();
  const timeRemaining =
    remainingDiff <= 0
      ? "Completed"
      : (() => {
          const h = Math.floor(remainingDiff / (1000 * 60 * 60));
          const m = Math.floor((remainingDiff / (1000 * 60)) % 60);
          const s = Math.floor((remainingDiff / 1000) % 60);
          return `${h}h ${m}m ${s}s`;
        })();

  const elapsedDiff = now.getTime() - shiftStart;
  const timeElapsed =
    elapsedDiff <= 0
      ? "Not started"
      : (() => {
          const h = Math.floor(elapsedDiff / (1000 * 60 * 60));
          const m = Math.floor((elapsedDiff / (1000 * 60)) % 60);
          return `${h}h ${m}m elapsed`;
        })();

  const isComplete = remainingDiff <= 0;

  /** Native countdown to the shift end (ticks on its own); "Completed" after. */
  const countdown = (fontSize: number, color: string) =>
    isComplete ? (
      <Voltra.Text style={{ color, fontSize, fontWeight: "700" }}>
        {timeRemaining}
      </Voltra.Text>
    ) : (
      <Voltra.Timer
        endAtMs={shiftEnd}
        direction="down"
        textStyle="timer"
        showHours
        style={{
          color,
          fontSize,
          fontWeight: "700",
          fontVariant: ["tabular-nums"],
        }}
      />
    );

  // Dynamic Island, minimal: a progress ring for the shift.
  const minimal = (
    <Voltra.CircularProgressView
      startAtMs={shiftStart}
      endAtMs={shiftEnd}
      progressColor={BRAND}
      trackColor={TRACK}
      lineWidth={3}
      style={{ width: 20, height: 20 }}
    />
  );

  // Dynamic Island, compact: icon + countdown.
  const compact = (
    <Voltra.HStack
      style={{
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 8,
        backgroundColor: BG,
      }}
    >
      <Voltra.Symbol
        name="stethoscope"
        size={14}
        weight="semibold"
        tintColor={BRAND}
      />
      {countdown(13, BRAND)}
    </Voltra.HStack>
  );

  // Dynamic Island expanded + lock screen.
  const expanded = (
    <Voltra.VStack
      style={{
        padding: 18,
        paddingVertical: 18,
        alignItems: "flex-start",
        gap: 0,
        backgroundColor: BG,
      }}
    >
      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Voltra.HStack
          style={{
            width: "100%",
            paddingHorizontal: 0,
            paddingVertical: 4,
            alignItems: "center",
            gap: 6,
            flex: 1,
            marginLeft: -50,
          }}
        >
          <Voltra.Symbol name="circle.fill" size={8} tintColor={BRAND} />
          <Voltra.Text
            style={{
              color: BRAND,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 0.8,
              textAlign: "left",
            }}
          >
            {shift.shift_type.charAt(0).toUpperCase() +
              shift.shift_type.slice(1)}{" "}
            · shift in progress
          </Voltra.Text>
        </Voltra.HStack>

        {countdown(15, TEXT)}
      </Voltra.HStack>

      <Voltra.HStack
        style={{ alignItems: "center", gap: 8, width: "100%", marginBottom: 6 }}
      >
        <Voltra.Symbol
          name="building.2.fill"
          size={15}
          weight="semibold"
          tintColor={TEXT}
        />
        <Voltra.Text
          style={{
            color: TEXT,
            fontSize: 17,
            fontWeight: "800",
            textAlign: "left",
            letterSpacing: 0.1,
          }}
        >
          {shift.facility?.name}
        </Voltra.Text>
      </Voltra.HStack>

      <Voltra.HStack
        style={{
          alignItems: "flex-start",
          width: "100%",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Voltra.Symbol
          name="mappin.and.ellipse"
          size={12}
          tintColor={TEXT_MUTED}
        />
        <Voltra.Text
          style={{
            color: TEXT_MUTED,
            fontSize: 12,
            textAlign: "left",
            flex: 1,
          }}
        >
          {shift.facility?.address}
        </Voltra.Text>
      </Voltra.HStack>

      <Voltra.VStack style={{ width: "100%", gap: 6, marginBottom: 12 }}>
        <Voltra.LinearProgressView
          startAtMs={shiftStart}
          endAtMs={shiftEnd}
          progressColor={BRAND}
          trackColor={TRACK}
          height={6}
          cornerRadius={3}
          style={{ width: "100%" }}
        />
        <Voltra.HStack
          style={{ width: "100%", justifyContent: "space-between" }}
        >
          <Voltra.Text style={{ color: TEXT_FAINT, fontSize: 11 }}>
            {timeElapsed}
          </Voltra.Text>
          <Voltra.Spacer />
          <Voltra.Text
            style={{
              color: TEXT_FAINT,
              fontSize: 11,
              fontVariant: ["tabular-nums"],
            }}
          >
            {progressPercent}%
          </Voltra.Text>
        </Voltra.HStack>
      </Voltra.VStack>

      <Voltra.View
        style={{
          width: "100%",
          height: 1,
          backgroundColor: HAIRLINE,
          marginBottom: 10,
        }}
      />

      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Voltra.HStack style={{ alignItems: "center", gap: 5 }}>
          <Voltra.Symbol name="person.fill" size={11} tintColor={TEXT_MUTED} />
          <Voltra.Text
            style={{
              color: TEXT_MUTED,
              fontSize: 11,
              textAlign: "left",
            }}
          >
            {shift.hcp?.first_name} {shift.hcp?.last_name}
          </Voltra.Text>
        </Voltra.HStack>

        <Voltra.Spacer />

        <Voltra.HStack style={{ alignItems: "center", gap: 5 }}>
          <Voltra.Symbol
            name="briefcase.fill"
            size={11}
            tintColor={TEXT_MUTED}
          />
          <Voltra.Text
            style={{
              color: TEXT_MUTED,
              fontSize: 11,
              textAlign: "right",
            }}
          >
            {shift.profession?.name}
          </Voltra.Text>
        </Voltra.HStack>
      </Voltra.HStack>
    </Voltra.VStack>
  );

  return { minimal, compact, expanded, lockScreen: expanded };
}
