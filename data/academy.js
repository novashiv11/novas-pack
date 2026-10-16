// Nova's Pack: the Academy (spec v2, parts C.5 and D.5). Short lessons for the human, for every kind of pet.
//
// Shape: { id, title, emoji, minutes, intro, parts: [{ h, p?, list? }], takeaway, check: [{ q, options, answer, why }], sources, species? }
//   species  optional list of pet species ("dog", "cat", "rabbit", "chicken"...). No `species` means the lesson is for everyone;
//            a tag means only pets of those species see it (the sample world and "no pet" see everything). Never remove or rename
//            an id: lessons people already finished still count towards their Trainer rank.
//   check    2 questions; answer is the index of the right option. Passing both completes the lesson (+40 trainer XP, once).
//   sources  reputable pages for further reading. General education only: not a qualification, no diagnosis, no doses.
//
// Reward-based throughout, in line with the AVSAB position statement on humane dog training. The cat, rabbit and hen lessons
// only state what the linked welfare charities say, and leave the rest out.

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

// Sources for the cat, rabbit and hen lessons (welfare charities). Claims in those lessons are limited to what these say.
const CP_BODY = { title: "Cats Protection, Cat body language", url: "https://www.cats.org.uk/help-and-advice/cat-behaviour/cat-body-language" };
const PDSA_CAT_BODY = { title: "PDSA, Cat body language", url: "https://www.pdsa.org.uk/pet-help-and-advice/looking-after-your-pet/kittens-cats/cat-body-language" };
const RSPCA_CAT_UNDERSTAND = { title: "RSPCA, Understanding your cat's behaviour", url: "https://www.rspca.org.uk/adviceandwelfare/pets/cats/behaviour/understanding" };
const ICC_HANDLING = { title: "International Cat Care, Handling and interactions", url: "https://icatcare.org/articles/handling-and-interactions" };
const ICC_FRIENDLY = { title: "International Cat Care, Cat friendly interaction", url: "https://icatcare.org/articles/cat-friendly-interaction" };
const RSPCA_RABBITS = { title: "RSPCA, Pet rabbits: care, behaviour and welfare", url: "https://www.rspca.org.uk/adviceandwelfare/pets/rabbits" };
const RSPCA_RABBIT_BOOKLET = { title: "RSPCA, Getting ready for your RSPCA rescue rabbits (booklet)", url: "https://www.rspca.org.uk/documents/1494939/7712578/648_Pre-adoption_booklet_rabbits_single_2021+(1).pdf/5f5f1a45-4486-421c-cef2-b8579feae514?t=1646424890372" };
const RWAF_HANDLING = { title: "Rabbit Welfare Association & Fund, How to handle pet rabbits safely and calmly", url: "https://rabbitwelfare.co.uk/handling-rabbits/" };
const RWAF_CODE = { title: "Rabbit Welfare Association & Fund, Good practice code for the welfare of rabbits (2023)", url: "https://rabbitwelfare.co.uk/wp-content/uploads/2023/01/Rabbit-CoP-July-2023-final.pdf" };
const RSPCA_CHICKENS = { title: "RSPCA, Keeping chickens as pets: how to care for backyard hens", url: "https://www.rspca.org.uk/adviceandwelfare/pets/chickens" };
const BHWT_FAQ = { title: "British Hen Welfare Trust, Hen health FAQs", url: "https://www.bhwt.org.uk/hen-health/hen-health-faqs/" };
const BHWT_DUST = { title: "British Hen Welfare Trust, Chicken dust bath: the ultimate spa treatment", url: "https://www.bhwt.org.uk/blog/health-welfare/chicken-dust-bath/" };
const BHWT_BROODY = { title: "British Hen Welfare Trust, The complete guide to caring for a broody hen", url: "https://www.bhwt.org.uk/blog/health-welfare/caring-for-a-broody-hen/" };
const BHWT_HOUSING = { title: "British Hen Welfare Trust, Avian flu housing order tips (mentions pecking blocks as treats)", url: "https://bhwt.org.uk/health-welfare/tip-for-keeping-your-hens-safe-under-a-housing-order" };

