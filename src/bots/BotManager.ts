import dbManager from "../db";
import Bot from "./Bot";
import { IDLE, ERROR } from "../globalConstants";
import { shuffle } from "../utils";

class BotManager {
  bots: { [key: string]: Bot };

  constructor() {
    this.bots = {};
  }

  async startBots() {
    const profileList = dbManager.profiles.filter((profile) => {
      return !!profile.ads_power_profile_id;
    });

    // Init bots async
    await Promise.allSettled(
      profileList.map(async (data) => {
        const bot = new Bot(data);
        this.bots[bot.username] = bot;
        return bot.startTaskWatcher();
      }),
    );
  }

  getRunningBots(): Bot[] {
    return Object.values(this.bots).filter((bot) => {
      return ![IDLE, ERROR].includes(bot.status);
    });
  }

  getIdleBots(): Bot[] {
    return Object.values(this.bots).filter((bot) => {
      return bot.status === IDLE;
    });
  }

  *getBotGenerator() {
    const bots = shuffle<Bot[]>(
      Object.values(this.bots).filter((b) => b.status !== ERROR),
    );
    for (const bot of bots) {
      yield bot;
    }
  }

  // async assignDirectMessages() {
  //   const accounts: any[] = []; // TODO: GET accounts from DB
  //   if (!accounts.length) {
  //     return;
  //   }
  //
  //   const { config } = dbManager.bots;
  //
  //   const generator = this.getBotGenerator();
  //
  //   while (true) {
  //     const bot = generator.next().value;
  //     if (bot === undefined) {
  //       break;
  //     }
  //
  //     await waitUntil(() => {
  //       return this.getRunningBots().length < dbManager.maxRunningBots;
  //     });
  //
  //     do {
  //       // TODO: bot.addAction("doRandomActions");
  //
  //       const noAccounts = getRandomNumber(config.minDM, config.maxDM);
  //       const selectedAccounts = accounts.splice(0, noAccounts);
  //
  //       selectedAccounts.forEach((account) => {
  //         bot.addAction("sendMessage", {
  //           params: [account],
  //           retries: 1,
  //           ignoreErrors: true,
  //         });
  //       });
  //     } while (accounts.length > 0);
  //   }
  //
  //   // TODO: Delete accounts from DB
  // }
}

export default BotManager;
