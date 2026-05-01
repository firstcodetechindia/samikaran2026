// Indian States and Cities with realistic data
export const INDIAN_STATES_CITIES: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur"],
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Rohtak"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Dharwad"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Rewa"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Navi Mumbai"],
  "Manipur": ["Imphal", "Thoubal", "Bishnupur"],
  "Meghalaya": ["Shillong", "Tura", "Jowai"],
  "Mizoram": ["Aizawl", "Lunglei", "Champhai"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
  "Punjab": ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
  "Sikkim": ["Gangtok", "Namchi", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Secunderabad"],
  "Tripura": ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Noida", "Kanpur", "Varanasi", "Agra", "Ghaziabad", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Darjeeling"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Vasant Kunj"],
  "Chandigarh": ["Chandigarh"],
  "Puducherry": ["Puducherry", "Karaikal"],
  "Jammu & Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
  "Ladakh": ["Leh", "Kargil"],
  "Andaman & Nicobar": ["Port Blair"]
};

// Indian First Names (Gender-neutral selection with some common names)
export const INDIAN_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Sai",
  "Ananya", "Aadhya", "Aaradhya", "Saanvi", "Pari", "Anika", "Myra", "Diya", "Kiara", "Riya",
  "Rohan", "Karan", "Rahul", "Vikram", "Aryan", "Dev", "Yash", "Raj", "Nikhil", "Amit",
  "Priya", "Shreya", "Kavya", "Trisha", "Sanya", "Nidhi", "Pooja", "Neha", "Anjali", "Sakshi",
  "Harsh", "Rishabh", "Dhruv", "Arnav", "Kabir", "Shaurya", "Advait", "Rehan", "Parth", "Atharv",
  "Isha", "Avni", "Tanvi", "Riddhi", "Siddhi", "Kriti", "Jhanvi", "Manvi", "Mahira", "Navya",
  "Mohit", "Sahil", "Kunal", "Pranav", "Aakash", "Siddharth", "Varun", "Kartik", "Gaurav", "Akshay",
  "Aditi", "Khushi", "Sneha", "Divya", "Meera", "Zara", "Aishwarya", "Sonali", "Pallavi", "Simran",
  "Om", "Jay", "Laksh", "Rudra", "Ved", "Shiva", "Aniket", "Pratik", "Deepak", "Sanjay",
  "Tara", "Mira", "Nisha", "Rashmi", "Komal", "Kajal", "Swati", "Ruchi", "Bhavya", "Lavanya",
  "Chirag", "Mayank", "Tushar", "Shubham", "Vikas", "Piyush", "Rohit", "Manish", "Ashish", "Vishal",
  "Ritika", "Vanshika", "Anushka", "Ishika", "Hansika", "Kritika", "Nimisha", "Pranita", "Garima", "Tanya"
];

// Indian Last Names (Diverse representation)
export const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Rao", "Nair", "Menon",
  "Agarwal", "Jain", "Mehta", "Shah", "Chopra", "Kapoor", "Malhotra", "Khanna", "Bhatia", "Sinha",
  "Das", "Roy", "Mukherjee", "Banerjee", "Chatterjee", "Ghosh", "Sen", "Dutta", "Bose", "Sarkar",
  "Iyer", "Iyengar", "Krishnamurthy", "Subramaniam", "Raghavan", "Venkatesh", "Naidu", "Pillai", "Varma", "Kaur",
  "Joshi", "Kulkarni", "Deshmukh", "Patil", "Deshpande", "Naik", "Gowda", "Hegde", "Shetty", "Pai",
  "Mishra", "Pandey", "Tiwari", "Dubey", "Trivedi", "Chauhan", "Yadav", "Thakur", "Rathore", "Rajput",
  "Saxena", "Nigam", "Awasthi", "Srivastava", "Bajpai", "Bhardwaj", "Chaturvedi", "Dwivedi", "Tripathi", "Pathak",
  "Nayak", "Behera", "Mohanty", "Sahoo", "Pradhan", "Parida", "Sethi", "Ahuja", "Arora", "Grover"
];

