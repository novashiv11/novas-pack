// Nova's Pack: the pet care diary. Care reference (content contract, part C of docs/build-prompt-v4-app.md).
//
// Everything here is general information, written as suggestions. Your vet decides your pet's schedule.
// No drug names, no doses, no diagnosis. Sources are listed in SOURCES at the bottom.

// Vaccine names to suggest when someone logs a vaccine. "other" is empty on purpose: the app falls back to free text.
export const VACCINES = {
  dog: [
    {
      name: "Distemper, parvovirus, hepatitis (DHP / DHPP)",
      what: "A core vaccine against three serious viruses that WSAVA advises for every dog; the extra P in DHPP adds parainfluenza.",
    },
    {
      name: "Leptospirosis",
      what: "Protects against a bacterial disease spread through urine and water; WSAVA treats it as core where it is common, so it varies by country and lifestyle.",
    },
    {
      name: "Rabies",
      what: "Protects against a fatal virus; the law and travel rules differ by country, so check what applies where you live.",
    },
    {
      name: "Kennel cough (Bordetella/Parainfluenza)",
      what: "An optional vaccine for dogs who mix with many others, for example at kennels, daycare, groomers or shows.",
    },
  ],
  cat: [
    {
      name: "Cat flu and enteritis (FVRCP)",
      what: "A core vaccine against cat flu viruses and feline enteritis (panleukopenia) that WSAVA advises for every cat.",
    },
    {
      name: "Feline leukaemia (FeLV)",
      what: "A non-core vaccine against a virus spread by close contact, usually advised for kittens and for cats who go outdoors or live with other cats.",
    },
    {
      name: "Rabies",
      what: "Protects against a fatal virus; the law and travel rules differ by country, so check what applies where you live.",
    },
  ],
  rabbit: [
    {
      name: "Myxomatosis + RHD1/RHD2 combined",
      what: "In the UK and much of Europe, vets give a yearly combined vaccine against myxomatosis and both strains of rabbit haemorrhagic disease, but products and schedules vary by country.",
    },
    {
      name: "Myxomatosis and RHD vaccines given separately",
      what: "Some rabbits, such as pregnant or breeding ones, have these as separate vaccines on a different schedule, so follow your vet's plan.",
    },
  ],
  other: [],
};

// Parasite and routine-protection suggestions. Products and how often depend on your pet and where you live: ask your vet.
export const PREVENTIVES = {
  dog: [
    {
      name: "Flea treatment",
      what: "Fleas cause itching and can carry tapeworm, so most vets advise regular protection using a product they recommend for your dog.",
    },
    {
      name: "Tick treatment",
      what: "Ticks can pass on illnesses such as Lyme disease, so ask your vet what suits your area and check your dog after walks in long grass or woods.",
    },
    {
      name: "Worming (roundworm and tapeworm)",
      what: "Regular worming protects your dog and your family; ESCCAP advises at least four times a year when risk is unclear, and more often for puppies and higher-risk dogs.",
    },
    {
      name: "Lungworm protection",
      what: "Lungworm is picked up from slugs, snails and slime trails and is found in Ireland and the UK, so many vets there advise regular prevention.",
    },
    {
      name: "Heartworm prevention",
      what: "Heartworm is spread by mosquitoes in warm regions such as much of the US, and is not normally found in Ireland or the UK, so ask your vet whether you need it where you live or travel.",
    },
  ],
  cat: [
    {
      name: "Flea treatment",
      what: "Fleas cause itching and can carry tapeworm, and indoor cats can catch them too, so ask your vet about regular protection for your cat.",
    },
    {
      name: "Tick treatment",
      what: "Cats who roam outdoors can pick up ticks, so ask your vet what suits your area and check your cat after time outside.",
    },
    {
      name: "Worming (roundworm and tapeworm)",
      what: "ESCCAP suggests worming indoor cats once or twice a year and outdoor, roaming cats at least four times a year; hunters need more, so ask your vet.",
    },
    {
      name: "Heartworm prevention",
      what: "In regions where heartworm occurs, such as much of the US, vets may advise year-round prevention for cats too, so ask your vet if this applies to you.",
    },
  ],
  rabbit: [
    {
      name: "Flystrike prevention",
      what: "Flies lay eggs on soiled fur in warm weather, so check your rabbit's back end every day, keep their space clean and dry, and ask your vet about extra protection.",
    },
    {
      name: "Flea and mite treatment",
      what: "Rabbits can get fleas and fur mites, and fleas can spread myxomatosis, so use only products your vet recommends for rabbits, never dog or cat ones.",
    },
    {
      name: "Worming and E. cuniculi",
      what: "Vets differ on routine worming for rabbits, and some advise it for outdoor rabbits or large groups, so follow your vet's advice.",
    },
  ],
  other: [
    {
      name: "Parasite checks",
      what: "Needs vary a lot between birds, small mammals, reptiles and other pets, so ask a vet who treats your kind of pet which checks and treatments they need.",
    },
    {
      name: "Worming or faecal check",
      what: "Many pets benefit from a regular poop test or worming plan, and your vet can tell you how often is right for your species.",
    },
    {
      name: "Mite and lice check",
      what: "Birds and small animals can get mites and lice, so look over skin, feathers and fur often and tell your vet about itching, scabs or hair loss.",
    },
  ],
};

