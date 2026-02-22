const places = [
  {
    title: 'Taj Mahal',
    address: 'Agra, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/free-photo/mesmerizing-shot-famous-historic-taj-mahal-agra-india_181624-16028.jpg?size=626&ext=jpg&uid=R116989314&ga=GA1.2.2084330140.1695034425&semt=ais',
      'https://img.freepik.com/free-photo/taj-mahal-agra-india_3876-47058.jpg?w=900&t=st=1695314324~exp=1695314924~hmac=695090f927d60198635b7a56738e63e74d3936dd1845f166447e4d3483c79eda',
      'https://img.freepik.com/free-photo/spiritual-minaret-symbolizes-ancient-indian-culture-sunset-generative-ai_188544-37001.jpg?size=626&ext=jpg&uid=R116989314&ga=GA1.2.2084330140.1695034425&semt=ais',
      'https://img.freepik.com/premium-photo/taj-mahal-sunrise-sunset-agra-india_163782-1745.jpg?w=900',
    ],
    description:
      'The Taj Mahal is a UNESCO World Heritage monument built by Shah Jahan in memory of Mumtaz Mahal. Its marble domes, minarets, and symmetry make it one of the world’s most admired sites. Visitors come for sunrise views, gardens, and the timeless story of devotion.',
    extraInfo:
      'History and design blend Persian, Islamic, and Indian influences with intricate stone inlays. The complex includes gardens, a mosque, and guest house, creating a serene ceremonial axis. Agra also hosts other Mughal landmarks, making this a rich heritage stop.',
    perks: ['heritage walks', 'guided tours', 'sunrise views'],
    maxGuests: 4,
    price: 3200,
  },
  {
    title: 'Kerala Backwaters (Kumarakom)',
    address: 'Kumarakom, Kerala, India',
    photos: [
      'https://www.ekeralatourism.net/wp-content/uploads/2018/03/Kumarakom.jpg',
      'https://img.freepik.com/premium-photo/boat-carrying-tourists-floating-down-river-background-palm-trees-beautiful-sunset-sun-sets-horizon-shine-through-palm-trees_431724-2887.jpg?w=900',
      'https://img.freepik.com/premium-photo/phtoo-houseboat-kerala-backwaters_978318-19.jpg?w=740',
      'https://img.freepik.com/premium-photo/leaning-palm-maasin-river-siargao_186382-12395.jpg?w=900',
    ],
    description:
      'Kumarakom is known for calm backwaters, houseboats, and lush canals fringed with coconut palms. It’s a tranquil base for slow travel, birdwatching, and sunset cruises. The region feels intimate and deeply connected to local life.',
    extraInfo:
      'Kerala’s geography blends lowlands, midlands, and highlands, creating a mosaic of rivers, lagoons, and hill stations. Backwaters are a signature highlight, especially around Kumarakom and Alleppey. Local cuisine and cultural performances make evenings memorable.',
    perks: ['houseboat cruise', 'lagoon views', 'local cuisine'],
    maxGuests: 6,
    price: 2600,
  },
  {
    title: 'Munnar Tea Estates',
    address: 'Munnar, Kerala, India',
    photos: [
      'https://img.freepik.com/free-photo/india-fog-tea-cool-tea-eaves_1376-20.jpg?w=1060&t=st=1700648098~exp=1700648698~hmac=6b21a531af7e56b513b90fd4f896db41915b191beacad50ae89663de5f5ef2a9',
    ],
    description:
      'Munnar’s rolling tea gardens and misty hills are ideal for scenic walks and cool-weather escapes. Viewpoints reveal layered plantations and winding trails. It’s a favorite for photographers and nature lovers.',
    extraInfo:
      'The Western Ghats provide highland terrain and cooler temperatures throughout the year. Tea estates shaped the region’s economy and landscape, and guided plantation tours offer insights into cultivation and processing.',
    perks: ['tea estate tours', 'mountain views', 'cool climate'],
    maxGuests: 5,
    price: 2200,
  },
  {
    title: 'Kovalam Beach',
    address: 'Kovalam, Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/leaning-palm-maasin-river-siargao_186382-12395.jpg?w=900',
    ],
    description:
      'Kovalam is a relaxed beach destination with palm-fringed shores and calm waters. Visitors come for sunsets, seaside cafes, and wellness breaks. The vibe is laid-back and restorative.',
    extraInfo:
      'Kerala’s long coastline creates several beach resorts, and Kovalam remains one of the most accessible. It pairs well with temple visits and backwater itineraries for a balanced trip.',
    perks: ['beach access', 'sunset views', 'wellness'],
    maxGuests: 4,
    price: 2000,
  },
  {
    title: 'Varkala Cliffs',
    address: 'Varkala, Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/boat-carrying-tourists-floating-down-river-background-palm-trees-beautiful-sunset-sun-sets-horizon-shine-through-palm-trees_431724-2887.jpg?w=900',
    ],
    description:
      'Varkala’s cliffside coastline offers dramatic views over the Arabian Sea. The promenade is lined with cafes, yoga spots, and small boutiques. It’s a scenic alternative to busier beaches.',
    extraInfo:
      'The cliffs create natural viewpoints and a distinctive landscape. Travelers often combine Varkala with nearby temples and backwater circuits for variety.',
    perks: ['cliff walks', 'ocean views', 'cafes nearby'],
    maxGuests: 4,
    price: 1900,
  },
  {
    title: 'Periyar Wildlife Sanctuary',
    address: 'Thekkady, Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/beautiful-daisy-flower_888087-1975.jpg?w=900',
    ],
    description:
      'Periyar is known for forest trails, lake cruises, and wildlife viewing. It’s a popular stop for nature-focused itineraries in Kerala. The sanctuary feels immersive and serene.',
    extraInfo:
      'Kerala’s biodiversity is rich, and Periyar sits within a belt of protected forests. Responsible tourism and guided activities help keep the ecosystem thriving.',
    perks: ['wildlife viewing', 'forest trails', 'lake cruise'],
    maxGuests: 4,
    price: 2100,
  },
  {
    title: 'Dal Lake Houseboats',
    address: 'Srinagar, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/lifestyle-dal-lake-man-drive-boat-middle-dal-lake-mountain-background_35312-254.jpg?w=900',
      'https://img.freepik.com/premium-photo/majestic-mountain-range-reflects-tranquil-unset-wave-generated-by-ai_188544-22743.jpg?t=st=1700648640~exp=1700652240~hmac=69c3ccb81f54e19ee392ffc29c06c2de729e70ede8ec0ae49ad18fe117a5c453&w=1060',
    ],
    description:
      'Dal Lake is the signature experience of Srinagar, with shikara rides and floating markets. Houseboats offer a quiet, scenic stay surrounded by mountains. Mornings are especially peaceful on the water.',
    extraInfo:
      'Kashmir’s lakes and gardens define its landscape, drawing travelers year-round. Srinagar also provides access to nearby meadows and alpine valleys.',
    perks: ['lake cruise', 'houseboat stay', 'mountain views'],
    maxGuests: 4,
    price: 3000,
  },
  {
    title: 'Gulmarg Meadows',
    address: 'Gulmarg, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/mountain-city-top-view_31479-1.jpg?w=900',
    ],
    description:
      'Gulmarg is famous for its lush meadows and winter snow. In summer, it’s ideal for hikes and meadow walks; in winter, it becomes a ski destination. The scenery is dramatic in every season.',
    extraInfo:
      'The region is part of the Pir Panjal range and offers panoramic alpine vistas. It’s a gateway to several short treks and viewpoints.',
    perks: ['meadow walks', 'snow views', 'trek access'],
    maxGuests: 5,
    price: 2500,
  },
  {
    title: 'Pahalgam Valley',
    address: 'Pahalgam, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/village-mt-everest-trekking-route-with-beautiful-view-mountain-river_73740-55.jpg?size=626&ext=jpg&ga=GA1.1.533346386.1700635793&semt=ais',
    ],
    description:
      'Pahalgam is known for river valleys, pine forests, and open meadows. It’s a calm base for day walks and scenic picnics. The atmosphere is quiet and family-friendly.',
    extraInfo:
      'The valley sits along the Lidder River and provides easy access to short hikes. It’s a classic stop in Kashmir circuits.',
    perks: ['river views', 'forest walks', 'family friendly'],
    maxGuests: 5,
    price: 2100,
  },
  {
    title: 'Sonamarg Trails',
    address: 'Sonamarg, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/village-mt-everest-trekking-route-with-beautiful-view-mountain-river_73740-55.jpg?size=626&ext=jpg&ga=GA1.1.533346386.1700635793&semt=ais',
    ],
    description:
      'Sonamarg offers alpine trails, open valleys, and snow-fed streams. It’s a gateway for summer treks and highland viewpoints. Travelers come for crisp air and expansive scenery.',
    extraInfo:
      'The area is known for seasonal road access and panoramic landscapes. It pairs well with Srinagar and Gulmarg itineraries.',
    perks: ['alpine trails', 'panoramic views', 'summer treks'],
    maxGuests: 5,
    price: 2300,
  },
  {
    title: 'Varanasi Ghats',
    address: 'Varanasi, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/view-from-boat-shore-sacred-river-ganges-varanasi-holiday_431724-5319.jpg?w=900',
      'https://img.freepik.com/premium-photo/digital-art-beautiful-ganges-river-india-lake-dawn-sunset-beautiful-background-landscape_800563-2589.jpg?w=1060',
    ],
    description:
      'Varanasi is one of the world’s oldest living cities, centered on the Ganges River. The ghats host daily rituals, evening aarti, and boat rides at dawn. The city is spiritual, vibrant, and full of history.',
    extraInfo:
      'Temples such as Kashi Vishwanath and Sankat Mochan form the cultural heart of the city. Narrow lanes, local markets, and riverside steps create a distinctive experience.',
    perks: ['ghat ceremonies', 'temple visits', 'river views'],
    maxGuests: 4,
    price: 1400,
  },
  {
    title: 'Sarnath Heritage Site',
    address: 'Sarnath, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/digital-art-beautiful-ganges-river-india-lake-dawn-sunset-beautiful-background-landscape_800563-2589.jpg?w=1060',
    ],
    description:
      'Sarnath is where Buddha delivered his first sermon and remains a peaceful heritage site. Stupas, museums, and ruins make it a calm day trip from Varanasi. It’s ideal for history and culture enthusiasts.',
    extraInfo:
      'The site highlights India’s Buddhist legacy and is associated with Ashoka’s lion capital. Museums and gardens create a contemplative atmosphere.',
    perks: ['heritage ruins', 'museum visit', 'calm environment'],
    maxGuests: 4,
    price: 1200,
  },
  {
    title: 'Ayodhya Temple Circuit',
    address: 'Ayodhya, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/landscape-view-huge-maheshwar-fort-ahilya-fort-this-monument-is-banks-narmada-river-maheshwar-madhya-pradesh-india_136354-12278.jpg?w=900',
    ],
    description:
      'Ayodhya is a major pilgrimage city associated with ancient epics. Temples, riverfronts, and festivals make it a spiritual highlight. The town offers a quieter, reflective travel experience.',
    extraInfo:
      'The region forms part of Uttar Pradesh’s broader pilgrimage network. Visitors often combine Ayodhya with other sacred centers in the state.',
    perks: ['pilgrimage sites', 'riverfront walks', 'local festivals'],
    maxGuests: 4,
    price: 1100,
  },
  {
    title: 'Mathura & Vrindavan Darshan',
    address: 'Mathura, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/landscape-view-huge-maheshwar-fort-ahilya-fort-this-monument-is-banks-narmada-river-maheshwar-madhya-pradesh-india_136354-12278.jpg?w=900',
    ],
    description:
      'Mathura and Vrindavan are revered for their Krishna temples, festive rituals, and vibrant markets. The towns are lively yet deeply devotional. They are popular stops on cultural and religious circuits.',
    extraInfo:
      'These cities form part of Uttar Pradesh’s heritage corridor with a strong arts and festival culture. Expect music, temple architecture, and devotional gatherings.',
    perks: ['temple visits', 'local markets', 'cultural rituals'],
    maxGuests: 4,
    price: 1200,
  },
  {
    title: 'Agra Fort Heritage Stop',
    address: 'Agra, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/free-photo/mesmerizing-shot-famous-historic-taj-mahal-agra-india_181624-16028.jpg?size=626&ext=jpg&uid=R116989314&ga=GA1.2.2084330140.1695034425&semt=ais',
    ],
    description:
      'Agra Fort is a red sandstone complex tied to Mughal history. Its courtyards and palaces complement a Taj Mahal visit. The fort gives context to the region’s imperial past.',
    extraInfo:
      'The fort sits near the Yamuna River and forms part of Agra’s UNESCO heritage zone. Expect expansive views and layered architectural styles.',
    perks: ['heritage architecture', 'city views', 'guided tours'],
    maxGuests: 4,
    price: 1800,
  },
  {
    title: 'Shalimar Bagh Gardens',
    address: 'Srinagar, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/majestic-mountain-range-reflects-tranquil-unset-wave-generated-by-ai_188544-22743.jpg?t=st=1700648640~exp=1700652240~hmac=69c3ccb81f54e19ee392ffc29c06c2de729e70ede8ec0ae49ad18fe117a5c453&w=1060',
    ],
    description:
      'Shalimar Bagh is a Mughal garden known for terraces, fountains, and symmetrical layouts. It’s a peaceful walk set against mountain backdrops. The garden reflects Kashmir’s royal legacy.',
    extraInfo:
      'The gardens are part of Srinagar’s historic landscape and pair well with nearby lakes and markets. Evening visits are especially scenic.',
    perks: ['garden walks', 'heritage setting', 'photo spots'],
    maxGuests: 4,
    price: 1500,
  },
  {
    title: 'Vaishno Devi Pilgrimage',
    address: 'Katra, Jammu, India',
    photos: [
      'https://img.freepik.com/premium-photo/landscape-view-huge-maheshwar-fort-ahilya-fort-this-monument-is-banks-narmada-river-maheshwar-madhya-pradesh-india_136354-12278.jpg?w=900',
    ],
    description:
      'Vaishno Devi is one of India’s most visited pilgrimage routes, starting from Katra. The trek and shrine draw visitors throughout the year. It is a significant spiritual experience for many travelers.',
    extraInfo:
      'Jammu is known for temples and scenic foothills. Many visitors combine the pilgrimage with short nature outings and local markets.',
    perks: ['pilgrimage trek', 'temple visit', 'local markets'],
    maxGuests: 4,
    price: 1300,
  },
  {
    title: 'Alleppey Backwaters',
    address: 'Alleppey (Alappuzha), Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/phtoo-houseboat-kerala-backwaters_978318-19.jpg?w=740',
      'https://img.freepik.com/premium-photo/boat-carrying-tourists-floating-down-river-background-palm-trees-beautiful-sunset-sun-sets-horizon-shine-through-palm-trees_431724-2887.jpg?w=900',
    ],
    description:
      'Alleppey is a classic backwater destination with houseboats gliding through calm canals. The landscape is a mix of lagoons, coconut palms, and village life. It’s ideal for slow travel and sunset cruises.',
    extraInfo:
      'Houseboat stays are often paired with local seafood and village visits. The backwater network connects to nearby Kumarakom and smaller islands, offering flexible day trips.',
    perks: ['houseboat stay', 'lagoon views', 'local cuisine'],
    maxGuests: 6,
    price: 2400,
  },
  {
    title: 'Kovalam Beach',
    address: 'Kovalam, Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/leaning-palm-maasin-river-siargao_186382-12395.jpg?w=900',
    ],
    description:
      'Kovalam offers palm-lined shores and gentle waves perfect for relaxed beach days. The coastline has well-known viewpoints and seaside cafes. It’s a popular stop for wellness-focused trips.',
    extraInfo:
      'Sunset hours are the highlight, and short walks connect nearby beaches. The area blends coastal culture with easy access to temples and markets.',
    perks: ['beach access', 'sunset views', 'cafes nearby'],
    maxGuests: 4,
    price: 2000,
  },
  {
    title: 'Varkala Cliff Walk',
    address: 'Varkala, Kerala, India',
    photos: [
      'https://img.freepik.com/premium-photo/boat-carrying-tourists-floating-down-river-background-palm-trees-beautiful-sunset-sun-sets-horizon-shine-through-palm-trees_431724-2887.jpg?w=900',
    ],
    description:
      'Varkala’s cliffside promenade overlooks the sea with dramatic sunset views. The vibe is calm, with yoga studios and coastal cafes along the edge. It’s a scenic alternative to busier beaches.',
    extraInfo:
      'Cliffs create natural viewpoints and short walking loops. Many travelers pair Varkala with nearby temple visits and coastal drives.',
    perks: ['cliff views', 'beach walks', 'wellness'],
    maxGuests: 4,
    price: 1900,
  },
  {
    title: 'Kashi Vishwanath Corridor',
    address: 'Varanasi, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/view-from-boat-shore-sacred-river-ganges-varanasi-holiday_431724-5319.jpg?w=900',
    ],
    description:
      'The Kashi Vishwanath corridor brings together temple access, ghats, and sacred lanes. It is a focal point for spiritual visits and cultural walks. The surrounding alleys are alive with rituals and local markets.',
    extraInfo:
      'Evenings feature aarti ceremonies by the river, while mornings offer quiet boat rides. The corridor connects several important shrines in walking distance.',
    perks: ['temple access', 'river rituals', 'heritage walk'],
    maxGuests: 4,
    price: 1400,
  },
  {
    title: 'Srinagar Shikara Experience',
    address: 'Srinagar, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/lifestyle-dal-lake-man-drive-boat-middle-dal-lake-mountain-background_35312-254.jpg?w=900',
    ],
    description:
      'A shikara ride on Dal Lake is Srinagar’s signature experience. Floating gardens, markets, and distant mountains make the trip unforgettable. Early mornings are especially serene.',
    extraInfo:
      'The lake is central to Srinagar’s daily rhythm, with vendors and small cafés on water. Pair this with nearby Mughal gardens for a full-day itinerary.',
    perks: ['boat ride', 'lake views', 'photo spots'],
    maxGuests: 4,
    price: 1700,
  },
  {
    title: 'Gulmarg Ski Meadows',
    address: 'Gulmarg, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/mountain-city-top-view_31479-1.jpg?w=900',
    ],
    description:
      'Gulmarg transforms into a winter sports hub with snow-covered meadows and ski runs. In summer, the same fields offer scenic hikes and open-air picnics. The landscape changes dramatically by season.',
    extraInfo:
      'The gondola ride is a major highlight, offering expansive alpine views. Travelers often combine Gulmarg with Srinagar and Pahalgam.',
    perks: ['snow sports', 'gondola ride', 'meadow views'],
    maxGuests: 5,
    price: 2600,
  },
  {
    title: 'Pahalgam Riverside Escape',
    address: 'Pahalgam, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/village-mt-everest-trekking-route-with-beautiful-view-mountain-river_73740-55.jpg?size=626&ext=jpg&ga=GA1.1.533346386.1700635793&semt=ais',
    ],
    description:
      'Pahalgam is known for riverbanks, pine forests, and open valleys. It’s a calm base for short treks and countryside drives. The area suits families and slow travel.',
    extraInfo:
      'The Lidder River and surrounding meadows create easy walking routes. Nearby viewpoints deliver panoramic vistas without long hikes.',
    perks: ['river views', 'forest walks', 'family friendly'],
    maxGuests: 5,
    price: 2100,
  },
  {
    title: 'Sonamarg Alpine Trails',
    address: 'Sonamarg, Kashmir, India',
    photos: [
      'https://img.freepik.com/premium-photo/village-mt-everest-trekking-route-with-beautiful-view-mountain-river_73740-55.jpg?size=626&ext=jpg&ga=GA1.1.533346386.1700635793&semt=ais',
    ],
    description:
      'Sonamarg offers high-altitude meadows, streams, and crisp mountain air. It’s a gateway for summer treks and panoramic viewpoints. The terrain feels open and expansive.',
    extraInfo:
      'Road access is seasonal, making summer the best time to explore. It pairs well with Srinagar-based itineraries.',
    perks: ['alpine meadows', 'trek access', 'scenic drives'],
    maxGuests: 5,
    price: 2300,
  },
  {
    title: 'Agra Heritage Circuit',
    address: 'Agra, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/taj-mahal-sunrise-sunset-agra-india_163782-1745.jpg?w=900',
      'https://img.freepik.com/free-photo/mesmerizing-shot-famous-historic-taj-mahal-agra-india_181624-16028.jpg?size=626&ext=jpg&uid=R116989314&ga=GA1.2.2084330140.1695034425&semt=ais',
    ],
    description:
      'Agra is a compact heritage city with Mughal monuments and riverside vistas. The Taj Mahal and Agra Fort form a classic duo, best explored early or late in the day. The city also offers markets and artisan crafts.',
    extraInfo:
      'The UNESCO heritage zone includes gardens and historic gateways. A guided walk helps connect the monuments with their history.',
    perks: ['heritage walks', 'guided tours', 'sunrise views'],
    maxGuests: 4,
    price: 2400,
  },
  {
    title: 'Sarnath Heritage Walk',
    address: 'Sarnath, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/digital-art-beautiful-ganges-river-india-lake-dawn-sunset-beautiful-background-landscape_800563-2589.jpg?w=1060',
    ],
    description:
      'Sarnath is a tranquil site associated with Buddhist history and ancient stupas. It makes for a peaceful half-day visit from Varanasi. Museums and gardens provide added context.',
    extraInfo:
      'Ashokan-era relics and the lion capital add historical depth. The area is calm and less crowded, ideal for reflective visits.',
    perks: ['heritage ruins', 'museum visit', 'quiet trails'],
    maxGuests: 4,
    price: 1200,
  },
  {
    title: 'Ayodhya Pilgrimage Trail',
    address: 'Ayodhya, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/landscape-view-huge-maheshwar-fort-ahilya-fort-this-monument-is-banks-narmada-river-maheshwar-madhya-pradesh-india_136354-12278.jpg?w=900',
    ],
    description:
      'Ayodhya is revered for temple visits, riverfront rituals, and devotional gatherings. The city is central to Ramayana traditions and draws pilgrims year-round. The experience is spiritual and cultural.',
    extraInfo:
      'Festivals bring vibrant processions and ceremonies. Visitors often combine Ayodhya with Varanasi or Prayagraj for a broader pilgrimage route.',
    perks: ['temple visits', 'festival culture', 'riverfront walks'],
    maxGuests: 4,
    price: 1200,
  },
  {
    title: 'Mathura & Vrindavan Heritage',
    address: 'Mathura, Uttar Pradesh, India',
    photos: [
      'https://img.freepik.com/premium-photo/landscape-view-huge-maheshwar-fort-ahilya-fort-this-monument-is-banks-narmada-river-maheshwar-madhya-pradesh-india_136354-12278.jpg?w=900',
    ],
    description:
      'Mathura and Vrindavan are renowned for Krishna temples, devotional music, and festive street life. The cities offer a lively yet spiritual atmosphere. Markets and rituals continue throughout the day.',
    extraInfo:
      'The region hosts major festivals like Holi with grand processions. Short guided walks help visitors navigate temples and heritage sites.',
    perks: ['temple visits', 'festival culture', 'local markets'],
    maxGuests: 4,
    price: 1200,
  },
];

module.exports = { places };
