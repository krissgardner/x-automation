import * as selectors from "@/selectors";
import {
  ActionType,
  CHECK_IF_LOGGED_IN,
  COLLECT_LINKS,
  LOG_IN,
  REPOST,
  SEND_MESSAGE,
} from "@/actions";
import { delay } from "@/utils";
import Bot from "./Bot";

async function checkIfLoggedIn(this: Bot) {
  // TODO checkIfLoggedIn
}

async function logIn(this: Bot) {
  // TODO logIn
}

async function sendMessage(this: Bot) {
  // TODO sendMessage
}

async function collectLinks(this: Bot) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (!this.page) {
    this.page = await this.browser.newPage();
  }

  await this.page.goto("https://x.com/messages");

  await this.page.waitForNavigation({
    timeout: 5000,
    waitUntil: "networkidle2",
  });

  const convoElements = await this.page.$$(selectors.CONVERSATIONS);

  const conversations = [] as { user: string; links: string[] }[];

  for (const elem of convoElements) {
    const innerText = await this.page.evaluate(
      (e: HTMLElement) => e.innerText,
      elem,
    );
    if (!innerText || !innerText.includes("@")) {
      continue;
    }

    const [, user] = innerText.split("\n");
    if (!user) {
      throw new Error("User handler not found!");
    }

    await elem.click();

    await this.page.waitForSelector(selectors.DM_SCROLLER_CONTAINER);

    const container = await this.page.$(selectors.DM_SCROLLER_CONTAINER);
    if (container === null) {
      throw new Error("selectors.DM_SCROLLER_CONTAINER returned null");
    }

    // Get all a links inside container, then get all href attributes
    const allHrefs = await this.page.evaluate((container) => {
      const anchors = Array.from(container.getElementsByTagName("a"));
      return anchors.map((a) => a.href);
    }, container);

    const hrefs = allHrefs.filter((url: unknown) => {
      return (
        typeof url === "string" &&
        !url.toLowerCase().includes(this.username.toLowerCase()) &&
        url.includes("/status/")
      );
    });

    conversations.push({ user, links: hrefs });

    await delay(200);
  }

  this.patchMeta({ conversations });

  return conversations;
}

async function repost(this: Bot, url: string, user: string) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (!url || !url.includes("/status/")) {
    throw new Error(`Invalid url: ${url}`);
  }

  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  await this.page.goto(url);

  await this.page.waitForSelector("article", {
    timeout: 10000,
  });

  const articles = await this.page.$$("article");

  for (const article of articles) {
    const innerText = await this.page.evaluate(
      (e: HTMLElement) => e.innerText,
      article,
    );
    if (!innerText || !innerText.includes("@")) {
      continue;
    }

    try {
      const [, articleUser] = innerText.split("\n");
      if (
        !articleUser ||
        articleUser.trim().toLowerCase() !== user.trim().toLowerCase()
      ) {
        continue;
      }
    } catch (e) {
      // Not important at this stage
      continue;
    }

    // Identified a tweet in the thread from the user

    const retweetBtn = await article.$('button[data-testid="retweet"]');
    if (!retweetBtn) {
      throw new Error("Retweet button not found");
    }

    await retweetBtn.click();
    await delay(500);

    const repostDiv = await this.page.$(selectors.REPOST_MENU_ITEM);
    if (!repostDiv) {
      throw new Error("Repost div not found");
    }

    await repostDiv.click();
    await delay(1000);

    break;
  }
}

export type Handlers = {
  [key in ActionType]: (this: Bot, ...args: any[]) => Promise<unknown>;
};

const handlers: Handlers = {
  [CHECK_IF_LOGGED_IN]: checkIfLoggedIn,
  [LOG_IN]: logIn,
  [COLLECT_LINKS]: collectLinks,
  [SEND_MESSAGE]: sendMessage,
  [REPOST]: repost,
};

export default handlers;
