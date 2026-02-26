import "dotenv/config";
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hola mundo!");
});

app.listen(process.env.PORT, () => {
  console.log(`API corriendo en el puerto ${process.env.PORT}`);
});