import { Link } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const index = () => {
  return (
    <View style={styles.container}>
      <Text>Link to login page</Text>
      <Link href="/(open)/login">
        <Text style={{ color: "blue", marginTop: 20 }}>Go to Login</Text>
      </Link>
      ;
    </View>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    width: "100%",
    backgroundColor: "#cff59f",
    display: "flex",
    flexDirection: "column",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
});
