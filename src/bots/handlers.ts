import * as selectors from "@/selectors";
import {
  ActionType,
  CHECK_IF_LOGGED_IN,
  COLLECT_LINKS,
  LOG_IN,
  REPOST,
  SEND_MESSAGE,
  REPOST_MEDIA,
} from "@/actions";
import { delay, getDeltaInMilliseconds } from "@/utils";
import Bot from "./Bot";
import { BotProfile, MetaConversation } from "@/types";
import db from "@/db";

async function checkIfLoggedIn(this: Bot) {
  // TODO checkIfLoggedIn
}

async function logIn(this: Bot) {
  // TODO logIn
}

async function collectLinks(this: Bot) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (!this.page) {
    this.page = await this.browser.newPage();
  }

  await this.page.goto("https://x.com/messages");

  await this.page.waitForSelector(selectors.CONVERSATIONS, {
    timeout: 10000,
  });

  // Filter conversations by time
  const { dmFilters } = db.bots.config;
  const deltaInMs = getDeltaInMilliseconds(dmFilters);

  const now = new Date();

  let prevCount = 0;
  let newCount = -1;
  let scrollRetries = 3;

  while (prevCount !== newCount || scrollRetries > 0) {
    prevCount = newCount;
    scrollRetries -= 1;

    const container = await this.page.$(selectors.CONVERSATIONS_SCROLLABLE);
    if (!container) {
      throw new Error("Could not find the conversations container!");
    }

    await this.page.evaluate((container) => {
      container.scrollTop = container.scrollHeight;
    }, container);

    await delay(3000);

    const currentConversations = await this.page.$$(selectors.CONVERSATIONS);
    newCount = currentConversations.length;

    // If time filters exist
    if (deltaInMs) {
      const timeTags = await this.page.$$eval(
        `${selectors.CONVERSATIONS} time`,
        (timeEls: HTMLTimeElement[]) => timeEls.map((t) => t.dateTime),
      );

      let oldestDate: Date | null = null;

      for (let timeStr of timeTags) {
        if (!timeStr) {
          continue;
        }

        const date = new Date(timeStr);

        if (oldestDate === null || date < oldestDate) {
          oldestDate = date;
        }
      }

      if (oldestDate !== null) {
        const diffInMS = now.getTime() - oldestDate.getTime();

        if (diffInMS > deltaInMs) {
          break;
        }
      }
    }

    if (prevCount !== newCount) {
      scrollRetries = 3;
    }
  }

  const convoElements = await this.page.$$(selectors.CONVERSATIONS);

  const conversations: MetaConversation[] = [];

  for (const elem of convoElements) {
    let timeStr: string | undefined;

    try {
      timeStr = await elem.$eval("time", (el) => el?.dateTime);
    } catch (e) {
      continue;
    }

    if (!timeStr) {
      continue;
    }

    const lastTime = new Date(timeStr);
    if (!!deltaInMs && now.getTime() - lastTime.getTime() > deltaInMs) {
      continue;
    }

    const innerText = await this.page.evaluate(
      (e: HTMLElement) => e.innerText,
      elem,
    );
    if (!innerText) {
      continue;
    }
    const matches = innerText.match(/@[A-Za-z0-9_]{4,14}/);
    if (!matches || matches.length < 1) {
      continue;
    }
    const user = matches[0];

    await elem.click();

    await this.page.waitForSelector(selectors.DM_SCROLLER_CONTAINER);

    const container = await this.page.$(selectors.DM_SCROLLER_CONTAINER);
    if (container === null) {
      throw new Error("DM_SCROLLER_CONTAINER not found!");
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

    conversations.unshift({ user, links: hrefs, url: this.page.url() });

    await delay(1000);
  }

  conversations.forEach((c) => {
    this.addAction(REPOST, {
      params: [c.links, c.user],
      ignoreErrors: true,
      retries: 1,
    });
  });

  this.patchMeta({ conversations });

  return conversations;
}

