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
    if (!this.hasOwnProperty(key)) {
      throw new Error(`${key} does not exist!`);
    }

    const action = new Action({ key, ...options });
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

    return true;
  }

  get meta() {
    return dbManager.getBotMeta(this.username);
  }

  patchMeta(payload: any) {
    return dbManager.patchBotMeta(this.username, payload);
  }

  async checkIfLoggedIn() {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    this.addAction("logIn", { retries: 3, priority: -100 });
  }

  async logIn() {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    await this.page.waitForNavigation({ timeout: 10000 });
  }

  async sendMessage(profileUrl: string, message: string) {
    if (this.page === undefined) {
      this.page = await this.browser.newPage();
    }

    await this.page.goto(profileUrl);

    const messageButtonSelector =
      "#mount_0_0_3y > div > div > div.x9f619.x1n2onr6.x1ja2u2z > div > div > div.x78zum5.xdt5ytf.x1t2pt76.x1n2onr6.x1ja2u2z.x10cihs4 > div:nth-child(2) > div > div.x1gryazu.xh8yej3.x10o80wk.x14k21rp.x17snn68.x6osk4m.x1porb0y > section > main > div > header > section.x1xdureb.x1agbcgv.x1wo17tc.xieb3on.x6ikm8r.x10wlt62.xlrpkbc > div > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1c4vz4f.x2lah0s.x1q0g3np.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div > div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x6ikm8r.x10wlt62.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > div";

    await this.page.waitForSelector(messageButtonSelector, { timeout: 5000 });
    await this.page.click(messageButtonSelector, { timeout: 5000 });
  }
}

export default Bot;
