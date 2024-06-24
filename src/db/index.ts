import DBManager from "./DBManager";

const dbManager = new DBManager("storage.json");

dbManager.checkIntegrity();

export default dbManager;
