let axios = require("axios");

async function getCountries() {
  // Use axios to fetch country list from restcountries api
  console.log("Using axios to load countries list");
  const response = await axios.get("https://restcountries.com/v3.1/all");
  let inputCountries = response.data.map(function (country) {
    return {
      name: country.name.common,
      id: country.cca2,
    };
  });
  inputCountries.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });
  console.log(`Obtained ${inputCountries.length} countries`);
  return inputCountries;
}

module.exports = getCountries;
