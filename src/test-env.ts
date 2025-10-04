import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, ".env") });

console.log("Loaded ENV:", process.env.JWT_SECRET, process.env.JWT_REFRESH_SECRET);
