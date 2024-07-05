export interface BrowserStatus {
  status: string;
  ws: {
    puppeteer: string;
  };
}

export interface BrowserConnection {
  ws: {
    puppeteer: string;
  };
}

export interface Profile {
  username: string;
  ads_power_profile_id: string;
  dmLink?: string;
}

export interface Config {
  maxRunningBots: number;
  dmTemplate: string;
}

export interface CredentialsStorage {
  adsPowerEndpoint: string;
  adsPowerLocalEndpoint: string;
  adsPowerApiKey: string;
}

export interface BotsStorage {
  config: Config;
  profiles: Profile[];
}

export interface Storage {
  credentials: CredentialsStorage;
  bots: BotsStorage;
  meta: Record<string, unknown>;
}
