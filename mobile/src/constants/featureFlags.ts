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
} as const;
