import "react-native-reanimated";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { useNetInfo } from "./src/hooks/useNetInfo";
import NoConnectionBanner from "./src/components/NoConnectionBanner";
import AppNavigator from "./src/navigation/AppNavigator";

// Prevent the native splash from auto-hiding — we'll hide it once auth resolves.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { loading } = useAuth();
  const { offline } = useNetInfo();

  // Hide the native splash as soon as the auth check is done.
  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  return (
    <>
      <AppNavigator />
      <NoConnectionBanner visible={offline} />
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
