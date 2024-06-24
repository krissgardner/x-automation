export const CHECK_IF_LOGGED_IN = "CHECK_IF_LOGGED_IN";
export const LOG_IN = "LOG_IN";
export const COLLECT_MESSAGES = "COLLECT_MESSAGES";

export const ACTIONS = [CHECK_IF_LOGGED_IN, LOG_IN, COLLECT_MESSAGES] as const;
export type ActionType = (typeof ACTIONS)[number];