// Indian School Names
export const INDIAN_SCHOOLS = [
  "Delhi Public School", "Kendriya Vidyalaya", "Army Public School", "DAV Public School",
  "Ryan International School", "Amity International School", "St. Xavier's School",
  "Modern School", "The Heritage School", "Lotus Valley International School",
  "Bal Bharati Public School", "Cambridge School", "Mount Carmel School",
  "Sacred Heart Convent School", "Holy Child School", "St. Mary's School",
  "Tagore International School", "Springdales School", "Sanskriti School",
  "The Mother's International School", "Bharatiya Vidya Bhavan", "Sardar Patel Vidyalaya",
  "Little Flower School", "Bishop Cotton School", "La Martiniere School",
  "Don Bosco School", "St. Joseph's School", "Carmel Convent School",
  "Presidency School", "National Public School", "Vidya Niketan School",
  "Podar International School", "Vibgyor High School", "Euroschool",
  "Birla Public School", "Scindia School", "Mayo College",
  "Welham Boys School", "Woodstock School", "Doon School",
  "Cathedral School", "Bombay Scottish School", "St. Stephen's School"
];

// Olympiad subjects and categories
export const OLYMPIAD_CONFIGS = [
  {
    title: "National Junior Science Olympiad 2025",
    subject: "Science",
    description: "Test your scientific knowledge across Physics, Chemistry, and Biology",
    categorySlug: "science",
    minClass: 5,
    maxClass: 8
  },
  {
    title: "National Mathematics Olympiad 2025",
    subject: "Mathematics",
    description: "Challenge yourself with advanced mathematical problems and logical reasoning",
    categorySlug: "mathematics",
    minClass: 6,
    maxClass: 10
  },
  {
    title: "National English Olympiad 2025",
    subject: "English",
    description: "Showcase your command over English language, grammar, and comprehension",
    categorySlug: "english",
    minClass: 4,
    maxClass: 9
  },
  {
    title: "National Computer Science Olympiad 2025",
    subject: "Computer Science",
    description: "Demonstrate your programming logic and computational thinking skills",
    categorySlug: "computer-science",
    minClass: 7,
    maxClass: 12
  },
  {
    title: "National General Knowledge Olympiad 2025",
    subject: "General Knowledge",
    description: "Test your awareness of current affairs, history, geography, and general science",
    categorySlug: "general-knowledge",
    minClass: 3,
    maxClass: 8
  }
];

