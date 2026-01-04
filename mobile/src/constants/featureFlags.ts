/**
 * Feature flags for controlling experimental or incomplete features.
 * Set to true to enable, false to disable.
 */

export const FeatureFlags = {
  /**
   * Custom scoring configuration (closest/furthest points).
   * Currently not implemented in backend - UI exists but values are ignored.
   * @default false
   */
  ENABLE_CUSTOM_SCORING: false,

  /**
   * Auto-progression from round results and best/worst screens.
   * When enabled, screens auto-advance after a delay.
   * When disabled, users must manually tap Continue.
   * @default false
   */
  ENABLE_AUTO_PROGRESSION: false,
} as const;
