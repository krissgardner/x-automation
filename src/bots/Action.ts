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
    this.key = key;
    this.params = params;
    this.retries = retries;
    this.priority = priority;
    this.ignoreErrors = ignoreErrors;
  }
}

export default Action;
