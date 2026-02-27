import React from "react";
import { Pressable, Text, View } from "react-native";
import { Voltra } from "voltra";
import { startLiveActivity } from "voltra/client";

function HelloWorldActivity() {
  const activityUI = (
    <Voltra.VStack
      style={{ padding: 20, borderRadius: 18, backgroundColor: "#007AFF" }}
    >
      <Voltra.Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>
        Hello World from Voltra!
      </Voltra.Text>
      <Voltra.Text style={{ color: "white", fontSize: 16, marginTop: 8 }}>
        Your first live activity
      </Voltra.Text>
    </Voltra.VStack>
  );

  const startActivity = async () => {
    await startLiveActivity({
      lockScreen: activityUI,
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Pressable
        onPress={startActivity}
        style={{ padding: 20, backgroundColor: "#007AFF", borderRadius: 10 }}
      >
        <Text style={{ color: "white", fontSize: 18 }}>
          Start Live Activity
        </Text>
      </Pressable>
    </View>
  );
}
