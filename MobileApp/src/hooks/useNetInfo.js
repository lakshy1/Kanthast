import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useNetInfo() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState("unknown");

  useEffect(() => {
    // Fetch current state immediately
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
      setConnectionType(state.type);
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
      setConnectionType(state.type);
    });

    return unsubscribe;
  }, []);

  const offline = !isConnected || isInternetReachable === false;

  return { isConnected, isInternetReachable, connectionType, offline };
}
