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

  constructor({
    key,
    params = [],
    retries = 0,
    priority = 0,
    ignoreErrors = false,
  }: ActionParams) {
    this.key = Action.createKey(key);
    this.params = params;
    this.retries = retries;
    this.priority = priority;
    this.ignoreErrors = ignoreErrors;
  }

  static PREFIX = "ACTION_";

  static createKey(key: string) {
    if (!key.startsWith(this.PREFIX)) {
      return `${this.PREFIX}${key}`;
    }
    return key;
  }
}

export default Action;
