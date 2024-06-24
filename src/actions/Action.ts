import * as actions from "./actions";

export interface ActionParams {
  key: string;
  params?: any[];
  retries?: number;
  priority?: number;
  ignoreErrors?: boolean;
}

class Action {
  key: string;
  params: any[];
  retries: number;
  priority: number;
  ignoreErrors: boolean;

  static isValidKey(key: string, raiseException = false) {
    const validActions = Object.values(actions) as string[];
    if (validActions.includes(key)) {
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

    this.key = key;
    this.params = params;
    this.retries = retries;
    this.priority = priority;
    this.ignoreErrors = ignoreErrors;
  }
}

export default Action;
