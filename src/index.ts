import { BotManager } from "./bots";
import { waitUntil, setupProcess } from "./utils";
import { COLLECT_LINKS } from "@/actions";

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

    bot.addAction(COLLECT_LINKS);
  }

  await waitUntil(() => {
    return botManager.getRunningBots().length === 0;
  });

  console.log("EXITING");
  process.exit();
})();
