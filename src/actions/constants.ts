export const CHECK_IF_LOGGED_IN = "CHECK_IF_LOGGED_IN";
export const LOG_IN = "LOG_IN";
export const COLLECT_LINKS = "COLLECT_LINKS";
export const SEND_MESSAGE = "SEND_MESSAGE";
export const REPOST = "REPOST";

export const ACTIONS = [
  CHECK_IF_LOGGED_IN,
  LOG_IN,
  COLLECT_LINKS,
  SEND_MESSAGE,
  REPOST,
] as const;
export type ActionType = (typeof ACTIONS)[number];
