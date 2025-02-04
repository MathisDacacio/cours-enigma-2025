const getCountries = require("../src/countries.js");
describe("getCountries", () => {
  it("should return an array of countries", async () => {
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
  });
});
