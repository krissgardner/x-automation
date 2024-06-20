import JSONdb from "simple-json-db";
import { BotsStorage, CredentialsStorage } from "../types";

class DBManager extends JSONdb {
  checkIntegrity() {
    // Check bots
    const bots: BotsStorage = this.get("bots");
    if (!bots) {
      throw new Error(`Bots not set!`);
    }
    const { config, profiles } = bots;

    if (!config) {
      throw new Error(`Config not found!`);
    }
    if (!Array.isArray(profiles)) {
      throw new Error(`Profiles not array!`);
    }

    profiles.forEach((profile) => {
      const count = profiles.filter(
        (p) => p.username === profile.username,
      ).length;
      if (count !== 1) {
        throw new Error(`Username duplicate found: ${profile.username}`);
      }
    });

    // Check credentials
    const credentials = this.get("credentials");
    if (!credentials) {
      throw new Error(`Credentials not set!`);
    }
  }

  metaKey(username: string) {
    return `meta-${username}`;
  }

  getBotMeta(username: string) {
    const key = this.metaKey(username);
    const meta = this.get("meta") || {}; // Empty Meta
    return meta[key] || {};
  }

  patchBotMeta(username: string, payload: any) {
    const key = this.metaKey(username);
    const botMeta = this.getBotMeta(username);

    let result = {
      ...botMeta,
      ...payload,
    };

    const meta = this.get("meta") || {};
    meta[key] = botMeta;
    this.set("meta", meta);

    return result;
  }

  get credentials() {
    return this.get("credentials") as CredentialsStorage;
  }

  get bots() {
    return this.get("bots") as BotsStorage;
  }

  get maxRunningBots() {
    return this.bots.config.maxRunningBots ?? 10;
  }

  get profiles() {
    return this.bots.profiles;
  }
}

export default DBManager;
