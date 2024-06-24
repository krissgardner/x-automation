import * as selectors from "../selectors";
import Bot from "./Bot";
import {
  ActionType,
  CHECK_IF_LOGGED_IN,
  COLLECT_MESSAGES,
  LOG_IN,
} from "../actions/constants";

async function checkIfLoggedIn(this: Bot) {
  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  // this.addAction(LOG_IN, { retries: 3, priority: -100 });
}

async function logIn(this: Bot) {
  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  await this.page.waitForNavigation({ timeout: 10000 });
}

async function collectMessages(this: Bot) {
  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  await this.page.goto("https://x.com/messages");

  const conversationElements = await this.page.$$(selectors.CONVERSATIONS);

  const allMessages = [];

  for (const elem of conversationElements) {
    const text = await this.page.evaluate(
      (e: HTMLElement) => e.textContent,
      elem,
    );
    if (text.includes("@")) {
      await elem.click();

      await this.page.waitForSelector(selectors.CURRENT_MESSAGES);

      const messages: HTMLElement[] = await this.page.$$(
        selectors.CURRENT_MESSAGES,
      );

      const messagesText = await Promise.all(
        messages.map(async (message) => {
          return await this.page.evaluate(
            (el: HTMLElement) => el.textContent,
            message,
          );
        }),
      );

      // push the obtained conversation messages into the allMessages array
      allMessages.push(messagesText);
    }
  }
  return allMessages;
}

export type Handlers = {
  [key in ActionType]: (this: Bot, ...args: unknown[]) => Promise<unknown>;
};

const handlers: Handlers = {
  [CHECK_IF_LOGGED_IN]: checkIfLoggedIn,
  [LOG_IN]: logIn,
  [COLLECT_MESSAGES]: collectMessages,
};

export default handlers;
