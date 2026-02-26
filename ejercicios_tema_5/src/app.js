import "dotenv/config";
import express from "express";
import dbConnect from "./config/db.js";

const app = express();

console.log("DB_URI:", process.env.DB_URI);  
console.log("PORT:", process.env.PORT);

dbConnect();

app.listen(process.env.PORT, () => {
  console.log(`API corriendo en el puerto ${process.env.PORT}`);
});