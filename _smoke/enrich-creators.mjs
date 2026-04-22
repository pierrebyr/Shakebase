// Enrich the 16 best-documented creators with structured bios, specialties,
// awards, and (where applicable) books.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

const { data: ws } = await admin.from('workspaces').select('id').eq('slug', 'casa-dragones').maybeSingle()

const ENRICHMENTS = {
  'Elena Reygadas': {
    role: 'Chef and Owner',
    venue: 'Rosetta',
    city: 'Mexico City',
    country: 'Mexico',
    bio: "Elena Reygadas is one of Mexico's most celebrated chefs, known for her ingredient-driven cuisine that celebrates Mexican biodiversity through an Italian-influenced lens. She opened Rosetta in Mexico City's Roma Norte neighborhood in 2010 and later expanded with Panadería Rosetta, Lardo, and Café Nin. Reygadas trained at the University of Westminster and worked at Locanda Locatelli in London before returning to Mexico. She was named World's Best Female Chef by The World's 50 Best Restaurants in 2023.",
    specialties: ['Seasonal Mexican ingredients', 'Italian-Mexican fusion', 'Fresh pasta', 'Artisan breads'],
    awards: [
      { title: "World's Best Female Chef", year: '2023', venue: "The World's 50 Best Restaurants" },
      { title: "Latin America's Best Female Chef", year: '2014', venue: "Latin America's 50 Best Restaurants" },
    ],
    book: { title: 'Rosetta', year: '2019', publisher: 'Ambar Diseño' },
    avatar_hue: 340,
  },
  'Jorge Vallejo': {
    role: 'Chef and Co-Owner',
    venue: 'Quintonil',
    city: 'Mexico City',
    country: 'Mexico',
    bio: "Jorge Vallejo is the chef-owner of Quintonil, which he runs with his wife and business partner Alejandra Flores in Mexico City's Polanco neighborhood. The restaurant, opened in 2012, focuses on contemporary Mexican cuisine rooted in native ingredients, heirloom corn, and produce from its own urban garden. Vallejo previously trained at Pujol under Enrique Olvera before opening Quintonil. The restaurant has become one of the most decorated in Latin America, consistently ranking in the top tier of The World's 50 Best Restaurants.",
    specialties: ['Contemporary Mexican cuisine', 'Native ingredients', 'Heirloom corn', 'Vegetable-forward tasting menus'],
    awards: [
      { title: "World's 50 Best Restaurants Top 3 (Quintonil)", year: '2023', venue: "The World's 50 Best Restaurants" },
      { title: "Latin America's 50 Best Restaurants #1", year: '2023', venue: "Latin America's 50 Best Restaurants" },
    ],
    avatar_hue: 30,
  },
  'Julian Cox': {
    role: 'Bartender and Beverage Director',
    venue: 'Sprout LA hospitality group',
    city: 'Los Angeles',
    country: 'United States',
    bio: "Julian Cox is a pioneering Los Angeles bartender credited with shaping the city's modern craft cocktail scene in the 2010s. He built the opening cocktail programs at Rivera, Picca, Sotto, and Bestia, and later at the Sprout LA hospitality group, championing agave spirits and Southern California produce. Cox was named Best American Bartender at Tales of the Cocktail's Spirited Awards in 2013. His influence helped establish LA as a serious craft-cocktail destination alongside New York and London.",
    specialties: ['Agave spirits', 'California seasonal produce', 'Bar program design', 'Mezcal and tequila cocktails'],
    awards: [
      { title: 'Best American Bartender', year: '2013', venue: 'Tales of the Cocktail Spirited Awards' },
    ],
    avatar_hue: 200,
  },
  'Sasha Petraske': {
    role: 'Bartender and Bar Owner (1973–2015)',
    venue: 'Milk & Honey (original)',
    city: 'New York City',
    country: 'United States',
    bio: "Sasha Petraske was a hugely influential American bartender who opened Milk & Honey on New York's Lower East Side in 1999, sparking the modern speakeasy movement and craft-cocktail revival. He championed rigorous technique, house rules for civility, and classic cocktails built with exacting proportions, mentoring a generation of bartenders including Sam Ross and Michael McIlroy. He later opened or consulted on Little Branch, Dutch Kills, Milk & Honey London, and The Varnish in LA. Petraske died unexpectedly in 2015 at age 42; his posthumous book Regarding Cocktails was published in 2016.",
    specialties: ['Classic cocktails', 'Speakeasy-style hospitality', 'Precise technique', 'Bar program design'],
    book: { title: 'Regarding Cocktails', year: '2016', publisher: 'Phaidon Press' },
    avatar_hue: 270,
  },
  'Dave Arnold': {
    role: 'Bar Owner, Author, and Culinary Technologist',
    venue: 'Existing Conditions (prev. Booker and Dax)',
    city: 'New York City',
    country: 'United States',
    bio: "Dave Arnold is an American culinary technologist, author, and bar owner known for applying scientific rigor to cocktail making. He founded Booker and Dax inside Momofuku Ssäm Bar, developing techniques like liquid-nitrogen chilling, red-hot pokers, and the Spinzall centrifuge. He later opened Existing Conditions in Greenwich Village with Don Lee and Greg Boehm. Arnold is founder of the Museum of Food and Drink (MOFAD) and host of the Cooking Issues podcast; his 2014 book Liquid Intelligence won the James Beard Award for Best Beverage Book.",
    specialties: ['Cocktail science', 'Clarification and carbonation', 'Equipment innovation', 'Technique-driven drinks'],
    awards: [
      { title: 'James Beard Award, Best Beverage Book', year: '2015', venue: 'James Beard Foundation' },
    ],
    book: { title: 'Liquid Intelligence: The Art and Science of the Perfect Cocktail', year: '2014', publisher: 'W. W. Norton' },
    avatar_hue: 240,
  },
  'Mads Refslund': {
    role: 'Chef',
    venue: 'Ilis',
    city: 'Brooklyn, NYC',
    country: 'United States',
    bio: "Mads Refslund is a Danish chef who co-founded Noma in Copenhagen in 2003 with René Redzepi, helping define the New Nordic cuisine movement before parting ways to pursue his own projects. He later moved to New York, where he opened Acme in NoHo and the foraging-focused Michelin-recognized Ilis in Greenpoint, Brooklyn in 2023. Refslund's cooking emphasizes wild ingredients, fire, ice, and an experimental approach to waste and seasonality. He co-authored Scraps, Wilt & Weeds on reducing food waste through creative cooking.",
    specialties: ['New Nordic cuisine', 'Foraging and wild ingredients', 'Fire and ice cooking', 'Zero-waste cooking'],
    book: { title: 'Scraps, Wilt & Weeds: Turning Wasted Food into Plenty', year: '2017', publisher: 'Grand Central Life & Style' },
    avatar_hue: 160,
  },
  'Martha Ortiz': {
    role: 'Chef and Owner',
    venue: 'Dulce Patria',
    city: 'Mexico City',
    country: 'Mexico',
    bio: "Martha Ortiz is a Mexican chef known for her poetic, visually striking interpretations of traditional Mexican cuisine. She is the chef-owner of Dulce Patria in Mexico City's Polanco neighborhood, which has been recognized on Latin America's 50 Best Restaurants list, and she previously led Ella Canta at the InterContinental Park Lane in London. Trained as a political scientist and art historian before turning to cooking, Ortiz is known for intertwining Mexican identity, femininity, and symbolism into her dishes.",
    specialties: ['Modern Mexican cuisine', 'Symbolic plating', 'Traditional ingredients', 'Mexican identity in food'],
    avatar_hue: 350,
  },
  'Jamie Bissonnette': {
    role: 'Chef and Co-Owner',
    venue: 'Toro and Coppa',
    city: 'Boston',
    country: 'United States',
    bio: "Jamie Bissonnette is an American chef and co-owner, with partner Ken Oringer, of Toro (Spanish tapas) in Boston's South End, Toro New York, and Coppa in Boston. He is known for whole-animal cooking, charcuterie, and bold Mediterranean and Spanish-influenced flavors. Bissonnette won the James Beard Award for Best Chef: Northeast in 2014 and is a fixture on television cooking programs.",
    specialties: ['Spanish tapas', 'Charcuterie', 'Whole-animal cooking', 'Mediterranean flavors'],
    awards: [
      { title: 'James Beard Award, Best Chef: Northeast', year: '2014', venue: 'James Beard Foundation' },
    ],
    book: { title: 'The New Charcuterie Cookbook', year: '2014', publisher: 'Page Street Publishing' },
    avatar_hue: 40,
  },
  'Scott Conant': {
    role: 'Chef and Restaurateur',
    venue: 'Scarpetta (multi-location)',
    city: 'New York City / Miami',
    country: 'United States',
    bio: "Scott Conant is an American chef and restaurateur best known for Scarpetta, the Italian restaurant he opened in New York City in 2008, which expanded to Miami, Las Vegas, Toronto, and beyond. He is celebrated for refined Italian cuisine, particularly his signature spaghetti with tomato and basil, and has also opened Masso Osteria and Mora Italian. Conant is a longtime judge on Food Network's Chopped and has authored multiple cookbooks.",
    specialties: ['Refined Italian cuisine', 'Fresh pasta', 'Rustic Italian technique', 'Modern trattoria cooking'],
    book: { title: 'The Scarpetta Cookbook', year: '2013', publisher: 'Houghton Mifflin Harcourt' },
    avatar_hue: 20,
  },
  'Yana Volfson': {
    role: 'Beverage Director',
    venue: 'Casamata Group (Cosme, Atla, Elio, Damian, Ticuchi)',
    city: 'New York City',
    country: 'United States',
    bio: "Yana Volfson is the head of beverage for Enrique Olvera's Casamata hospitality group, overseeing the bar programs at Cosme, Atla, Elio, Damian, and Ticuchi in New York City. Originally from Russia and raised in Canada, she became one of New York's most respected beverage directors, known for weaving agave spirits and Mexican botanicals into inventive cocktail menus. She is a frequent speaker at industry events and has been cited in James Beard-nominated beverage programs.",
    specialties: ['Agave spirits', 'Mexican botanicals', 'Multi-venue beverage direction', 'Cocktail pairings with Mexican cuisine'],
    avatar_hue: 340,
  },
  'Fabiola Padilla': {
    role: 'Bar Owner and Mixologist',
    venue: 'Bekeb (Casa Hoyos)',
    city: 'San Miguel de Allende',
    country: 'Mexico',
    bio: "Fabiola Padilla is the founder and head bartender of Bekeb, a rooftop bar at Casa Hoyos in San Miguel de Allende that has become one of Mexico's most acclaimed destination cocktail bars. Her menu is built around Mexican botanicals, endemic herbs, and house-made infusions, and the bar has appeared on North America's 50 Best Bars list. Padilla was named to Forbes Mexico's 100 Most Powerful Women list in 2021 and is widely regarded as a leading female figure in Mexican bartending.",
    specialties: ['Mexican botanicals', 'House-made infusions', 'Agave spirits', 'Terroir-driven cocktails'],
    awards: [
      { title: 'Forbes Mexico 100 Most Powerful Women', year: '2021', venue: 'Forbes Mexico' },
      { title: "North America's 50 Best Bars (Bekeb)", year: '2022', venue: "North America's 50 Best Bars" },
    ],
    avatar_hue: 320,
  },
  'Leo Robitschek': {
    role: 'Partner and Beverage Director',
    venue: 'The NoMad Hotel & NoMad Bar',
    city: 'New York City',
    country: 'United States',
    bio: "Leo Robitschek is the bar director and partner for the Make It Nice hospitality group (Eleven Madison Park, The NoMad), widely regarded as one of the most influential beverage directors in the United States. Under his leadership, the NoMad Bar won World's Best Bar at Tales of the Cocktail's Spirited Awards and was ranked among the top bars on The World's 50 Best Bars list. He was named American Bartender of the Year at the Spirited Awards in 2016 and led the James Beard Award-winning bar program at Eleven Madison Park.",
    specialties: ['Multi-venue bar direction', 'Large-format cocktails', 'Classic cocktail revival', 'Hospitality-driven programs'],
    awards: [
      { title: 'American Bartender of the Year', year: '2016', venue: 'Tales of the Cocktail Spirited Awards' },
      { title: "World's Best Bar (NoMad Bar)", year: '2017', venue: 'Tales of the Cocktail Spirited Awards' },
    ],
    avatar_hue: 220,
  },
  'Enrique Olvera': {
    role: 'Chef and Owner',
    venue: 'Pujol + Cosme + Casamata Group',
    city: 'Mexico City',
    country: 'Mexico',
    bio: "Enrique Olvera is one of the most influential chefs in Latin America, known for redefining modern Mexican cuisine through his flagship Pujol, which opened in Mexico City in 2000. His 'Mole Madre' — a mole continuously aged for over a thousand days — is among the most iconic dishes in contemporary gastronomy. Olvera expanded internationally with Cosme and Atla in New York, Damian in Los Angeles, and oversees the Casamata hospitality group with properties including Ticuchi and Elio. Pujol has consistently ranked in the top tier of The World's 50 Best Restaurants.",
    specialties: ['Modern Mexican cuisine', 'Mole', 'Native corn and heirloom ingredients', 'Multi-concept restaurant operations'],
    awards: [
      { title: "Latin America's 50 Best Restaurants Top 5 (Pujol)", year: '2022', venue: "Latin America's 50 Best Restaurants" },
      { title: "World's 50 Best Restaurants Top 20 (Pujol)", year: '2022', venue: "The World's 50 Best Restaurants" },
    ],
    book: { title: 'Mexico from the Inside Out', year: '2015', publisher: 'Phaidon Press' },
    avatar_hue: 15,
  },
  'Jim Meehan': {
    role: 'Bartender, Author, and Bar Consultant',
    venue: 'Prabell consultancy (prev. PDT)',
    city: 'Portland, Oregon',
    country: 'United States',
    bio: "Jim Meehan is an American bartender, author, and consultant who co-founded PDT (Please Don't Tell) in New York's East Village in 2007, a phone-booth-entered speakeasy that became one of the most influential bars of the modern craft cocktail era. PDT won multiple Spirited Awards including World's Best Cocktail Bar, and Meehan was named American Bartender of the Year in 2009. He moved to Portland, Oregon, where he runs the consultancy Prabell and authored The PDT Cocktail Book and Meehan's Bartender Manual.",
    specialties: ['Classic cocktail revival', 'Bar program design', 'Cocktail writing and education', 'Craft technique'],
    awards: [
      { title: 'American Bartender of the Year', year: '2009', venue: 'Tales of the Cocktail Spirited Awards' },
      { title: 'Outstanding Bar Program (PDT)', year: '2012', venue: 'James Beard Foundation' },
    ],
    book: { title: 'The PDT Cocktail Book', year: '2011', publisher: 'Sterling Epicure' },
    avatar_hue: 40,
  },
  'José Luis León': {
    role: 'Head Bartender and Partner',
    venue: 'Licorería Limantour',
    city: 'Mexico City',
    country: 'Mexico',
    bio: "José Luis León is the head bartender and creative director at Licorería Limantour in Mexico City's Roma Norte, widely regarded as one of the top bars in Latin America and the world. Under his direction, Limantour reached #1 on North America's 50 Best Bars, ranked top three on The World's 50 Best Bars, and is consistently Mexico's highest-ranked bar. León is known for cocktails rooted in Mexican ingredients, agave spirits, and seasonal produce, with menus that tell cultural and regional stories.",
    specialties: ['Mexican ingredients', 'Agave spirits', 'Narrative menu design', 'Seasonal cocktails'],
    awards: [
      { title: "North America's 50 Best Bars #1 (Limantour)", year: '2022', venue: "North America's 50 Best Bars" },
      { title: "World's 50 Best Bars Top 10 (Limantour)", year: '2022', venue: "The World's 50 Best Bars" },
    ],
    avatar_hue: 30,
  },
  'Frank Falcinelli, Frank Castronovo &Sasha Petraske': {
    // Merge: this compound-creator record can be kept for the one cocktail that
    // credits all three. Rename + enrich.
    rename: 'Falcinelli, Castronovo & Petraske',
    role: 'Chefs & Bartender (collaboration)',
    venue: 'Frankies Spuntino / Milk & Honey',
    city: 'New York City',
    country: 'United States',
    bio: "A one-off cocktail collaboration between Frank Falcinelli and Frank Castronovo (the Franks of Frankies Spuntino in Brooklyn) and legendary bartender Sasha Petraske (Milk & Honey, d. 2015). The Franks founded Frankies 457 on Brooklyn's Court Street in 2004 and expanded to Prime Meats, Café Pedlar, and Frankies 570. Petraske sparked the modern speakeasy movement with Milk & Honey in 1999.",
    specialties: ['Italian-American cuisine', 'Classic cocktails', 'House-cured meats'],
    avatar_hue: 20,
  },
}

let updated = 0
for (const [name, patch] of Object.entries(ENRICHMENTS)) {
  const { data: c } = await admin
    .from('creators')
    .select('id, name')
    .eq('workspace_id', ws.id)
    .eq('name', name)
    .is('deleted_at', null)
    .maybeSingle()
  if (!c) {
    console.warn(`! not found: ${name}`)
    continue
  }
  const { rename, ...fields } = patch
  if (rename) fields.name = rename
  const { error } = await admin.from('creators').update(fields).eq('id', c.id)
  if (error) {
    console.error(`! ${name}:`, error.message)
    continue
  }
  console.log(`✓ ${rename ?? name}`)
  updated++
}

console.log(`\n✓ ${updated} creators enriched`)