// A simplified five-step poop scale for dogs and cats, based on the Purina Fecal Scoring Chart (1 to 7, where 2 is ideal).
// Score 3 here is the ideal step, scores 1 and 2 run from hard to firm, and scores 4 and 5 cover soft to watery.
// Rabbits normally pass round, dry pellets, so for them watch the size and number of droppings instead.
export const POOP_SCALE = [
  {
    score: 1,
    emoji: "\u{1FAA8}",
    label: "Very hard, dry pellets",
    hint: "Small, dry pellets that leave no mark when picked up. Normal for rabbits, but in dogs and cats tell your vet if it keeps happening or they strain.",
  },
  {
    score: 2,
    emoji: "\u{1F330}",
    label: "Firm and a little dry",
    hint: "Firm and segmented but a touch hard or dry. Usually fine, so keep an eye on it.",
  },
  {
    score: 3,
    emoji: "✅",
    label: "Ideal: firm, log-shaped, easy to pick up",
    hint: "Holds its shape and leaves little or no mess when picked up. This is what you want to see.",
  },
  {
    score: 4,
    emoji: "\u{1F366}",
    label: "Soft and moist, loses its shape",
    hint: "Very moist or soggy and may smear when picked up. One-off is common; if it lasts or comes with other signs, see \"Call your vet\".",
  },
  {
    score: 5,
    emoji: "\u{1F4A6}",
    label: "Watery",
    hint: "Runny, with no real shape, forming a puddle. If it lasts more than a day or comes with vomiting or tiredness, call your vet.",
  },
];

// Optional extras the app can tick when logging a poop.
export const POOP_FLAGS = [
  { id: "blood", label: "Blood (red streaks or clots)" },
  { id: "mucus", label: "Mucus (slimy or jelly-like)" },
  { id: "black-tarry", label: "Black or tarry" },
  { id: "worms", label: "Worms or rice-like bits" },
  { id: "unusual-colour", label: "Unusual colour" },
  { id: "straining", label: "Straining or discomfort" },
];

// Plain-language rules the app shows as a calm "Call your vet" card. Deliberately conservative. Never a diagnosis.
// Where sources differ on timing (for example 24 to 72 hours for diarrhoea), the shorter, safer time is used.
export const RED_FLAGS = [
  {
    when: "Black, tarry poop, or a lot of blood",
    advice: "Call your vet now. Black or tarry poop and large amounts of blood need prompt attention, so use an emergency vet out of hours.",
  },
  {
    when: "Blood in the poop along with vomiting, tiredness or not eating",
    advice: "Call your vet now rather than waiting to see if it settles.",
  },
  {
    when: "Diarrhoea (loose or watery poop) for more than 24 hours",
    advice: "Call your vet today for advice, even if your pet seems bright.",
  },
  {
    when: "Diarrhoea with vomiting, tiredness, or not eating or drinking",
    advice: "Call your vet the same day. If your pet is very weak, collapses or has pale gums, go to an emergency vet now.",
  },
  {
    when: "Puppy, kitten or senior pet (or a pet with a health condition) with diarrhoea",
    advice: "Call your vet the same day and do not wait 24 hours, because young, older or unwell pets can dry out quickly.",
  },
  {
    when: "No poop for more than 48 hours (dog or cat)",
    advice: "Call your vet, and sooner for a kitten or if your pet is also vomiting, off their food or has a sore tummy.",
  },
  {
    when: "Straining to poop with little or nothing coming out",
    advice: "Call your vet straight away. In cats, especially male cats, straining in the litter tray can be an emergency, and it can be hard to tell poop from pee.",
  },
  {
    when: "Worms or rice-like bits seen in the poop or around the bottom",
    advice: "Tell your vet and book a visit soon, and sooner for a puppy or kitten or if your pet seems unwell. Do not treat at home without advice.",
  },
  {
    when: "Any change in poop that lasts more than 2 days (mucus, unusual colour, looser or harder than normal)",
    advice: "Book a vet visit and show them your Poop log.",
  },
  {
    when: "Rabbit: no poop, or only tiny droppings, and not eating for about 12 hours",
    advice: "This is an emergency, so call a rabbit-savvy or emergency vet straight away, and sooner if your rabbit is hunched, bloated, quiet or grinding their teeth. Do not give home remedies.",
  },
  {
    when: "Rabbit: fewer or smaller droppings than usual, runny poop, or a dirty bottom",
    advice: "Call your vet the same day, and check your rabbit's back end for fly eggs or maggots in warm weather.",
  },
  {
    when: "You think your pet has eaten something poisonous, or something that could block the gut",
    advice: "Call your vet or an emergency vet now. Do not wait for signs to appear.",
  },
];

