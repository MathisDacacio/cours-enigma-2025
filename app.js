const express = require("express");
const app = express();
const axios = require("axios");

// Affiche les données en JSON pour la requête GET '/' par défaut.
app.get("/", (req, res) => {
  const year = req.query.year; // Récupère le paramètre 'year' de la query string
  if (!year) {
    return res.status(400).send({ error: "Veuillez spécifier l'année" });
  }

  const urlAPI = `https://api.iucnredlist.org/api/v1/search?taxonName=&year=${year}&format=json&fields=name,conservationStatus`;

  axios
    .get(urlAPI)
    .then((response) => {
      res.send(response.data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send({
        error: "Une erreur est survenue lors de la récupération des données",
      });
    });
});

// Démarrage du serveur
const port = 3000;
app.listen(port, () => {
  console.log(`Serveur démarré à http://localhost:${port}`);
});