// Sample questions for each subject
export const QUESTION_TEMPLATES: Record<string, { question: string; options: string[]; correctIndex: number }[]> = {
  "Science": [
    { question: "What is the chemical symbol for water?", options: ["H2O", "CO2", "NaCl", "O2"], correctIndex: 0 },
    { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctIndex: 1 },
    { question: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], correctIndex: 2 },
    { question: "What is the speed of light in vacuum?", options: ["3 x 10^8 m/s", "3 x 10^6 m/s", "3 x 10^10 m/s", "3 x 10^4 m/s"], correctIndex: 0 },
    { question: "Which gas do plants absorb during photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2 },
    { question: "What is the SI unit of force?", options: ["Joule", "Newton", "Watt", "Pascal"], correctIndex: 1 },
    { question: "Which organ pumps blood throughout the body?", options: ["Liver", "Lungs", "Heart", "Brain"], correctIndex: 2 },
    { question: "What is the atomic number of Carbon?", options: ["6", "8", "12", "14"], correctIndex: 0 },
    { question: "Which layer of atmosphere contains the ozone layer?", options: ["Troposphere", "Stratosphere", "Mesosphere", "Thermosphere"], correctIndex: 1 },
    { question: "What type of energy is stored in a battery?", options: ["Kinetic", "Chemical", "Nuclear", "Mechanical"], correctIndex: 1 },
    { question: "What is the largest organ in the human body?", options: ["Heart", "Liver", "Skin", "Brain"], correctIndex: 2 },
    { question: "Which element is the most abundant in Earth's atmosphere?", options: ["Oxygen", "Nitrogen", "Carbon", "Hydrogen"], correctIndex: 1 },
    { question: "What is the boiling point of water at sea level?", options: ["90°C", "100°C", "110°C", "120°C"], correctIndex: 1 },
    { question: "Which scientist discovered gravity?", options: ["Einstein", "Newton", "Galileo", "Darwin"], correctIndex: 1 },
    { question: "What is the chemical formula of table salt?", options: ["NaCl", "KCl", "CaCl2", "MgCl2"], correctIndex: 0 },
    { question: "Which blood cells fight infections?", options: ["Red Blood Cells", "White Blood Cells", "Platelets", "Plasma"], correctIndex: 1 },
    { question: "What is the process of water cycle where water turns to vapor?", options: ["Condensation", "Precipitation", "Evaporation", "Collection"], correctIndex: 2 },
    { question: "Which planet has the most moons?", options: ["Mars", "Jupiter", "Saturn", "Neptune"], correctIndex: 2 },
    { question: "What is the pH value of pure water?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { question: "Which metal is liquid at room temperature?", options: ["Iron", "Mercury", "Lead", "Zinc"], correctIndex: 1 },
    { question: "What is the unit of electric current?", options: ["Volt", "Ohm", "Ampere", "Watt"], correctIndex: 2 },
    { question: "Which vitamin is produced by sunlight on skin?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctIndex: 3 },
    { question: "What is the main function of roots in plants?", options: ["Photosynthesis", "Respiration", "Absorption of water", "Food storage"], correctIndex: 2 },
    { question: "Which force keeps planets in orbit around the Sun?", options: ["Magnetic", "Electric", "Gravitational", "Nuclear"], correctIndex: 2 },
    { question: "What is the chemical symbol for Gold?", options: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
    { question: "Which part of the plant conducts photosynthesis?", options: ["Root", "Stem", "Leaf", "Flower"], correctIndex: 2 },
    { question: "What is the freezing point of water?", options: ["-10°C", "0°C", "4°C", "10°C"], correctIndex: 1 },
    { question: "Which gas is used by divers in oxygen tanks?", options: ["Pure Oxygen", "Nitrogen", "Helium-Oxygen mix", "Carbon Dioxide"], correctIndex: 2 },
    { question: "What is the study of living organisms called?", options: ["Physics", "Chemistry", "Biology", "Geology"], correctIndex: 2 },
    { question: "Which element has the symbol 'Fe'?", options: ["Fluorine", "Francium", "Iron", "Fermium"], correctIndex: 2 }
  ],
  "Mathematics": [
    { question: "What is 15 × 15?", options: ["200", "215", "225", "250"], correctIndex: 2 },
    { question: "What is the value of π (pi) approximately?", options: ["3.14", "2.71", "1.41", "1.73"], correctIndex: 0 },
    { question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correctIndex: 2 },
    { question: "If x + 5 = 12, what is x?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { question: "What is the sum of angles in a triangle?", options: ["90°", "180°", "270°", "360°"], correctIndex: 1 },
    { question: "What is 2^10?", options: ["512", "1024", "2048", "4096"], correctIndex: 1 },
    { question: "What is the area of a circle with radius 7? (π = 22/7)", options: ["154", "144", "132", "121"], correctIndex: 0 },
    { question: "What is 1/2 + 1/4?", options: ["1/6", "2/6", "3/4", "3/8"], correctIndex: 2 },
    { question: "What is the HCF of 12 and 18?", options: ["2", "3", "6", "9"], correctIndex: 2 },
    { question: "What is the LCM of 4 and 6?", options: ["12", "18", "24", "36"], correctIndex: 0 },
    { question: "What is 25% of 200?", options: ["25", "50", "75", "100"], correctIndex: 1 },
    { question: "What is the perimeter of a square with side 8cm?", options: ["24cm", "32cm", "40cm", "64cm"], correctIndex: 1 },
    { question: "What is (-5) × (-3)?", options: ["-15", "-8", "8", "15"], correctIndex: 3 },
    { question: "What is the next prime number after 7?", options: ["8", "9", "10", "11"], correctIndex: 3 },
    { question: "What is 3/5 as a percentage?", options: ["30%", "50%", "60%", "75%"], correctIndex: 2 },
    { question: "What is the volume of a cube with side 3cm?", options: ["9 cm³", "18 cm³", "27 cm³", "36 cm³"], correctIndex: 2 },
    { question: "If 3x = 21, what is x?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { question: "What is the value of 5! (5 factorial)?", options: ["25", "60", "100", "120"], correctIndex: 3 },
    { question: "What is the slope of a horizontal line?", options: ["-1", "0", "1", "Undefined"], correctIndex: 1 },
    { question: "What is √(16 + 9)?", options: ["5", "7", "25", "√25"], correctIndex: 0 },
    { question: "What is 0.25 × 100?", options: ["2.5", "25", "250", "0.25"], correctIndex: 1 },
    { question: "What is the median of 3, 7, 8, 9, 11?", options: ["7", "8", "9", "7.6"], correctIndex: 1 },
    { question: "What is 1000 ÷ 8?", options: ["120", "125", "130", "135"], correctIndex: 1 },
    { question: "What is the supplement of a 60° angle?", options: ["30°", "90°", "120°", "150°"], correctIndex: 2 },
    { question: "What is 7² + 24²?", options: ["576", "600", "625", "650"], correctIndex: 2 },
    { question: "What is the value of sin(90°)?", options: ["0", "0.5", "1", "-1"], correctIndex: 2 },
    { question: "What is 15% of 60?", options: ["6", "9", "12", "15"], correctIndex: 1 },
    { question: "What is the circumference of a circle with diameter 14cm?", options: ["22cm", "44cm", "88cm", "154cm"], correctIndex: 1 },
    { question: "If a:b = 2:3 and b:c = 4:5, what is a:c?", options: ["8:15", "6:15", "4:5", "2:5"], correctIndex: 0 },
    { question: "What is the cube root of 27?", options: ["2", "3", "9", "81"], correctIndex: 1 }
  ],
  "English": [
    { question: "What is the plural of 'child'?", options: ["Childs", "Childes", "Children", "Childrens"], correctIndex: 2 },
    { question: "Choose the correct spelling:", options: ["Recieve", "Receive", "Receeve", "Recive"], correctIndex: 1 },
    { question: "What is the past tense of 'go'?", options: ["Goed", "Gone", "Went", "Going"], correctIndex: 2 },
    { question: "Identify the noun: 'The cat sat on the mat.'", options: ["sat", "on", "cat", "the"], correctIndex: 2 },
    { question: "What is the antonym of 'happy'?", options: ["Glad", "Joyful", "Sad", "Cheerful"], correctIndex: 2 },
    { question: "Which is a conjunction?", options: ["Quickly", "And", "Beautiful", "Run"], correctIndex: 1 },
    { question: "What is the synonym of 'big'?", options: ["Small", "Tiny", "Large", "Little"], correctIndex: 2 },
    { question: "Choose the correct article: '__ apple a day keeps the doctor away.'", options: ["A", "An", "The", "No article"], correctIndex: 1 },
    { question: "What type of sentence is 'What is your name?'", options: ["Declarative", "Imperative", "Interrogative", "Exclamatory"], correctIndex: 2 },
    { question: "Identify the verb: 'She runs every morning.'", options: ["She", "runs", "every", "morning"], correctIndex: 1 },
    { question: "What is the plural of 'mouse'?", options: ["Mouses", "Mice", "Mices", "Mouse"], correctIndex: 1 },
    { question: "What is a group of lions called?", options: ["Herd", "Pack", "Pride", "Flock"], correctIndex: 2 },
    { question: "Choose the correct pronoun: '__ is a good student.'", options: ["Him", "Her", "She", "Them"], correctIndex: 2 },
    { question: "What is the comparative form of 'good'?", options: ["Gooder", "Best", "Better", "More good"], correctIndex: 2 },
    { question: "Identify the adverb: 'He spoke softly.'", options: ["He", "spoke", "softly", "None"], correctIndex: 2 },
    { question: "What is the opposite of 'ancient'?", options: ["Old", "Historic", "Modern", "Classic"], correctIndex: 2 },
    { question: "Which sentence is correct?", options: ["He don't know", "He doesn't knows", "He doesn't know", "He not know"], correctIndex: 2 },
    { question: "What is the past participle of 'write'?", options: ["Wrote", "Writed", "Written", "Writing"], correctIndex: 2 },
    { question: "Identify the preposition: 'The book is on the table.'", options: ["book", "is", "on", "table"], correctIndex: 2 },
    { question: "What figure of speech is 'as brave as a lion'?", options: ["Metaphor", "Simile", "Hyperbole", "Personification"], correctIndex: 1 },
    { question: "What is the feminine of 'hero'?", options: ["Heroess", "Heroine", "Shero", "Hero"], correctIndex: 1 },
    { question: "Choose the correct homophone: 'I (hear/here) the music.'", options: ["hear", "here", "heer", "heir"], correctIndex: 0 },
    { question: "What is an adjective in 'The red car is fast'?", options: ["car", "is", "red", "fast"], correctIndex: 2 },
    { question: "What is the superlative of 'tall'?", options: ["Taller", "Most tall", "Tallest", "More tall"], correctIndex: 2 },
    { question: "Identify the subject: 'Birds fly in the sky.'", options: ["fly", "in", "Birds", "sky"], correctIndex: 2 },
    { question: "What is the contracted form of 'cannot'?", options: ["can't", "can'ot", "cann't", "cant'"], correctIndex: 0 },
    { question: "Which is a proper noun?", options: ["city", "country", "India", "river"], correctIndex: 2 },
    { question: "What is the verb form of 'beauty'?", options: ["Beautiful", "Beautify", "Beautifully", "Beauteous"], correctIndex: 1 },
    { question: "Choose the correct collective noun for fish:", options: ["Herd", "School", "Pack", "Flock"], correctIndex: 1 },
    { question: "What is the opposite of 'brave'?", options: ["Bold", "Fearless", "Cowardly", "Daring"], correctIndex: 2 }
  ],
  "Computer Science": [
    { question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Computer Processing Unit"], correctIndex: 0 },
    { question: "Which programming language is known as the mother of all languages?", options: ["Python", "C", "Java", "FORTRAN"], correctIndex: 1 },
    { question: "What is 1024 bytes?", options: ["1 Megabyte", "1 Kilobyte", "1 Gigabyte", "1 Terabyte"], correctIndex: 1 },
    { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyper Technical Meta Language"], correctIndex: 0 },
    { question: "Which is the brain of the computer?", options: ["Monitor", "RAM", "CPU", "Hard Disk"], correctIndex: 2 },
    { question: "What is the binary representation of 10?", options: ["1010", "1100", "1001", "1110"], correctIndex: 0 },
    { question: "Which device is used for input?", options: ["Monitor", "Printer", "Keyboard", "Speaker"], correctIndex: 2 },
    { question: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Run Access Memory", "Random Active Memory"], correctIndex: 0 },
    { question: "Which is an operating system?", options: ["Chrome", "Windows", "Microsoft Word", "Python"], correctIndex: 1 },
    { question: "What is the full form of USB?", options: ["Universal Serial Bus", "United Serial Bus", "Universal System Bus", "User Serial Bus"], correctIndex: 0 },
    { question: "Which loop runs at least once?", options: ["for loop", "while loop", "do-while loop", "foreach loop"], correctIndex: 2 },
    { question: "What is the output of print(2**3)?", options: ["6", "8", "9", "5"], correctIndex: 1 },
    { question: "Which data structure follows FIFO?", options: ["Stack", "Queue", "Tree", "Graph"], correctIndex: 1 },
    { question: "What does CSS stand for?", options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style Syntax", "Colorful Style Sheets"], correctIndex: 1 },
    { question: "Which symbol is used for single-line comments in Python?", options: ["//", "/*", "#", "<!--"], correctIndex: 2 },
    { question: "What is the smallest unit of data?", options: ["Byte", "Bit", "Nibble", "Word"], correctIndex: 1 },
    { question: "Which is a web browser?", options: ["Notepad", "Firefox", "Python", "Excel"], correctIndex: 1 },
    { question: "What does URL stand for?", options: ["Uniform Resource Locator", "Universal Resource Link", "Unique Resource Locator", "Uniform Reference Link"], correctIndex: 0 },
    { question: "Which company created JavaScript?", options: ["Microsoft", "Sun Microsystems", "Netscape", "Google"], correctIndex: 2 },
    { question: "What is an algorithm?", options: ["A programming language", "A step-by-step procedure", "A type of variable", "A computer virus"], correctIndex: 1 },
    { question: "Which is not a programming language?", options: ["Python", "Java", "HTML", "C++"], correctIndex: 2 },
    { question: "What is the function of a compiler?", options: ["Run programs", "Convert source code to machine code", "Store data", "Connect to internet"], correctIndex: 1 },
    { question: "What does GUI stand for?", options: ["General User Interface", "Graphical User Interface", "Guided User Input", "Global Unified Interface"], correctIndex: 1 },
    { question: "Which storage device has the largest capacity?", options: ["Floppy Disk", "CD", "Hard Drive", "DVD"], correctIndex: 2 },
    { question: "What is an IP address?", options: ["Internet Password", "Internal Process", "Internet Protocol Address", "Input Process Address"], correctIndex: 2 },
    { question: "Which key is used to refresh a webpage?", options: ["F1", "F5", "F8", "F12"], correctIndex: 1 },
    { question: "What is a bug in programming?", options: ["A feature", "An error", "A function", "A loop"], correctIndex: 1 },
    { question: "Which is a database?", options: ["Chrome", "MySQL", "Word", "Photoshop"], correctIndex: 1 },
    { question: "What is the extension of a Python file?", options: [".java", ".py", ".cpp", ".js"], correctIndex: 1 },
    { question: "What is Boolean logic based on?", options: ["True/False values", "Numbers only", "Text only", "Images"], correctIndex: 0 }
  ],
  "General Knowledge": [
    { question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctIndex: 1 },
    { question: "Who is known as the Father of the Nation in India?", options: ["Nehru", "Gandhi", "Patel", "Bose"], correctIndex: 1 },
    { question: "Which is the largest continent?", options: ["Africa", "North America", "Asia", "Europe"], correctIndex: 2 },
    { question: "How many colors are in a rainbow?", options: ["5", "6", "7", "8"], correctIndex: 2 },
    { question: "What is the national animal of India?", options: ["Lion", "Elephant", "Tiger", "Peacock"], correctIndex: 2 },
    { question: "Which river is the longest in the world?", options: ["Amazon", "Nile", "Ganga", "Yangtze"], correctIndex: 1 },
    { question: "Who invented the telephone?", options: ["Edison", "Bell", "Tesla", "Marconi"], correctIndex: 1 },
    { question: "What is the currency of Japan?", options: ["Won", "Yuan", "Yen", "Dollar"], correctIndex: 2 },
    { question: "Which is the largest ocean?", options: ["Atlantic", "Indian", "Pacific", "Arctic"], correctIndex: 2 },
    { question: "In which year did India gain independence?", options: ["1945", "1947", "1950", "1942"], correctIndex: 1 },
    { question: "What is the national flower of India?", options: ["Rose", "Lotus", "Jasmine", "Marigold"], correctIndex: 1 },
    { question: "Who wrote the national anthem of India?", options: ["Tagore", "Nehru", "Gandhi", "Iqbal"], correctIndex: 0 },
    { question: "Which planet is closest to the Sun?", options: ["Venus", "Earth", "Mercury", "Mars"], correctIndex: 2 },
    { question: "How many states are there in India?", options: ["26", "28", "29", "30"], correctIndex: 1 },
    { question: "What is the national game of India?", options: ["Cricket", "Hockey", "Football", "Kabaddi"], correctIndex: 1 },
    { question: "Which is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Maldives"], correctIndex: 1 },
    { question: "Who was the first Prime Minister of India?", options: ["Gandhi", "Nehru", "Patel", "Shastri"], correctIndex: 1 },
    { question: "What is the tallest mountain in the world?", options: ["K2", "Kanchenjunga", "Everest", "Makalu"], correctIndex: 2 },
    { question: "Which festival is known as the Festival of Lights?", options: ["Holi", "Diwali", "Eid", "Christmas"], correctIndex: 1 },
    { question: "How many days are in a leap year?", options: ["364", "365", "366", "367"], correctIndex: 2 },
    { question: "What is the national bird of India?", options: ["Sparrow", "Peacock", "Parrot", "Crow"], correctIndex: 1 },
    { question: "Which is the largest state in India by area?", options: ["Uttar Pradesh", "Maharashtra", "Rajasthan", "Madhya Pradesh"], correctIndex: 2 },
    { question: "Who is the first citizen of India?", options: ["PM", "President", "CJI", "Governor"], correctIndex: 1 },
    { question: "What is the chemical symbol for Iron?", options: ["Ir", "In", "Fe", "I"], correctIndex: 2 },
    { question: "Which sport is Sachin Tendulkar associated with?", options: ["Hockey", "Football", "Cricket", "Tennis"], correctIndex: 2 },
    { question: "What is the national tree of India?", options: ["Neem", "Banyan", "Peepal", "Mango"], correctIndex: 1 },
    { question: "Who painted the Mona Lisa?", options: ["Picasso", "Van Gogh", "Da Vinci", "Michelangelo"], correctIndex: 2 },
    { question: "Which is the longest river in India?", options: ["Yamuna", "Ganga", "Brahmaputra", "Godavari"], correctIndex: 1 },
    { question: "How many bones are in the adult human body?", options: ["106", "206", "306", "186"], correctIndex: 1 },
    { question: "What is the speed of sound in air approximately?", options: ["330 m/s", "440 m/s", "550 m/s", "660 m/s"], correctIndex: 0 }
  ]
};

// Marker prefix for test data
export const TEST_DATA_MARKER = "TEST_RUN_";

// Generate random phone number
export function generatePhoneNumber(): string {
  const prefixes = ["98", "97", "96", "95", "94", "93", "91", "90", "88", "87", "86", "85", "84", "83", "82", "81", "80", "79", "78", "77", "76", "75", "74", "73", "72", "70"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
  return prefix + suffix;
}

// Generate random date of birth for students (age 8-18)
export function generateDateOfBirth(): string {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 18;
  const maxYear = currentYear - 8;
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate grade level based on age
export function generateGradeLevel(): string {
  const grades = ["5", "6", "7", "8", "9", "10", "11", "12"];
  return grades[Math.floor(Math.random() * grades.length)];
}

// Generate random score distribution
export function generateScoreDistribution(totalQuestions: number): { correct: number; wrong: number; unattempted: number } {
  const rand = Math.random();
  let correct: number;
  
  // Create realistic distribution
  if (rand < 0.1) {
    // Top 10% - 80-100% correct
    correct = Math.floor(totalQuestions * (0.8 + Math.random() * 0.2));
  } else if (rand < 0.3) {
    // Next 20% - 60-80% correct
    correct = Math.floor(totalQuestions * (0.6 + Math.random() * 0.2));
  } else if (rand < 0.6) {
    // Middle 30% - 40-60% correct
    correct = Math.floor(totalQuestions * (0.4 + Math.random() * 0.2));
  } else if (rand < 0.85) {
    // Next 25% - 20-40% correct
    correct = Math.floor(totalQuestions * (0.2 + Math.random() * 0.2));
  } else {
    // Bottom 15% - 0-20% correct
    correct = Math.floor(totalQuestions * Math.random() * 0.2);
  }

  const remaining = totalQuestions - correct;
  const unattempted = Math.floor(remaining * Math.random() * 0.3);
  const wrong = remaining - unattempted;

  return { correct, wrong, unattempted };
}

// Generate time taken (in seconds) - realistic exam time
export function generateTimeTaken(durationMinutes: number): number {
  const minTime = Math.floor(durationMinutes * 60 * 0.5); // At least 50% time used
  const maxTime = durationMinutes * 60;
  return Math.floor(Math.random() * (maxTime - minTime) + minTime);
}

// Assign medal based on rank
export function assignMedal(rank: number): string {
  if (rank === 1) return "gold";
  if (rank === 2) return "silver";
  if (rank === 3) return "bronze";
  return "participant";
}

// Performance remark based on percentage
export function getPerformanceRemark(percentage: number): string {
  if (percentage >= 90) return "Outstanding";
  if (percentage >= 80) return "Excellent";
  if (percentage >= 70) return "Very Good";
  if (percentage >= 60) return "Good";
  if (percentage >= 50) return "Average";
  if (percentage >= 40) return "Below Average";
  return "Needs Improvement";
}
