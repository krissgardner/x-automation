import adsPowerManager from "../adsPower";
import dbManager from "../db";
import {
  IDLE,
  STARTING,
  WAITING,
  WORKING,
  ERROR,
  CLOSING,
} from "../globalConstants";
import Action, { ActionParams } from "./Action";

export interface BotParams {
  username: string;
  password: string;
  ads_power_profile_id: string;
}

class Bot {
  username: string;
  password: string;
  ads_power_profile_id: string;
  status: number;
  browser: any;
  page: any;
  actions: Action[];
  interval: NodeJS.Timeout | undefined;
  autoClose: NodeJS.Timeout | undefined;

  constructor({ username, password, ads_power_profile_id }: BotParams) {
    if (!ads_power_profile_id) {
      throw new Error(`"ads_power_profile_id" is required!`);
    }

    this.username = username;
    this.password = password;
    this.ads_power_profile_id = ads_power_profile_id;

    this.status = IDLE;
    this.browser = undefined;
    this.page = undefined;
    this.actions = [];
    this.interval = undefined;
    this.autoClose = undefined;
  }

  addAction(key: string, options: Omit<ActionParams, "key">) {
    const actionKey = Action.createKey(key);

    if (!this.hasOwnProperty(actionKey)) {
      throw new Error(`${actionKey} does not exist!`);
    }

    const action = new Action({ key: actionKey, ...options });
    this.actions.push(action);
  }

  async initBrowser() {
    const browser = await adsPowerManager.getBrowser(this.ads_power_profile_id);
    if (!browser) {
      return;
    }

    const context = browser.defaultBrowserContext();
    await context.overridePermissions("https://www.x.com/", [
      "geolocation",
      "notifications",
    ]);

    this.browser = browser;

    return browser;
  }

  async closeBrowser() {
    console.log("CLOSING", this.username);
    return await this.browser?.close();
  }

  async startTaskWatcher() {
    this.interval = setInterval(async () => {
      switch (this.status) {
        case IDLE: {
          if (this.actions.length !== 0) {
            this.status = STARTING;

            try {
              const botRunning = await this.init();
              if (botRunning) {
                this.status = WAITING;
              } else {
                this.status = ERROR;
              }
            } catch (e) {
              this.status = ERROR;
            }
          }

          return;
        }
        case STARTING:
        case WORKING:
        case CLOSING:
          return;
        case ERROR: {
          clearInterval(this.interval);
          this.interval = undefined;
          await this.closeBrowser();
          return;
        }
      }

      if (this.actions.length === 0) {
        if (this.autoClose === undefined) {
          this.autoClose = setTimeout(async () => {
            this.status = CLOSING;
            await this.closeBrowser();
            this.status = IDLE;
          }, 5 * 1000);
          console.log(`CLOSING ${this.username} in 5 seconds...`);
        }
        return;
      }

      if (this.autoClose) {
        clearTimeout(this.autoClose);
        this.autoClose = undefined;

        console.log(`ABORT CLOSE ${this.username}`, this.username);
      }

      const priorities = this.actions.map((a) => a.priority);
      const highestPriority = Math.min(...priorities);
      const actionIndex = this.actions.findIndex(
        (a) => a.priority === highestPriority,
      );
      const [action] = this.actions.splice(actionIndex, 1);

      try {
        this.status = WORKING;
        console.log(
          `${this.username}: (${action.retries}) ${action.key} started!`,
        );

        // try block should catch invalid key names
        // TODO: Implement function binding / method naming convention (ACTION_[key]) in order to prevent mistakes
        // @ts-ignore
        await this[action.key](...action.params);

        console.log(
          `${this.username}: (${action.retries}) ${action.key} done!`,
        );
      } catch (e) {
        console.log(`${this.username}: ${String(e)}`);

        if (action.retries) {
          this.addAction(action.key, {
            retries: action.retries - 1,
            priority: action.priority - 1,
            params: action.params,
            ignoreErrors: action.ignoreErrors,
          });
        } else if (!action.ignoreErrors) {
          this.status = ERROR;
        }
      }

      if (this.status === WORKING) {
        this.status = WAITING;
      }
    }, 1000);

    console.log(`LISTENING ${this.username}`);
  }

  async init() {
    console.log(`INIT ${this.username}`);

    const browser = await this.initBrowser();
    if (!browser) {
      return false;
    }

    // TODO: Add validation checks

    return true;
  }

  get meta() {
    return dbManager.getBotMeta(this.username);
  }

  patchMeta(payload: any) {
    return dbManager.patchBotMeta(this.username, payload);
  }
}

export default Bot;
