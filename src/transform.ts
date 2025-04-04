import { Database } from "./database.js";

export const promoteExtractedPlaces = () => {
  console.log("--------------------------------");
  console.log("Promoting extracted places");
  using db = new Database();
  db.promoteExtractedPlaces();
  console.log("--------------------------------");
};
