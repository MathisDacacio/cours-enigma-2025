const express = require("express");
// https://www.npmjs.com/package/ejs
const ejs = require("ejs");
const fs = require("fs");
const axios = require("axios");

const app = express();

const indexPath = __dirname + "/views/index.ejs";
console.log("getting index template at " + indexPath);

let index = ejs.compile(fs.readFileSync(indexPath, "utf8"));

app.get("/", (req, res) => {
  res.send(
    index({
      pays: [{ name: "France", id: "FR" }],
      species: [
        {
          name: "Requin-taupe commun",
          type: "type ?",
          status: "status ?",
          year: "Année ?",
        },
      ],
    }),
  );
});
// Démarrage du serveur
const port = 3000;
app.listen(port, () => {
  console.log(`Serveur démarré à http://localhost:${port}`);
});
