// Nova's Pack: the Academy (spec v2, parts C.5 and D.5). Short lessons for the human: how dogs learn.
//
// Shape: { id, title, emoji, minutes, intro, parts: [{ h, p?, list? }], takeaway, check: [{ q, options, answer, why }], sources }
//   check    2 questions; answer is the index of the right option. Passing both completes the lesson (+40 trainer XP, once).
//   sources  reputable pages for further reading. General education only: not a qualification, no diagnosis, no doses.
//
// Reward-based throughout, in line with the AVSAB position statement on humane dog training.

const AVSAB = { title: "AVSAB position statement on humane dog training (via Purdue Canine Welfare Science)", url: "https://caninewelfare.centers.purdue.edu/resource/humane-dog-training-position-statement/" };
const AVSAB_HOME = { title: "AVSAB position statements", url: "https://avsab.org/resources/position-statements/" };
const PDSA_PUPPY = { title: "PDSA, Basic training for puppies", url: "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/puppies-dogs/basic-training-for-puppies" };
const DT_RECALL = { title: "Dogs Trust, Recall training", url: "https://www.dogstrust.org.uk/dog-advice/training/basics/recall-training" };
const DT_WALK = { title: "Dogs Trust, Walking nicely on a lead", url: "https://www.dogstrust.org.uk/dog-advice/training/outdoors/walking-nicely-training" };
const DT_JUMP = { title: "Dogs Trust, Jumping up", url: "https://www.dogstrust.org.uk/dog-advice/training/unwanted-behaviours/jumping-up-training" };
const DT_ADVICE = { title: "Dogs Trust, Dog advice", url: "https://www.dogstrust.org.uk/dog-advice" };
const RSPCA_WALK = { title: "RSPCA, Teach your dog to walk nicely on a lead", url: "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training/walknicely" };
const RSPCA_BEH = { title: "RSPCA, Dog behaviour", url: "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour" };
const RSPCA_SEP = { title: "RSPCA, Separation-related behaviour", url: "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/separationrelatedbehaviour/treatment" };

