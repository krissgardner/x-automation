import DBManager from "./DBManager";
import { join } from "node:path";

const storagePath = join(__dirname, "./storage.json");
const dbManager = new DBManager(storagePath);

dbManager.checkIntegrity();

export default dbManager;
