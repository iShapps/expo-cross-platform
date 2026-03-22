import { IShift } from "@/data-types/shifts";
import React from "react";
import { Voltra } from "voltra";

const BG = "#111827";
const BG_COMPACT = "#111827";

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

  const minimal = (
    <Voltra.View
      style={{
        backgroundColor: BG,
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
    >
      <Voltra.Text
        style={{ color: "#70C601", fontSize: 12, fontWeight: "700" }}
      >
        {timeRemaining}
      </Voltra.Text>
    </Voltra.View>
  );

  const compact = (
    <Voltra.HStack
      style={{
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 8,
        backgroundColor: BG_COMPACT,
      }}
    >
      <Voltra.Text style={{ fontSize: 11 }}>🟢</Voltra.Text>
      <Voltra.Text
        style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }}
      >
        {shift.facility?.name}
      </Voltra.Text>
      <Voltra.Text
        style={{ color: "#70C601", fontSize: 12, fontWeight: "700" }}
      >
        {timeRemaining}
      </Voltra.Text>
    </Voltra.HStack>
  );

  const expanded = (
    <Voltra.VStack
      style={{
        padding: 18,
        paddingVertical: 20,
        alignItems: "flex-start",
        gap: 0,
        backgroundColor: BG,
      }}
    >
      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Voltra.HStack
          style={{
            // backgroundColor: "rgba(112,198,1,0.18)",
            width: "100%",
            borderRadius: 8,
            paddingHorizontal: 0,
            paddingVertical: 4,
            alignItems: "flex-start",
            gap: 5,
            flex: 1,
            marginLeft: -50,
          }}
        >
          <Voltra.Text style={{ fontSize: 11 }}>🟢</Voltra.Text>
          <Voltra.Text
            style={{
              color: "#70C601",
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

        <Voltra.Text
          style={{
            color: "#ffffff",
            fontSize: 13,
            fontWeight: "700",
            textAlign: "right",
            fontVariant: ["tabular-nums"],
            letterSpacing: 0.3,
          }}
        >
          {timeRemaining}
        </Voltra.Text>
      </Voltra.HStack>

      <Voltra.Text
        style={{
          color: "#ffffff",
          fontSize: 17,
          fontWeight: "800",
          textAlign: "left",
          letterSpacing: 0.1,
          marginBottom: 10,
          width: "100%",
        }}
      >
        🏢 {shift.facility?.name}
      </Voltra.Text>

      <Voltra.HStack
        style={{
          alignItems: "flex-start",
          width: "100%",
          gap: 4,
          marginBottom: 14,
          marginTop: 5,
        }}
      >
        <Voltra.Text
          style={{
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            textAlign: "left",
            flex: 1,
          }}
        >
          📍 {shift.facility?.address}
        </Voltra.Text>
      </Voltra.HStack>

      <Voltra.VStack style={{ width: "100%", gap: 6, marginBottom: 10 }}>
        <Voltra.View
          style={{
            width: "100%",
            height: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.15)",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          <Voltra.View
            style={{
              flex: progressPercent / 100,
              borderRadius: 999,
              height: "100%",
              backgroundColor: "#70C601",
            }}
          />

          <Voltra.View
            style={{
              flex: 1 - progressPercent / 100,
              borderRadius: 999,
              height: "100%",
            }}
          />
        </Voltra.View>
      </Voltra.VStack>

      <Voltra.View
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "rgba(255,255,255,0.08)",
          marginBottom: 10,
        }}
      />

      <Voltra.HStack
        style={{
          width: "100%",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Voltra.HStack style={{ alignItems: "center", gap: 4 }}>
          <Voltra.Text style={{ fontSize: 11 }}>👤</Voltra.Text>
          <Voltra.Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              textAlign: "left",
              flex: 1,
            }}
          >
            {shift.hcp?.first_name} {shift.hcp?.last_name}
          </Voltra.Text>
        </Voltra.HStack>

        <Voltra.HStack style={{ alignItems: "center", gap: 4 }}>
          <Voltra.Text style={{ fontSize: 11 }}>💼</Voltra.Text>
          <Voltra.Text
            style={{
              color: "rgba(255,255,255,0.5)",
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
