import { db } from "../db";
import { countries, states, cities } from "@shared/schema";
import { countriesData, statesData } from "./regions-data";
import { citiesData } from "./cities-data";

export async function seedRegions() {
  console.log("Starting regions seeding...");
  
  const existingCountries = await db.select().from(countries);
  if (existingCountries.length > 0) {
    console.log(`Regions already seeded (${existingCountries.length} countries found). Skipping...`);
    return { countries: existingCountries.length, states: 0, cities: 0 };
  }

  let totalStates = 0;
  let totalCities = 0;

  console.log(`Inserting ${countriesData.length} countries...`);
  
  for (const countryData of countriesData) {
    const [insertedCountry] = await db.insert(countries).values({
      name: countryData.name,
      code: countryData.code,
      isActive: true,
    }).returning();

    const countryCode = countryData.code;
    const countryStates = statesData[countryCode];

    if (countryStates && countryStates.length > 0) {
      for (const stateData of countryStates) {
        const [insertedState] = await db.insert(states).values({
          countryId: insertedCountry.id,
          name: stateData.name,
          code: stateData.code || null,
          isActive: true,
        }).returning();
        totalStates++;

        const countryCities = citiesData[countryCode];
        if (countryCities) {
          const stateCities = countryCities[stateData.name];
          if (stateCities && stateCities.length > 0) {
            for (const cityName of stateCities) {
              await db.insert(cities).values({
                stateId: insertedState.id,
                name: cityName,
                isActive: true,
              });
              totalCities++;
            }
          }
        }
      }
    }
  }

  console.log(`Seeding complete!`);
  console.log(`- Countries: ${countriesData.length}`);
  console.log(`- States: ${totalStates}`);
  console.log(`- Cities: ${totalCities}`);

  return { countries: countriesData.length, states: totalStates, cities: totalCities };
}
