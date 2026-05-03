import "react-native-reanimated";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

import { AuthProvider } from "./src/context/AuthContext";
import { useNetInfo } from "./src/hooks/useNetInfo";
import NoConnectionBanner from "./src/components/NoConnectionBanner";
import AppNavigator from "./src/navigation/AppNavigator";

// Keep splash visible until auth check completes
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { offline } = useNetInfo();

  return (
    <>
      <AppNavigator />
      <NoConnectionBanner visible={offline} />
      <StatusBar style="light" backgroundColor="transparent" translucent />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // Hide splash after a short delay to let the JS bundle settle
    const timer = setTimeout(() => SplashScreen.hideAsync(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