export const LESSONS = [
  {
    id: "how-dogs-learn",
    species: ["dog"],
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
    species: ["dog"],
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
    id: "cats",
    species: ["cat"],
    title: "Reading your cat",
    emoji: "🐱",
    minutes: 2,
    intro: "I say everything out loud. Cats say it quietly, with a tail, an ear or a blink, and then look unimpressed when we miss it. Learn to listen and you'll get a lot more out of your cat.",
    parts: [
      { h: "Tails and ears", p: "Read the whole cat, not just one bit.", list: ["An upright tail with a curl at the tip usually means \"glad to see you\"", "A tail flicking from side to side suggests irritation", "A tail tucked tightly against the body suggests fear or worry", "Ears forward and relaxed suggest a content cat", "Ears flat or turned sideways suggest stress or unhappiness", "Ears up but turned outwards suggest a worried cat on high alert"] },
      { h: "The slow blink", p: "Cats Protection suggests slowly blinking at your cat and turning your head slightly: cats often blink slowly back. International Cat Care adds that a slow blink can also be a cat keeping the peace, so it isn't an automatic invitation to touch." },
      { h: "Let your cat choose", p: "A cat who walks away, or turns their head away, is giving you a clear no. Take it kindly. International Cat Care suggests:", list: ["Turn your body side-on, which feels less threatening", "Stay still and let the cat come to you", "Avoid staring, and never reach into a hiding place", "Stroke for about three seconds, then pause, so your cat can decide whether to carry on", "Avoid picking your cat up when you're just saying hello: it takes away their choice"] },
      { h: "Hiding is a message", p: "A cat who hides is usually stressed or worried, so leave them in their hiding place. Hiding places help cats feel safe, so make sure yours has somewhere to retreat to. If hiding is new, goes on, or comes with other changes in behaviour, talk to your vet." },
    ],
    takeaway: "Notice the quiet signals. Offer, don't force. Let your cat choose.",
    check: [
      { q: "Your cat walks away while you're stroking them. What now?", options: ["Follow and keep stroking, they'll come round", "Let them go: walking away is a clear no", "Pick them up for a cuddle instead"], answer: 1, why: "Walking away or turning the head away is a clear no. Letting them leave keeps the choice with your cat." },
      { q: "Your cat has gone under the bed and is staying there. Best move?", options: ["Reach in and gently pull them out", "Leave them be, and call your vet if it's new or keeps going", "Stare at them until they come out"], answer: 1, why: "Hiding usually means a cat is stressed or worried. Reaching in or staring adds pressure, and a new pattern of hiding is worth a vet's opinion." },
    ],
    sources: [CP_BODY, PDSA_CAT_BODY, ICC_HANDLING, ICC_FRIENDLY, RSPCA_CAT_UNDERSTAND],
  },
  {
    id: "rabbits",
    species: ["rabbit"],
    title: "Happy rabbits",
    emoji: "🐰",
    minutes: 2,
    intro: "Rabbits are prey animals: fragile, easily hurt, and not keen on being picked up. I'm a dog, so on paper I'm the thing they worry about. Be gentler than me.",
    parts: [
      { h: "Come down to their level", p: "The RSPCA says rabbits are fragile and can be injured easily, and as prey animals they generally prefer not to be picked up. Where you can, interact at ground level: sit on the floor and offer a suitable treat so your rabbit can choose to come to you." },
      { h: "If you do have to lift", p: "Sometimes you must, a vet trip for one. The RSPCA suggests one hand under the chest and front legs and the other supporting the bottom, then holding your rabbit close to your body so they feel secure and can't kick out. Never hold a rabbit on their back to keep them still: the Rabbit Welfare Association & Fund says that is a terrified rabbit playing dead, a prey animal's response to being caught." },
      { h: "Company and a place to hide", list: ["Rabbits need the company of another rabbit (ask a rescue or your vet how to introduce rabbits safely)", "They tend to hide when they're afraid, unwell or stressed, or when they want time away from other rabbits or people, so always give them somewhere to retreat", "They're most active at dawn, dusk and overnight, so a steady daily routine for food and handling suits them"], p: "A rabbit who is hiding more than usual, or just seems off, is a reason to call your vet." },
      { h: "Room to be a rabbit", p: "The Rabbit Welfare Association & Fund describes rabbits as naturally athletic and inquisitive: they need chances to run, jump, forage and dig." },
    ],
    takeaway: "Low, slow and patient. Let your rabbit choose to come to you.",
    check: [
      { q: "Your rabbit is nervous about being picked up. What's a kind way to spend time together?", options: ["Sit on the floor and offer a suitable treat so they can come to you", "Lift them out of their enclosure for a cuddle", "Hold them on their back until they relax"], answer: 0, why: "Ground-level time lets a prey animal choose to approach. A rabbit held on their back isn't relaxed: it's a terrified, playing-dead response." },
      { q: "Which is true of rabbits?", options: ["They need the company of another rabbit", "They're happiest living alone", "They're happiest when held often"], answer: 0, why: "The RSPCA lists the company of another rabbit among the things rabbits need." },
    ],
    sources: [RSPCA_RABBITS, RWAF_HANDLING, RSPCA_RABBIT_BOOKLET, RWAF_CODE],
  },
  {
    id: "hens",
    species: ["chicken"],
    title: "Happy hens",
    emoji: "🐔",
    minutes: 2,
    intro: "Hens run a social order stricter than any dog park, and they take their dust baths seriously. Learn the flock's rules and you'll have happy hens (and a bit more respect for the top hen).",
    parts: [
      { h: "The pecking order", p: "The British Hen Welfare Trust says flocks usually settle into a fairly firm hierarchy: the top hen eats first and the others defer to her. Some pushing about is normal. If bullying becomes consistent and skin is broken, the RSPCA suggests separating the birds. A hen who is injured, or just not herself, is one for your vet." },
      { h: "Dust baths", p: "Hens need somewhere to dust bathe. The BHWT suggests dry, loose soil or sand, and the RSPCA notes that dry soil or wood shavings are particularly important when it's wet outside." },
      { h: "Handling", p: "Hens can peck when you handle them. In its guide to broody hens, the BHWT suggests wearing garden gloves to protect your hands if a hen is pecking at you." },
      { h: "Treats are treats", p: "Treats are the fun part, and they should stay a small part. The BHWT notes that pecking blocks are treats, and fattening, so they shouldn't be overfed. Ask your vet if you're unsure what suits your hens." },
    ],
    takeaway: "Respect the pecking order, give them somewhere to dust bathe, and keep treats as treats.",
    check: [
      { q: "What should hens have for dust bathing?", options: ["Dry, loose soil or sand", "A shallow dish of water", "Wet mud"], answer: 0, why: "The BHWT suggests dry, loose soil or sand for dust bathing." },
      { q: "Your hens love their pecking block. How should you treat it?", options: ["As a treat: it's fattening, so don't overfeed it", "As their main meal", "Leave it out and forget about it"], answer: 0, why: "The BHWT notes that pecking blocks are treats, and fattening, so they shouldn't be overfed." },
    ],
    sources: [BHWT_FAQ, BHWT_DUST, BHWT_BROODY, BHWT_HOUSING, RSPCA_CHICKENS],
  },
  {
    id: "space",
    species: ["dog"],
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
    intro: "A reward is whatever your pet wants right now, not what you think they should want. Everyday food at home, something special somewhere busy. I don't make the rules. Actually, I do.",
    parts: [
      { h: "Build a reward ladder", p: "List what your pet loves, from 'fine' to 'the best thing ever', and use better rewards for harder places. For a dog that might climb from kibble to biscuits, then cheese or chicken, then a game of tug. For other animals, ask your vet which foods and treats are safe for them." },
      { h: "Keep them tiny", p: "Tiny treats keep sessions moving (pea-sized is plenty for a dog). Count training treats as part of the day's food, and check with your vet if your pet is on a special diet or has allergies." },
      { h: "Not just food", p: "Play, praise, a good sniff of something interesting, or time doing something they love can all be rewards, once your pet has learned to enjoy them." },
    ],
    takeaway: "Harder place, better pay. Small and often.",
    check: [
      { q: "You're practising somewhere busy for the first time. Which reward?", options: ["Their plain everyday food", "Their top favourite, like a special treat or a favourite game", "Nothing, they should just do it"], answer: 1, why: "Hard places need high-value rewards to compete with distractions." },
      { q: "How big should a training treat be?", options: ["Tiny: about pea-sized for a dog", "A big piece each time", "Size doesn't matter"], answer: 0, why: "Tiny treats keep sessions quick and don't overfill your pet." },
    ],
    sources: [PDSA_PUPPY, DT_RECALL],
  },
  {
    id: "distractions",
    species: ["dog"],
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
    intro: "Five minutes. That's it. Long sessions make tired, frustrated pets and tired, frustrated humans. I've seen both.",
    parts: [
      { h: "Little and often", p: "A few short sessions spread through the day usually beat one long one. Stop while your pet still wants more." },
      { h: "End on a win", p: "Finish with something easy your pet can do, then reward and play. The last rep is the one they remember." },
      { h: "Bad day? Call it", p: "If you're stressed or your pet is tired, unwell or overexcited, skip it or just do one easy thing. Training should feel good for both of you." },
    ],
    takeaway: "Short, happy, finished on a success.",
    check: [
      { q: "Which plan is better for a young or new pet?", options: ["One 40-minute session on Sunday", "A few 3 to 5 minute sessions across the week"], answer: 1, why: "Short sessions keep focus high and learning fun." },
      { q: "The session is going badly. How do you finish?", options: ["Keep going until it works", "Ask for something easy, reward it, and stop"], answer: 1, why: "Ending on a win keeps your pet keen for next time." },
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
      { h: "What management looks like", list: ["A baby gate or pen so jumping at visitors can't happen yet", "A lead or long line where recall isn't reliable (for dogs)", "Food out of reach while you teach 'leave it'", "A safe chew, forage or puzzle toy when you can't supervise"] },
      { h: "Why it matters", p: "Every time a pet practises an unwanted behaviour, it gets stronger. Management isn't giving up: it buys time while training catches up." },
      { h: "Then train", p: "Use the calm moments management gives you to teach what you'd like instead, like calm greetings or settling on a mat." },
    ],
    takeaway: "Prevent the mistake, then teach the alternative.",
    check: [
      { q: "Your pet jumps up on guests. Best short-term fix while you train?", options: ["A gate or lead so jumping can't happen", "Telling them off when they jump", "Doing nothing until training works"], answer: 0, why: "Management stops the habit being rehearsed while you teach calm greetings." },
      { q: "Management on its own...", options: ["Teaches the new behaviour", "Prevents practice of the old one, so pair it with training"], answer: 1, why: "It's half the job. Training teaches what to do instead." },
    ],
    sources: [DT_JUMP, RSPCA_SEP, DT_RECALL],
  },
  // v10: three lessons for trainers who have the basics. Sources reuse the reward-based pages above.
  {
    id: "fading-treats",
    species: ["dog"],
    title: "Fading the treats",
    emoji: "🤲",
    minutes: 2,
    intro: "People worry they'll need a pocket of cheese forever. You won't. You'll still pay me, though. I'm a professional.",
    parts: [
      { h: "Lose the lure early", p: "A lure is food in your hand that your dog follows into position. It's a great start, so fade it early: after a few good reps, make the same hand movement with no food in it, and reward from your other hand or your pocket. The empty-hand movement becomes a hand signal." },
      { h: "Then add the word", p: "Once your dog follows the hand signal reliably, say the cue word just before you give the signal. After plenty of reps the word starts to predict the signal, and you can make the signal smaller and smaller." },
      { h: "Every time, then the best ones", p: "While a skill is new, reward every correct rep. Once it's solid in that place, pay the best responses with food and the others with praise, a sniff or a game. Make something harder (a new place, more distance, a longer hold) and you go back to rewarding every rep for a while." },
      { h: "Life rewards", p: "Treats never fully stop, and they don't need to. Keep paying well for the hard stuff, like recall. Everyday life is full of rewards too:", list: ["Sit at the door, and the walk is the reward", "Check in with you, then \"go sniff\"", "A calm down, then the ball gets thrown", "Come when called, then off you go to play again"] },
    ],
    takeaway: "Lose the lure early, pay the best reps, and let good things in life be rewards too.",
    check: [
      { q: "Your dog follows a treat in your hand into a down every time. What next?", options: ["Make the same hand movement with no treat in it, and reward from your other hand", "Keep luring with food until it's perfect everywhere", "Stop rewarding: they know it now"], answer: 0, why: "Fading the lure early turns the movement into a hand signal, so your dog isn't only working when they can see food." },
      { q: "Sit is solid at home. You try it in a busy park for the first time. How often do you reward?", options: ["Now and then: they know it", "Every correct sit, with something great", "Never: it should be automatic by now"], answer: 1, why: "A harder place makes it a new challenge. Reward every rep there, then fade again once it's solid." },
    ],
    sources: [AVSAB, PDSA_PUPPY, DT_ADVICE],
  },
  {
    id: "cues",
    species: ["dog"],
    title: "Cues that work",
    emoji: "🗣️",
    minutes: 2,
    intro: "\"Sit. Sit. SIT. Sit down.\" That's four cues, and I've learned the first three are optional. Say it once, and make it worth answering.",
    parts: [
      { h: "Say it once", p: "Repeating a cue, louder each time, teaches your dog that the first one doesn't count. If they don't respond, wait a couple of seconds, then help: get their attention, use the hand signal, or make it easier. If it keeps failing, it's too hard for now." },
      { h: "Changing a cue", p: "Want a new word? Say the new cue, pause for a moment, then give the old cue your dog knows, and reward. After enough reps your dog starts to respond to the new word before the old one arrives. Then you can drop the old one." },
      { h: "Poisoned cues", p: "A cue gets \"poisoned\" when it sometimes leads to something your dog doesn't like: \"come\" and the fun ends, \"come\" and a telling-off, \"come\" and a bath. They start to hesitate, and who could blame them. Keep cues good news. Fetch your dog for the unpleasant things, and if a cue is already poisoned, teach a brand-new word and keep that one good." },
      { h: "Why \"no!\" isn't a cue", p: "\"No\" tells your dog what to stop, but not what to do instead, and shouting can frighten them. Ask for something they can do, like \"leave it\", \"sit\" or \"come\", and reward that. It gives them a way to get it right." },
    ],
    takeaway: "One cue, said once, that always means good things. Teach what to do, not just what to stop.",
    check: [
      { q: "You ask for a sit and your dog doesn't sit. What's best?", options: ["Repeat \"sit\" louder until they do", "Wait a moment, then help with the hand signal or make it easier", "Say \"no!\" and start again"], answer: 1, why: "Repeating the cue teaches that the first one doesn't count. Help them get it right, then reward." },
      { q: "You only ever call your dog in the park when it's time to go home. What can happen?", options: ["\"Come\" starts to mean the fun ends, so they hesitate", "Nothing: a good dog always comes", "Their recall gets faster"], answer: 0, why: "That's a poisoned cue. Call them often for good things, reward, and let them go back to playing." },
    ],
    sources: [AVSAB, DT_RECALL, PDSA_PUPPY],
  },
  {
    id: "proofing",
    species: ["dog"],
    title: "Proofing: from home to the park",
    emoji: "🎯",
    minutes: 2,
    intro: "I sit beautifully in the kitchen. In the park, next to a squirrel? Different question entirely. Dogs don't carry a skill to new places on their own: you teach it there too.",
    parts: [
      { h: "Dogs are specific", p: "To your dog, a sit in the kitchen with you standing in front of them can feel like a different skill from a sit on the pavement while you hold the shopping. So mix it up: different rooms, you sitting, standing or side-on, different times of day, and other people in the family giving the cue." },
      { h: "The three Ds", list: ["Distance: how far you are from your dog when you ask, or while they hold a stay", "Duration: how long they hold it before the reward or the release", "Distraction: what's going on around them, from a toy on the floor to other dogs in the park"] },
      { h: "Raise one, ease the others", p: "When you make one D harder, make the other two easier for a while. Taking a stay to the park for the first time? Stand close and keep it short. Adding distance? Practise it somewhere quiet first." },
      { h: "New place, new start", p: "The first time somewhere new, expect a wobble. That's normal, not your dog being stubborn. Drop back to an easy version, use your best rewards, and build up again from there." },
    ],
    takeaway: "Practise in lots of places, and make just one of distance, duration or distraction harder at a time.",
    check: [
      { q: "Your dog holds a 30-second stay at home. You try it in the park for the first time. Best plan?", options: ["30 seconds from across the field, same as at home", "A short stay with you close by, then build up", "Skip the park: they're just being stubborn"], answer: 1, why: "The park adds distraction, so ease distance and duration for now, then build them back one at a time." },
      { q: "Which one changes just one D?", options: ["Same quiet room, but you step two paces back", "A new park, further away, and a longer hold", "A busy street, a toy on the floor, and from across the road"], answer: 0, why: "Only distance changed. The others change two or three things at once, which makes success much harder." },
    ],
    sources: [DT_WALK, DT_RECALL, AVSAB],
  },
  {
    id: "professional",
    title: "When to call a professional",
    emoji: "📞",
    minutes: 2,
    intro: "Asking for help is a pro move, not a failure. I have my human for the hard stuff. You can have a professional.",
    parts: [
      { h: "See your vet first if", list: ["A behaviour starts suddenly or changes a lot", "Your pet seems in pain, or doesn't like being touched somewhere", "Toileting, sleep or appetite change"], p: "Pain and illness often show up as behaviour changes. Your vet can check, and refer you on." },
      { h: "Then a qualified behaviour professional if", list: ["There's growling, snapping or biting", "Fear or worry is stopping your pet enjoying life", "They struggle to be left alone", "Things aren't improving despite steady, kind practice"] },
      { h: "Choosing someone", p: "Pick a trainer or behaviourist who uses reward-based methods and can tell you about their qualifications and memberships. Avoid anyone who uses pain, fear or 'dominance'." },
    ],
    takeaway: "Sudden change: vet first. Aggression or big fear: a qualified, reward-based professional.",
    check: [
      { q: "Your usually calm pet suddenly growls or hisses when you touch their back. First step?", options: ["Book a vet check", "Correct them firmly", "Ignore it"], answer: 0, why: "Sudden changes can mean pain. A vet should rule that out first." },
      { q: "Which trainer is the better choice?", options: ["One who promises fast results with pain or fear-based tools", "One who uses rewards and explains their qualifications"], answer: 1, why: "Reward-based professionals who are open about their training are the safe choice." },
    ],
    sources: [AVSAB, { title: "Animal Behaviour and Training Council (ABTC)", url: "https://abtc.org.uk/" }, { title: "Association of Pet Behaviour Counsellors (APBC)", url: "https://www.apbc.org.uk/" }],
  },
  {
    id: "muzzle",
    species: ["dog"],
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
    title: "Why pets are good for us",
    emoji: "💛",
    minutes: 2,
    intro: "I'd say I'm good for my human. He'd probably agree, on most days. Here's what's known, kept honest: no miracle claims.",
    parts: [
      { h: "Getting moving", p: "A dog needs walking, and walking is good for people too. One UK study found dog owners were more likely than people without a dog to reach recommended activity levels. (Other animals bring their own jobs: a rabbit's run, a hen's coop, a cat's play.)" },
      { h: "Routine", p: "Meals, care and play give a day some shape. Small, regular routines are a kind way to build good days, for both of you." },
      { h: "Connection", p: "Pets are great conversation starters (dogs on walks especially), and many people say time with their pet helps them feel calmer and less alone. Researchers are still learning how much, and for whom." },
      { h: "Keep it kind", p: "A pet is not a fix for hard times, and it's fine if some days are hard. If things feel heavy, talking helps: see 'If things feel heavy' in More." },
    ],
    takeaway: "Moving, routine and company: small things that add up to good days.",
    check: [
      { q: "What did a UK study find about dog owners?", options: ["They were more likely to reach recommended activity levels", "They never get ill", "They don't need to see a doctor"], answer: 0, why: "Owners walked more on average. That's activity, not a cure for anything." },
      { q: "Which is the honest way to put it?", options: ["Owning a pet heals you", "Many people say time with their pet helps them feel calmer and build good days"], answer: 1, why: "We keep it honest: helpful for many people, not a medical treatment." },
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