export const VET_FIRST =
  "Nova's Pack is a diary, not a vet, so it cannot diagnose or tell you what to give, and if you are worried about your pet, call your vet first.";

// Every source used for the care reference and the training skills. Search snippets were read for each,
// and the URLs are as returned by search. Re-check pages before relying on exact wording.
export const SOURCES = [
  // Vaccines
  {
    title: "WSAVA, 2024 Guidelines for the Vaccination of Dogs and Cats",
    url: "https://wsava.org/wp-content/uploads/2024/05/2024-Guidelines-for-the-Vaccination-of-Dogs-and-Cats.pdf",
  },
  {
    title: "AAHA, Leptospirosis vaccination recommended to be core for most dogs",
    url: "https://www.aaha.org/newstat/publications/leptospirosis-vaccination-recommended-to-be-core-for-most-dogs/",
  },
  {
    title: "Blue Cross Ireland, Puppy and dog vaccinations",
    url: "https://www.bluecross.ie/?p=12827",
  },
  {
    title: "Rabbit Welfare Association and Fund, Rabbit vaccines",
    url: "https://rabbitwelfare.co.uk/vaccines/",
  },
  // Poop scale
  {
    title: "Purina, Faecal Score Chart (1 to 7)",
    url: "https://vetcentre.purina.co.uk/sites/default/files/materials-pdfs/VET43912%2033161%20Vet%20channel%20-%20Faecal%20score%20chart%20A4%20-%20VET43912_V2%20LO-RES.pdf",
  },
  // Red flags
  {
    title: "PDSA, Dealing with diarrhoea in pets",
    url: "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/all-pets/diarrhoea-in-pets",
  },
  {
    title: "PDSA, Gastroenteritis (stomach upset) in dogs",
    url: "https://www.pdsa.org.uk/pet-help-and-advice/pet-health-hub/conditions/gastroenteritis-stomach-upset-in-dogs",
  },
  {
    title: "Cornell University Riney Canine Health Center, Diarrhea",
    url: "https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center/canine-health-topics/diarrhea",
  },
  {
    title: "VCA Animal Hospitals, What to do when your puppy has diarrhea",
    url: "https://vcahospitals.com/pediatric/puppy/health-wellness/puppy-has-diarrhea",
  },
  {
    title: "Blue Cross, Vomiting and diarrhoea in dogs",
    url: "https://www.bluecross.org.uk/advice/dog/health-and-injuries/vomiting-and-diarrhoea-in-dogs",
  },
  {
    title: "VCA Animal Hospitals, Emergencies in dogs",
    url: "https://vcahospitals.com/know-your-pet/common-emergencies-in-dogs",
  },
  {
    title: "VCA Animal Hospitals, Constipation in cats",
    url: "https://vcahospitals.com/know-your-pet/constipation-in-cats",
  },
  {
    title: "International Cat Care, Constipation in cats",
    url: "https://icatcare.org/articles/constipation-in-cats",
  },
  {
    title: "Cats Protection, How often should cats poo and pee?",
    url: "https://www.cats.org.uk/cats-blog/how-often-should-cats-poo-and-pee",
  },
  {
    title: "Rabbit Welfare Association and Fund, Recognising emergencies",
    url: "https://rabbitwelfare.co.uk/welfare-need/recognising-emergencies/",
  },
  {
    title: "Rabbit Welfare Association and Fund, Gut slowdown",
    url: "https://rabbitwelfare.co.uk/welfare-need/gut-slowdown/",
  },
  {
    title: "House Rabbit Society, GI stasis",
    url: "https://rabbit.org/care/gi-stasis/",
  },
  // Preventives
  {
    title: "ESCCAP, Worm control in dogs and cats (UK and Ireland, and European guidelines)",
    url: "https://www.esccap.org/",
  },
  {
    title: "Companion Animal Parasite Council, The case for year-round flea and tick control",
    url: "https://capcvet.org/articles/the-case-for-year-round-flea-and-tick-control/",
  },
  {
    title: "PDSA, Lungworm in dogs",
    url: "https://www.pdsa.org.uk/pet-help-and-advice/pet-health-hub/conditions/lungworm-in-dogs",
  },
  {
    title: "Vet Times, Angiostrongylus vasorum: where is it and what are the risks?",
    url: "https://vettimes.com/clinical/small-animal/angiostrongylus-vasorum-where-is-it-and-what-are-the-risks",
  },
  {
    title: "PDSA, Flystrike in rabbits",
    url: "https://www.pdsa.org.uk/taking-care-of-your-pet/looking-after-your-pet/rabbits/flystrike",
  },
  {
    title: "Vet Times, Rabbit ectoparasites: treatment, identification and client advice",
    url: "https://www.vettimes.co.uk/app/uploads/wp-post-to-pdf-enhanced-cache/1/rabbit-ectoparasites-treatment-identification-and-client-advice.pdf",
  },
  // Training
  {
    title: "AVSAB, Humane Dog Training Position Statement (hosted by Purdue Canine Welfare Science)",
    url: "https://caninewelfare.centers.purdue.edu/resource/humane-dog-training-position-statement/",
  },
  {
    title: "Dogs Trust, Recall training: come back when called",
    url: "https://www.dogstrust.org.uk/dog-advice/training/basics/recall-training",
  },
  {
    title: "Dogs Trust, How to stop your dog pulling on the lead",
    url: "https://www.dogstrust.org.uk/dog-advice/training/outdoors/walking-nicely-training",
  },
  {
    title: "Dogs Trust, How to stop your dog jumping up at people",
    url: "https://www.dogstrust.org.uk/dog-advice/training/unwanted-behaviours/jumping-up-training",
  },
  {
    title: "RSPCA, Train your dog to stop pulling on the lead",
    url: "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/walknicely",
  },
  {
    title: "PDSA, Basic training for puppies",
    url: "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/basic-training-for-puppies",
  },
  {
    title: "Oregon Humane Society, Training your dog to wear a basket muzzle",
    url: "https://www.oregonhumane.org/training/training-your-dog-to-wear-a-basket-muzzle/",
  },
  {
    title: "Best Friends Animal Society, Muzzle training plan",
    url: "https://bestfriends.org/resources/dogs/muzzle-training-dog-training-plan",
  },
  {
    title: "Pasadena Humane, Muzzle training",
    url: "https://pasadenahumane.org/muzzle-training/",
  },
  {
    title: "Wisconsin Humane Society, Teach your cat to love the carrier",
    url: "https://www.wihumane.org/resource/teach-your-cat-to-love-the-carrier/",
  },
  {
    title: "BSAVA, Promoting cat training to reduce veterinary visit stress (International Cat Day 2021)",
    url: "https://bsava.com/article/promoting-cat-training-to-reduce-veterinary-visit-stress-a-key-focus-of-international-cat-day-2021/",
  },
  // Irish restricted-breed law
  {
    title: "Oireachtas, Parliamentary question on restricted dog breeds (15 Dec 2022)",
    url: "https://www.oireachtas.ie/en/debates/question/2022-12-15/49/",
  },
  {
    title: "Mayo County Council, Restricted breeds",
    url: "https://mayo.ie/dog-warden/restricted-breeds",
  },
  {
    title: "Irish Statute Book, Control of Dogs Regulations 1998 (S.I. No. 442 of 1998)",
    url: "https://www.irishstatutebook.ie/eli/1998/si/442/made/en/print",
  },
];
