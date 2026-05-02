import { storage } from "./storage";
import { db } from "./db";
import { countries, states, cities, studentRegistrations } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Advait", "Ananya", "Aanya", "Aadhya", "Myra", "Ira", "Riya", "Saanvi", "Avni", "Aisha", "Diya", "Pari", "Pranav", "Rudra", "Kabir", "Dhruv", "Harsh", "Priya", "Neha", "Pooja", "Shreya", "Sakshi", "Mohammed", "Ali", "Ahmed", "Fatima", "Zara"];
const middleNames = ["Kumar", "Singh", "Prasad", "Chandra", "Mohan", "Ram", "Lal", "Devi", "Nath", "Rani", "", "", "", ""];
const lastNames = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Reddy", "Nair", "Iyer", "Mehta", "Joshi", "Agarwal", "Mishra", "Pandey", "Rao", "Sinha", "Das", "Roy", "Banerjee", "Chatterjee", "Mukherjee", "Sen", "Khan", "Ahmed", "Sheikh", "Ansari", "Williams", "Smith", "Johnson", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White"];
const grades = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
const registrationTypes: ("individual" | "parent" | "school" | "group")[] = ["individual", "parent", "school", "group"];
const schoolNames = ["Delhi Public School", "Cambridge International School", "St. Xavier's High School", "Kendriya Vidyalaya", "Ryan International", "Bharatiya Vidya Bhavan", "Modern School", "The Heritage School", "Springdales School", "Amity International School"];

interface RegionData {
  countries: { name: string; code: string }[];
  states: Record<string, { name: string; cities: string[] }[]>;
}

function loadRegionData(): RegionData {
  const dataPath = path.join(__dirname, "data", "regions.json");
  const rawData = fs.readFileSync(dataPath, "utf-8");
  return JSON.parse(rawData);
}

async function seedRegions() {
  console.log("Checking regions...");
  const existingCountries = await storage.getAllCountries();
  if (existingCountries.length > 0) {
    console.log("Regions already exist, skipping region seed.");
    return;
  }

  const regionData = loadRegionData();

  console.log("Seeding countries...");
  const countryMap: Record<string, number> = {};
  for (const country of regionData.countries) {
    const created = await storage.createCountry(country);
    countryMap[country.code] = created.id;
  }
  console.log(`Created ${Object.keys(countryMap).length} countries.`);

  console.log("Seeding states and cities...");
  let stateCount = 0;
  let cityCount = 0;
  
  for (const [countryCode, statesData] of Object.entries(regionData.states)) {
    const countryId = countryMap[countryCode];
    if (!countryId) {
      console.warn(`Country code ${countryCode} not found, skipping states.`);
      continue;
    }
    
    for (const stateData of statesData) {
      const createdState = await storage.createState({
        name: stateData.name,
        code: stateData.name.substring(0, 3).toUpperCase(),
        countryId: countryId
      });
      stateCount++;
      
      for (const cityName of stateData.cities) {
        await storage.createCity({
          name: cityName,
          stateId: createdState.id
        });
        cityCount++;
      }
    }
  }
  
  console.log(`Created ${stateCount} states.`);
  console.log(`Created ${cityCount} cities.`);
}

const phoneCodes: Record<string, string> = {
  "IN": "+91", "US": "+1", "GB": "+44", "AU": "+61", "CA": "+1", "DE": "+49", "FR": "+33", "JP": "+81", "CN": "+86"
};

async function seedStudents() {
  console.log("Checking students...");
  const existing = await storage.getStudentRegistrationByEmail("aarav.sharma0@gmail.com");
  if (existing) {
    console.log("Students already exist, skipping student seed.");
    return;
  }

  const allCountries = await storage.getAllCountries();
  const countryStateMap: Record<number, number[]> = {};
  const stateCityMap: Record<number, number[]> = {};

  for (const country of allCountries) {
    const statesForCountry = await storage.getStatesByCountry(country.id);
    countryStateMap[country.id] = statesForCountry.map(s => s.id);
    for (const state of statesForCountry) {
      const citiesForState = await storage.getCitiesByState(state.id);
      stateCityMap[state.id] = citiesForState.map(c => c.id);
    }
  }

  console.log("Seeding 500 students...");
  for (let i = 0; i < 500; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const grade = grades[Math.floor(Math.random() * grades.length)];
    const regType = registrationTypes[Math.floor(Math.random() * registrationTypes.length)];
    const school = schoolNames[Math.floor(Math.random() * schoolNames.length)];
    
    const country = allCountries[Math.floor(Math.random() * allCountries.length)];
    const stateIds = countryStateMap[country.id] || [];
    const stateId = stateIds.length > 0 ? stateIds[Math.floor(Math.random() * stateIds.length)] : null;
    const cityIds = stateId ? (stateCityMap[stateId] || []) : [];
    const cityId = cityIds.length > 0 ? cityIds[Math.floor(Math.random() * cityIds.length)] : null;

    const phoneCode = phoneCodes[country.code] || "+91";
    const emailDomain = ["gmail.com", "yahoo.com", "outlook.com", "student.edu"][Math.floor(Math.random() * 4)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${emailDomain}`;
    const phone = `${phoneCode}${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const birthYear = 2005 + Math.floor(Math.random() * 15);
    const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');

    await storage.createStudentRegistration({
      firstName,
      middleName: middleName || null,
      lastName,
      email,
      phone,
      gradeLevel: grade,
      schoolName: school,
      dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
      registrationType: regType,
      countryId: country.id,
      stateId,
      cityId,
      addressLine1: `${Math.floor(100 + Math.random() * 900)} Main Street`,
      pincode: `${100000 + Math.floor(Math.random() * 900000)}`,
      usedReferralCode: Math.random() > 0.7 ? `REF${Math.floor(100000 + Math.random() * 900000)}` : null,
    });
    
    if ((i + 1) % 100 === 0) {
      console.log(`Created ${i + 1} students...`);
    }
  }
  console.log("Created 500 students.");
}

async function seed() {
  console.log("Seeding database...");
  
  // Check if exams exist
  const exams = await storage.getExams();
  if (exams.length === 0) {
    console.log("Creating demo exam...");
    const exam = await storage.createExam({
      title: "Science Olympiad 2025 - Mock Test",
      description: "A practice test for the upcoming Science Olympiad.",
      subject: "Science",
      durationMinutes: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      negativeMarking: true,
      proctoring: false,
      createdBy: "admin-seed",
    });

    console.log("Creating questions...");
    await storage.createQuestions([
      {
        examId: exam.id,
        type: "mcq",
        content: {
          question: "What is the chemical symbol for Gold?",
          options: ["Au", "Ag", "Fe", "Cu"],
          correct: "Au"
        },
        marks: 4,
        negativeMarks: 1
      },
      {
        examId: exam.id,
        type: "mcq",
        content: {
          question: "Which planet is known as the Red Planet?",
          options: ["Venus", "Mars", "Jupiter", "Saturn"],
          correct: "Mars"
        },
        marks: 4,
        negativeMarks: 1
      },
      {
        examId: exam.id,
        type: "mcq",
        content: {
          question: "What is the powerhouse of the cell?",
          options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
          correct: "Mitochondria"
        },
        marks: 4,
        negativeMarks: 1
      }
    ]);
  } else {
    console.log("Exams already exist, skipping exam seed.");
  }
  
  await seedRegions();
  await seedStudents();
  
  console.log("Seeding complete.");
}

seed().catch(console.error);
