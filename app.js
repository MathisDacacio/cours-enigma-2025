const express = require("express");
const ejs = require("ejs");
const fs = require("fs");
const axios = require("axios");
const { ConcurrencyManager } = require("axios-concurrency");
require("dotenv").config();

const app = express();

// a concurrency parameter of 1 makes all api requests secuential
const MAX_CONCURRENT_REQUESTS = 5;

// init your manager.
const manager = ConcurrencyManager(axios, MAX_CONCURRENT_REQUESTS);

const IUCN_AUTH_HEADER = {
  headers: {
    Authorization: process.env.IUCN_API_TOKEN,
  },
};
function extractCountryInfos(country) {
  return {
    name: country.name.common,
    id: country.cca2,
  };
}

let countries = [];
// Use axios to fetch country list from restcountries api
console.log("Using axios to load countries list");
axios.get("https://restcountries.com/v3.1/all").then(function (response) {
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

function extractDataFromAssessmentAPICall(userLanguage, response) {
  console.info(`Processing ${response.data.taxon.scientific_name}`);
  let returned = {
    id: response.data.assessmentId,
    latin_name: response.data.taxon.scientific_name,
    type: "",
    common_names: response.data.taxon.common_names.reduce(function (map, obj) {
      map[obj.language] = obj.name;
      return map;
    }, {}),
    status: response.data.red_list_category.description.en,
    year: response.data.year_published,
  };
  console.info(`Processed ${response.data.taxon.scientific_name}`);
  return returned;
}

app.get("/get-species-for/:codePays", async function (req, res) {
  console.info(`Searching for endangered species in "${req.params.codePays}"`);
  // This is dangerous !
  const url = `https://api.iucnredlist.org/api/v4/countries/${req.params.codePays}`;
  return axios
    .get(url, IUCN_AUTH_HEADER)
    .then(function (response) {
      let assessments = response.data.assessments;
      //      assessments = assessments.slice(0, Math.min(assessments.length, 10));
      console.info(`Processing ${assessments.length} endangered species`);
      // Hack that to check some things
      Promise.all(
        assessments.map(function (assessment) {
          const assessmentId = assessment.assessment_id;
          const url = `https://api.iucnredlist.org/api/v4/assessment/${assessmentId}`;
          return axios.get(url, IUCN_AUTH_HEADER);
        }),
      ).then(function (responseArray) {
        let transformedAssessments = responseArray.map(function (response) {
          return extractDataFromAssessmentAPICall(req.locale, response);
        });
        console.info(`Processed ${assessments.length} endangered species`);
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
