import axios, { AxiosResponse } from "axios";
import puppeteer, { Browser } from "puppeteer";
import { BrowserConnection, BrowserStatus } from "@/types";

class AdsPowerManager {
  readonly endpoint: string;
  readonly apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async checkServerConnection(): Promise<boolean> {
    // https://localapi-doc-en.adspower.com/docs/6DSiws
    try {
      const res: AxiosResponse = await axios.get(`${this.endpoint}/status`, {
        headers: {
          "api-key": this.apiKey,
        },
      });
      return res?.data?.code === 0;
    } catch (e) {
      console.error("Ads Power API is not available");
      return false;
    }
  }

  async openBrowser(profileId: string): Promise<BrowserConnection | undefined> {
    // https://localapi-doc-en.adspower.com/docs/FFMFMf
    try {
      const res: AxiosResponse = await axios.get(
        `${this.endpoint}/api/v1/browser/start`,
        {
          params: {
            user_id: profileId,
            open_tabs: 1,
            ip_tab: 0,
          },
          headers: {
            "api-key": this.apiKey,
          },
        },
      );

      const { data, code } = res.data;

      if (code !== 0) {
        console.error("Couldn't open browser for profile id", profileId);
        return;
      }

      return data;
    } catch (e) {
      console.error("Couldn't open browser for profile id", profileId);
    }
  }

  async closeBrowser(profileId: string): Promise<boolean> {
    try {
      const res: AxiosResponse = await axios.get(
        `${this.endpoint}/api/v1/browser/stop`,
        {
          params: {
            user_id: profileId,
          },
          headers: {
            "api-key": this.apiKey,
          },
        },
      );

      return res?.data?.data?.code === 0;
    } catch (e) {
      console.log("Couldn't close browser for profile id", profileId);
      return false;
    }
  }

  async checkBrowserStatus(
    profileId: string,
  ): Promise<BrowserStatus | undefined> {
    try {
      const res: AxiosResponse = await axios.get(
        `${this.endpoint}/api/v1/browser/active`,
        {
          params: {
            user_id: profileId,
          },
          headers: {
            "api-key": this.apiKey,
          },
        },
      );

      const { data, code } = res.data;

      if (code !== 0) {
        return;
      }

      return data;
    } catch (e) {
      console.log("Couldn't check status for profile id", profileId);
      return;
    }
  }

  async getBrowser(id: string): Promise<Browser | undefined> {
    let connection: string | undefined;

    const browserStatus: BrowserStatus | undefined =
      await this.checkBrowserStatus(id);
    if (browserStatus?.status === "Active") {
      connection = browserStatus.ws.puppeteer;
    } else {
      const browserConnection: BrowserConnection | undefined =
        await this.openBrowser(id);
      if (!browserConnection) {
        return;
      }
      connection = browserConnection.ws.puppeteer;
    }

    if (!connection) {
      return;
    }

    const browserWSEndpoint = connection;
    return await puppeteer.connect({
      browserWSEndpoint,
      defaultViewport: { width: 1500, height: 800 },
    });
  }
}

export default AdsPowerManager;
