import AdsPowerManager from "./AdsPowerManager";
import db from "../db";

const { adsPowerEndpoint, adsPowerApiKey } = db.credentials;
const adsPowerManager = new AdsPowerManager(adsPowerEndpoint, adsPowerApiKey);

export default adsPowerManager;