async function repost(this: Bot, urls: string[], user: string) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  if (!user.includes("@")) {
    user = "@" + user;
  }

  const validUrls = urls.filter((url) => {
    return !!url && url.includes("/status/");
  });

  if (!validUrls.length) {
    throw new Error(`Invalid URLs for ${user}`);
  }

  for (let url of validUrls) {
    await this.page.goto(url);

    try {
      await this.page.waitForSelector("article", {
        timeout: 10000,
      });
    } catch (e) {
      continue;
    }

    const articles = await this.page.$$("article");

    let reposted = false;
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

      const unretweetBtn = await article.$('button[data-testid="unretweet"]');
      if (unretweetBtn) {
        await unretweetBtn.click();
        await delay(500);

        const undoConfirm = await this.page.$(selectors.LAYERS_MENU_ITEM);
        await undoConfirm?.click();
        await delay(500);
      }

      // TODO: ADD LOGS, BUT DONT THROW ERRORS HERE
      const retweetBtn = await article.$('button[data-testid="retweet"]');
      if (retweetBtn) {
        await retweetBtn.click();
        await delay(500);

        const repostDiv = await this.page.$(selectors.LAYERS_MENU_ITEM);
        if (repostDiv) {
          await repostDiv?.click();
          await delay(2000);
          reposted = true;
        }
      }

      break;
    }

    if (reposted) {
      if (!user.includes(this.username)) {
        this.addAction(SEND_MESSAGE, {
          params: [user],
          ignoreErrors: true,
          retries: 1,
        });
      }

      break;
    }
  }
}

async function sendMessage(this: Bot, user: string) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  if (!user) {
    throw new Error("user not defined!");
  }

  if (!user.startsWith("@")) {
    user = "@" + user;
  }

  const conversations = this.meta.conversations || [];
  const conversation = conversations.find(
    (c: MetaConversation) => c.user === user,
  );
  const url = conversation?.url;
  if (!url) {
    throw new Error("Conversation url not found!");
  }

  await this.page.goto(url);

  await this.page.waitForSelector(selectors.TEXTBOX);

  const textbox = await this.page.$(selectors.TEXTBOX);
  if (!textbox) {
    throw new Error("Textbox not found!");
  }

  await textbox.click();
  await delay(500);

  let message = db.bots.config.dmTemplate;
  const profile = this.dbProfile;

  const regexp = /{{(\w+)}}/g; // matches {{variable}}
  message = message.replace(regexp, (_match, variable: string) => {
    if (!(variable in profile)) {
      throw new Error(`Variable "${variable}" is not defined!`);
    }
    return String(profile[variable as keyof BotProfile]);
  });

  // Type the resulting message using keyboard events
  await this.page.keyboard.type(message, {
    delay: 10,
  });
  await delay(200);

  await this.page.waitForSelector(selectors.SEND_BUTTON);
  const sendButton = await this.page.$(selectors.SEND_BUTTON);
  if (!sendButton) {
    throw new Error("Send button not found!");
  }

  await sendButton.click();
  await delay(1000);
}

async function repostMedia(this: Bot) {
  if (!this.browser) {
    throw new Error("Browser does not exist!");
  }

  if (this.page === undefined) {
    this.page = await this.browser.newPage();
  }

  await this.page.goto(`https://x.com/${this.username}/media`);

  await this.page.waitForSelector(selectors.MEDIA_LINKS, { timeout: 10000 });

  const relativeLinks = (
    await this.page.$$eval(selectors.MEDIA_LINKS, (links) =>
      links.map((link) => link.getAttribute("href")),
    )
  ).filter((link) => !!link) as string[];

  const mediaUrls = relativeLinks
    .filter((l) => l.includes("/status/"))
    .slice(0, 10)
    .map((l) => l.replace(/(\/\w+\/status\/\d+).*/, "$1"))
    .map((l) => `https://x.com${l}`);

  mediaUrls.forEach((url) => {
    this.addAction(REPOST, { params: [[url], `@${this.username}`] });
  });
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
  [REPOST_MEDIA]: repostMedia,
};

export default handlers;
