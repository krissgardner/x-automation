import path from "path";
import DBManager from "./DBManager";

const storagePath =
  process.env.NODE_ENV === "production"
    ? path.join(path.dirname(__dirname), "storage.json")
    : "storage.json";

const dbManager = new DBManager(storagePath);

dbManager.checkIntegrity();

export default dbManager;
