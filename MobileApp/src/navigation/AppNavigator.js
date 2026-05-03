import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/colors";

// Screens
import SplashScreen from "../screens/SplashScreen";
import HomeScreen from "../screens/HomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import AboutScreen from "../screens/AboutScreen";
import ContactScreen from "../screens/ContactScreen";
import CoursesScreen from "../screens/CoursesScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ListsScreen from "../screens/ListsScreen";
import VideoScreen from "../screens/VideoScreen";
import ChatbotScreen from "../screens/ChatbotScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab icon component ────────────────────────────────────────────────────
function TabIcon({ emoji, focused }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
    </View>
  );
}

// ─── PUBLIC bottom tabs (not logged in) ───────────────────────────────────
function PublicTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(11,17,32,0.97)",
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PublicCourses"
        component={CoursesScreen}
        options={{
          tabBarLabel: "Courses",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🎓" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PublicSubscription"
        component={SubscriptionScreen}
        options={{
          tabBarLabel: "Plans",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⭐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="About"
        component={AboutScreen}
        options={{
          tabBarLabel: "About",
          tabBarIcon: ({ focused }) => <TabIcon emoji="ℹ" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          tabBarLabel: "Contact",
          tabBarIcon: ({ focused }) => <TabIcon emoji="✉" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── MAIN bottom tabs (logged in) ─────────────────────────────────────────
function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "rgba(11,17,32,0.97)",
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 20,
          shadowColor: "#000",
          shadowOpacity: 0.5,
          shadowRadius: 16,
        },
        tabBarActiveTintColor: COLORS.cyan,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", marginTop: -2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ focused }) => <TabIcon emoji="◈" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsScreen}
        options={{
          tabBarLabel: "Lists",
          tabBarIcon: ({ focused }) => <TabIcon emoji="≡" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          tabBarLabel: "AI Chat",
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { token, loading } = useAuth();

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgPrimary },
          animation: "fade",
        }}
      >
        {!token ? (
          // ── Unauthenticated ──
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="PublicTabs" component={PublicTabs} options={{ animation: "fade" }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: "slide_from_right" }} />
          </>
        ) : (
          // ── Authenticated ──
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Video" component={VideoScreen} options={{ animation: "slide_from_bottom" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="Courses" component={CoursesScreen} options={{ animation: "slide_from_right" }} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ animation: "slide_from_bottom" }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconActive: {
    backgroundColor: "rgba(14,165,233,0.15)",
  },
  tabEmoji: { fontSize: 16 },
});
