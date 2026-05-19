export const features = {
  DM_ENABLED: false,
  AI_QA_ENABLED: true,
  RECENT_LIKERS_VISIBLE: true,
  RECOMMENDATIONS_VISIBLE: true,
  HOT_TAB_VISIBLE: true,
  TOPICS_TAB_VISIBLE: true,
} as const;

export type FeatureFlag = keyof typeof features;