export const LESSONS = [
  {
    id: "how-dogs-learn",
    title: "How dogs learn",
    emoji: "🧠",
    minutes: 2,
    intro: "Dogs do more of whatever pays off. Your job is to make the right thing pay, quickly and clearly. That's the whole secret. I'm a bit annoyed it's so simple.",
    parts: [
      { h: "Timing is everything", p: "A reward works best within a second or two of the behaviour. Late rewards teach the wrong thing: treat a dog who sat three seconds ago and stood up, and you've rewarded standing up." },
      { h: "Mark the moment", p: "A short word like \"yes\" (or a clicker) said the instant your dog gets it right tells them exactly what earned the treat. Then deliver the reward calmly." },
      { h: "Reward, don't punish", p: "Reward-based training works and keeps your bond strong. Punishment and pain-based tools can cause fear, stress and aggression, which is why vets and behaviour experts advise against them." },
    ],
    takeaway: "Catch the good moment. Mark it. Pay it. Repeat.",
    check: [
      { q: "Your dog sits, then stands up. When should the treat arrive?", options: ["Right as they sit, within a second or two", "After they stand up, so they get it eventually", "Timing doesn't matter much"], answer: 0, why: "Rewards that land late reward whatever your dog is doing at that moment." },
      { q: "What do experts recommend instead of punishment?", options: ["A firmer voice and a lead jerk", "Rewarding the behaviour you want", "Ignoring training altogether"], answer: 1, why: "Reward-based training is effective and avoids the fear and stress that punishment can cause." },
    ],
    sources: [AVSAB, PDSA_PUPPY, AVSAB_HOME],
  },
  {
    id: "body-language",
    title: "Reading body language",
    emoji: "👀",
    minutes: 2,
    intro: "I talk all day. Mostly with my ears, eyes and tail. Learn the quiet signals and you'll spot worry long before it turns into barking or a bolt.",
    parts: [
      { h: "Calm and comfy", p: "Soft eyes, loose body, relaxed mouth, a tail at a natural height, happy to sniff and explore." },
      { h: "Small stress signals", list: ["Lip licking or yawning when they're not tired", "Turning the head away, or sniffing the ground out of nowhere", "Whale eye: the whites of the eyes showing", "Ears pinned back, tail tucked, body lowered", "Freezing or going very still"] },
      { h: "What to do", p: "Give space, make things easier, or calmly leave. A worried dog can't learn. Pushing through stress can make fear worse, so go back a step." },
    ],
    takeaway: "Watch the whole dog. Small signals early mean fewer big ones later.",
    check: [
      { q: "During training your dog licks their lips, yawns and looks away. What's the best move?", options: ["Keep going, they're just bored", "Make it easier or give them a break", "Raise your voice to get their attention"], answer: 1, why: "These are common stress signals. Lower the pressure and set them up to win." },
      { q: "Which is a sign of a relaxed dog?", options: ["Whale eye and a tucked tail", "Freezing on the spot", "A loose body and soft eyes"], answer: 2, why: "Loose and wiggly is good. Stiff, still or low usually means worry." },
    ],
    sources: [RSPCA_BEH, DT_ADVICE, AVSAB],
  },
  {
    id: "space",
    title: "Worried dogs: space first",
    emoji: "🌿",
    minutes: 2,
    intro: "Some dogs bark, lunge or freeze at other dogs, people or bikes. It usually isn't rudeness. It's \"too close, too fast\". Space is the kindest tool you have.",
    parts: [
      { h: "Find the comfy distance", p: "Every worried dog has a distance where they can notice the scary thing and still sniff, think and take food. Practise there. Too close, and learning stops." },
      { h: "Pick your moments", p: "Walk at quieter times and places, cross the road, turn away, or step behind a parked car. Leaving is a skill, not a failure." },
      { h: "Change the feeling", p: "Pair the scary thing with good things from a safe distance (the \"Look at that\" skill). When your dog feels better, the barking usually fades too." },
      { h: "Get the right help", p: "If it's frequent, getting worse, or your dog has bitten, see your vet to rule out pain, then a qualified reward-based trainer or behaviourist. Never punish growling: it's an early warning." },
    ],
    takeaway: "Distance first. A calm dog can learn; a scared one can't.",
    check: [
      { q: "Your dog barks and lunges at a dog across the road. Best move?", options: ["Hold tight and walk past", "Calmly move further away, then reward calm looks", "Tell them off so they learn"], answer: 1, why: "More distance lets your dog calm down and learn. Telling off adds stress." },
      { q: "Your dog growls when a stranger leans over them. What does the growl mean?", options: ["A warning: they need space", "Bad manners to punish", "Nothing, ignore it"], answer: 0, why: "Growling is communication. Give space, and work on what worries them. Punishing it can remove the warning, not the fear." },
    ],
    sources: [RSPCA_BEH, DT_ADVICE, AVSAB],
  },
  {
    id: "rewards",
    title: "Choosing rewards",
    emoji: "🧀",
    minutes: 2,
    intro: "A reward is whatever your dog wants right now, not what you think they should want. Kibble at home, sausage at the park. I don't make the rules. Actually, I do.",
    parts: [
      { h: "Build a reward ladder", p: "List what your dog loves, from 'fine' to 'the best thing ever': kibble, then biscuits, then cheese or chicken, then a game of tug. Use better rewards for harder places." },
      { h: "Keep them tiny", p: "Pea-sized treats keep sessions moving. Count training treats as part of the day's food, and check with your vet if your dog is on a special diet or has allergies." },
      { h: "Not just food", p: "Play, praise, a sniff of that interesting lamp post, or the chance to go and say hello (only for dogs who enjoy it) can all be rewards, once your dog has learned them." },
    ],
    takeaway: "Harder place, better pay. Small and often.",
    check: [
      { q: "You're practising recall in a busy park for the first time. Which reward?", options: ["Plain kibble", "Their top favourite, like cheese or a tug game", "Nothing, they should just come"], answer: 1, why: "Hard places need high-value rewards to compete with distractions." },
      { q: "How big should a training treat be?", options: ["About pea-sized", "A whole biscuit each time", "Size doesn't matter"], answer: 0, why: "Tiny treats keep sessions quick and don't overfill your dog." },
    ],
    sources: [PDSA_PUPPY, DT_RECALL],
  },
  {
    id: "distractions",
    title: "Distraction levels",
    emoji: "🌳",
    minutes: 2,
    intro: "Your dog can 'know' a cue at home and seem to forget it in the park. That's normal. The park is a lot.",
    parts: [
      { h: "Home, garden, street, park", p: "Practise a new skill at home first, then the garden or a quiet place, then the street, then a park or busy place. That's exactly how levels work in this app." },
      { h: "Change one thing at a time", p: "Distance, duration or distraction: make only one harder at once. If it falls apart, go back a step and make it easy again." },
      { h: "The 4 out of 5 rule", p: "When your dog gets it right about 4 times out of 5 in one place, they're ready to try the next. That's the honest self-check before each level-up." },
    ],
    takeaway: "If it fails, it's too hard for now. Make it easier and build back up.",
    check: [
      { q: "Recall is great at home. Where next?", options: ["A busy park off lead", "The garden or a quiet place", "Nowhere, home is enough"], answer: 1, why: "One step up at a time: the garden or a quiet place comes before the street and the park." },
      { q: "Your dog gets it right 2 times out of 5 in a new place. What now?", options: ["Make it easier: more distance or a quieter spot", "Repeat the cue louder", "Move on to an even harder place"], answer: 0, why: "Aim for about 4 out of 5 before making things harder." },
    ],
    sources: [DT_WALK, RSPCA_WALK, DT_RECALL],
  },
  {
    id: "short-sessions",
    title: "Short sessions, end on a win",
    emoji: "⏱️",
    minutes: 1,
    intro: "Five minutes. That's it. Long sessions make tired, frustrated dogs and tired, frustrated humans. I've seen both.",
    parts: [
      { h: "Little and often", p: "A few short sessions spread through the day usually beat one long one. Stop while your dog still wants more." },
      { h: "End on a win", p: "Finish with something easy your dog can do, then reward and play. The last rep is the one they remember." },
      { h: "Bad day? Call it", p: "If you're stressed or your dog is tired, unwell or overexcited, skip it or just do one easy thing. Training should feel good for both of you." },
    ],
    takeaway: "Short, happy, finished on a success.",
    check: [
      { q: "Which plan is better for a young dog?", options: ["One 40-minute session on Sunday", "A few 3 to 5 minute sessions across the week"], answer: 1, why: "Short sessions keep focus high and learning fun." },
      { q: "The session is going badly. How do you finish?", options: ["Keep going until it works", "Ask for something easy, reward it, and stop"], answer: 1, why: "Ending on a win keeps your dog keen for next time." },
    ],
    sources: [PDSA_PUPPY, DT_RECALL],
  },
  {
    id: "management",
    title: "Management versus training",
    emoji: "🚧",
    minutes: 2,
    intro: "Training teaches a new habit. Management stops the old one being practised in the meantime. You need both. I need a baby gate, apparently.",
    parts: [
      { h: "What management looks like", list: ["A baby gate so jumping at visitors can't happen yet", "A lead or long line where recall isn't reliable", "Food off the counter while you teach 'leave it'", "A chew or puzzle toy when you can't supervise"] },
      { h: "Why it matters", p: "Every time a dog practises an unwanted behaviour, it gets stronger. Management isn't giving up: it buys time while training catches up." },
      { h: "Then train", p: "Use the calm moments management gives you to teach what you'd like instead, like sitting to say hello or settling on a mat." },
    ],
    takeaway: "Prevent the mistake, then teach the alternative.",
    check: [
      { q: "Your dog jumps on guests. Best short-term fix while you train?", options: ["A gate or lead so jumping can't happen", "Telling them off when they jump", "Doing nothing until training works"], answer: 0, why: "Management stops the habit being rehearsed while you teach calm greetings." },
      { q: "Management on its own...", options: ["Teaches the new behaviour", "Prevents practice of the old one, so pair it with training"], answer: 1, why: "It's half the job. Training teaches what to do instead." },
    ],
    sources: [DT_JUMP, RSPCA_SEP, DT_RECALL],
  },
  {
    id: "professional",
    title: "When to call a professional",
    emoji: "📞",
    minutes: 2,
    intro: "Asking for help is a pro move, not a failure. I have my human for the hard stuff. You can have a professional.",
    parts: [
      { h: "See your vet first if", list: ["A behaviour starts suddenly or changes a lot", "Your dog seems in pain, or doesn't like being touched somewhere", "Toileting, sleep or appetite change"], p: "Pain and illness often show up as behaviour changes. Your vet can check, and refer you on." },
      { h: "Then a qualified behaviour professional if", list: ["There's growling, snapping or biting", "Fear or worry is stopping your dog enjoying life", "They struggle to be left alone", "Things aren't improving despite steady, kind practice"] },
      { h: "Choosing someone", p: "Pick a trainer or behaviourist who uses reward-based methods and can tell you about their qualifications and memberships. Avoid anyone who uses pain, fear or 'dominance'." },
    ],
    takeaway: "Sudden change: vet first. Aggression or big fear: a qualified, reward-based professional.",
    check: [
      { q: "Your calm dog suddenly starts growling when you touch their back. First step?", options: ["Book a vet check", "Correct the growl firmly", "Ignore it"], answer: 0, why: "Sudden changes can mean pain. A vet should rule that out first." },
      { q: "Which trainer is the better choice?", options: ["One who promises fast results with a prong collar", "One who uses rewards and explains their qualifications"], answer: 1, why: "Reward-based professionals who are open about their training are the safe choice." },
    ],
    sources: [AVSAB, { title: "Animal Behaviour and Training Council (ABTC)", url: "https://abtc.org.uk/" }, { title: "Association of Pet Behaviour Counsellors (APBC)", url: "https://www.apbc.org.uk/" }],
  },
  {
    id: "muzzle",
    title: "Muzzle-positive in public",
    emoji: "🛡️",
    minutes: 2,
    intro: "I'm a German Shepherd, so in Ireland I wear a muzzle in public, by law. I don't mind: it means treats. A muzzle trained kindly is just another piece of kit.",
    parts: [
      { h: "The law in Ireland (an example)", p: "Under the Control of Dogs Regulations 1998, some breeds and their crosses (including German Shepherds) must, in public, be on a strong short lead held by someone over 16 who can control them, be securely muzzled, and wear a collar with the owner's name and address. Rules change and differ between countries, so check what applies where you live." },
      { h: "Make it a happy thing", list: ["Choose a basket muzzle your dog can pant, drink and take treats through", "Start by feeding treats from the muzzle, without fastening it", "Build up a second at a time to wearing it fastened", "Only then wear it on short, fun walks, and never only for scary things"] },
      { h: "Why it helps everyone", p: "A muzzle-trained dog can go to the vet, travel and visit places more safely and with less stress. Muzzle training is in the Train tab." },
    ],
    takeaway: "Go slow, pay well, and it becomes just part of going out.",
    check: [
      { q: "Which muzzle is best for walks?", options: ["A basket muzzle they can pant and drink in", "A tight fabric muzzle that holds the mouth shut"], answer: 0, why: "Dogs need to pant to cool down. Basket muzzles allow it." },
      { q: "How should muzzle training start?", options: ["Fasten it on and go to the vet", "Feed treats from it without fastening, building up slowly"], answer: 1, why: "Small, rewarded steps make the muzzle a good thing." },
    ],
    sources: [
      { title: "Control of Dogs Regulations 1998 (S.I. No. 442 of 1998), Irish Statute Book", url: "https://www.irishstatutebook.ie/eli/1998/si/442/made/en/print" },
      { title: "gov.ie, My legal responsibilities as a dog owner", url: "https://www.gov.ie/en/publication/905aa-my-legal-responsibilities-as-a-dog-owner/" },
      { title: "Best Friends Animal Society, Muzzle training plan", url: "https://bestfriends.org/resources/dogs/muzzle-training-dog-training-plan" },
      { title: "Oregon Humane Society, Training your dog to wear a basket muzzle", url: "https://www.oregonhumane.org/training/training-your-dog-to-wear-a-basket-muzzle/" },
    ],
  },
  {
    id: "good-for-us",
    title: "Why dogs are good for us",
    emoji: "💛",
    minutes: 2,
    intro: "I'd say I'm good for my human. He'd probably agree, on most days. Here's what's known, kept honest: no miracle claims.",
    parts: [
      { h: "Getting moving", p: "A dog needs walking, and walking is good for people too. One UK study found dog owners were more likely than people without a dog to reach recommended activity levels." },
      { h: "Routine", p: "Meals, walks and training give a day some shape. Small, regular routines are a kind way to build good days, for both of you." },
      { h: "Connection", p: "Dogs are great conversation starters on walks, and many people say time with their dog helps them feel calmer and less alone. Researchers are still learning how much, and for whom." },
      { h: "Keep it kind", p: "A dog is not a fix for hard times, and it's fine if some days are hard. If things feel heavy, talking helps: see 'If things feel heavy' in More." },
    ],
    takeaway: "Walks, routine and company: small things that add up to good days.",
    check: [
      { q: "What did a UK study find about dog owners?", options: ["They were more likely to reach recommended activity levels", "They never get ill", "They don't need to see a doctor"], answer: 0, why: "Owners walked more on average. That's activity, not a cure for anything." },
      { q: "Which is the honest way to put it?", options: ["Owning a dog heals you", "Many people say time with their dog helps them feel calmer and build good days"], answer: 1, why: "We keep it honest: helpful for many people, not a medical treatment." },
    ],
    sources: [
      { title: "Westgarth et al. (2019), Dog owners are more likely to meet physical activity guidelines, Scientific Reports", url: "https://doi.org/10.1038/s41598-019-41254-6" },
      { title: "NIH News in Health, The power of pets", url: "https://newsinhealth.nih.gov/2018/02/power-pets" },
      { title: "Human Animal Bond Research Institute (HABRI)", url: "https://habri.org/" },
    ],
  },
];

/** Real routes into professional training (the "Go pro" card at Coach rank). Not affiliated; details change. */
export const GO_PRO = [
  { title: "In Ireland: a QQI Level 6 course in dog training or behaviour", text: "Several colleges and providers run them. Check any course is on the QQI register before you pay. We're not linked to any provider.", url: "https://www.qqi.ie/", link: "QQI (Quality and Qualifications Ireland)" },
  { title: "Karen Pryor Academy", text: "A well-known reward-based trainer programme, studied online with hands-on parts.", url: "https://karenpryoracademy.com/", link: "karenpryoracademy.com" },
  { title: "Registers for trainers and behaviourists", text: "The ABTC sets standards and keeps registers in the UK and Ireland, so you can see what qualified looks like.", url: "https://abtc.org.uk/", link: "abtc.org.uk" },
];
