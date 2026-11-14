/**
 * Usage data source abstraction.
 *
 * The web prototype can only simulate usage: browsers cannot see or block other
 * apps. A future native shell can implement this interface with real, explicitly
 * granted platform APIs:
 *  - Android: UsageStatsManager (PACKAGE_USAGE_STATS, granted by the user in
 *    system settings) for usage, optionally an AccessibilityService for showing
 *    the break screen when a limited app is opened.
 *  - iOS: Screen Time API (FamilyControls / DeviceActivity / ManagedSettings),
 *    which requires an Apple-approved entitlement and user authorization.
 */
export type UsageProviderKind = "simulated" | "android-usagestats" | "ios-screentime";

export interface UsageProvider {
  kind: UsageProviderKind;
  label: string;
  /** Whether the provider can read real system-wide usage. */
  readsRealUsage: boolean;
  /** Whether the provider can actually block or interrupt other apps. */
  canBlockApps: boolean;
  requestPermission(): Promise<"granted" | "denied" | "unsupported">;
}

export const simulatedUsageProvider: UsageProvider = {
  kind: "simulated",
  label: "Simulace (webový prototyp)",
  readsRealUsage: false,
  canBlockApps: false,
  async requestPermission() {
    return "unsupported";
  },
};

export function getUsageProvider(): UsageProvider {
  return simulatedUsageProvider;
}
