const express = require("express");
// https://www.npmjs.com/package/ejs
const ejs = require("ejs");
const fs = require("fs");
const axios = require("axios");
const rateLimit = require("axios-rate-limit");
require("dotenv").config();

const app = express();

const IUCN_AUTH_HEADER = {
  headers: {
    Authorization: process.env.IUCN_API_TOKEN,
  },
};
const iucnClient = rateLimit(axios.create(), {
  maxRequests: 1,
  perMilliseconds: 1000,
  maxRPS: 2,
});

function extractCountryInfos(country) {
  return {
    name: country.name.common,
    id: country.cca2,
  };
}

let countries = [];
// Use axios to fetch country list from restcountries api
console.log("Using axios to load countries list");
iucnClient.get("https://restcountries.com/v3.1/all").then(function (response) {
  let inputCountries = response.data.map(extractCountryInfos);
  inputCountries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  countries = countries.concat(inputCountries);
  console.log(`Obtained ${countries.length} countries`);
});

const indexPath = __dirname + "/views/index.ejs";
console.log("getting index template at " + indexPath);

let index = ejs.compile(fs.readFileSync(indexPath, "utf8"));

app.get("/", (req, res) => {
  res.send(
    index({
      pays: countries,
      species: [
        {
          name: "Requin-taupe commun",
          status: "status ?",
          year: "Année ?",
        },
      ],
    }),
  );
});

app.get("/get-species-for/:codePays", async function (req, res) {
  console.info(`Searching for endangered species in "${req.params.codePays}"`);
  // This is dangerous !
  const url = `https://api.iucnredlist.org/api/v4/countries/${req.params.codePays}`;
  return await iucnClient
    .get(url, IUCN_AUTH_HEADER)
    .then(function (response) {
      let assessments = response.data.assessments;
      assessments = assessments.slice(0, Math.min(assessments.length, 10));
      console.info(`Processing ${assessments.length} endangered species`);
      // Hack that to check some things
      Promise.all(
        assessments.map(function (assessment) {
          const assessmentId = assessment.assessment_id;
          const url = `https://api.iucnredlist.org/api/v4/assessment/${assessmentId}`;
          return iucnClient.get(url, IUCN_AUTH_HEADER);
        }),
      ).then(function (responseArray) {
        let transformedAssessments = responseArray.map(function (response) {
          console.info(`Processing ${response.data.taxon.scientific_name}`);
          return {
            name: response.data.taxon.scientific_name,
            type: "",
            status: response.data.red_list_category.description.en,
            year: response.data.year_published,
          };
        });
        transformedAssessments.sort((a, b) => a.name.localeCompare(b.name));
        res.send(transformedAssessments);
      });
    })
    .catch(function (error) {
      console.error(
        `Fetching endangered species in ${req.params.codePays} returned ${error.message}`,
      );
      res.status(500).send(error.message);
    });
});

// Démarrage du serveur
const port = 3000;
app.listen(port, () => {
  console.log(`Serveur démarré à http://localhost:${port}`);
});
