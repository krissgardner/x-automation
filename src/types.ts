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
  password: string;
  ads_power_profile_id: string;
}

export interface Config {
  maxRunningBots: number;
  minDM: number;
  maxDM: number;
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
