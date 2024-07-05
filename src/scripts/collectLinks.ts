import { BotManager } from "@/bots";
import { waitUntil, setupProcess } from "@/utils";
import { COLLECT_LINKS } from "@/actions";
import dbManager from "@/db";

setupProcess();

(async function () {
  const botManager = new BotManager();
  // Start watchers for all bots
  await botManager.startBots();

  const gen = botManager.getBotGenerator();
  while (true) {
    const { value: bot } = gen.next();
    if (!bot) {
      break;
    }

    await waitUntil(() => {
      return botManager.getRunningBots().length < dbManager.maxRunningBots;
    });

    bot.addAction(COLLECT_LINKS);
  }

  await waitUntil(() => {
    return botManager.getRunningBots().length === 0;
  });

  console.log("EXITING");
  process.exit();
})();
