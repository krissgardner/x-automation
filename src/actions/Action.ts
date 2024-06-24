import { ACTIONS, ActionType } from "./constants";

export interface ActionParams {
  key: string;
  params?: any[];
  retries?: number;
  priority?: number;
  ignoreErrors?: boolean;
}

export class Action {
  key: ActionType;
  params: any[];
  retries: number;
  priority: number;
  ignoreErrors: boolean;

  static isValidKey(key: string, raiseException = false) {
    // @ts-ignore trivial
    if (ACTIONS.includes(key)) {
      return true;
    }

    if (raiseException) {
      throw new Error(`Action ${key} doesn't exist!`);
    }

    return false;
  }

  constructor({
    key,
    params = [],
    retries = 0,
    priority = 0,
    ignoreErrors = false,
  }: ActionParams) {
    Action.isValidKey(key, true);

    this.key = key as ActionType;
    this.params = params;
    this.retries = retries;
    this.priority = priority;
    this.ignoreErrors = ignoreErrors;
  }
}
