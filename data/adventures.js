// Nova's Pack: the Adventure Book (spec v2, part C.3). Real-life firsts, as stamps.
//
// Shape: { id, set, emoji, title, tip, auto? }
//   tip   one kind, safe "how to" line, shown when you open the stamp
//   auto  { walks: N } for milestone stamps earned by logging walks (up to 2 a day count); everything else
//         is earned by tapping the stamp and adding the date (and an optional photo that stays on the device).
//   any   true when the stamp suits every pet; the rest are dog adventures (walks, cafés, meeting dogs)
// Each stamp is earned once per partner, for +20 XP once. No locations are ever stored.

export const SETS = [
  { id: "places", title: "Places", emoji: "📍" },
  { id: "friends", title: "Friends", emoji: "🤝" },
  { id: "milestones", title: "Milestones", emoji: "🏁" },
  { id: "seasons", title: "Seasons", emoji: "🍂" },
  { id: "brave", title: "Brave", emoji: "🦁" },
];

export const STAMPS = [
  // Places
  { id: "beach", set: "places", emoji: "🏖️", title: "First beach", tip: "Check the local rules for dogs first. Bring fresh drinking water, and rinse salt and sand off paws afterwards." },
  { id: "cafe", set: "places", emoji: "☕", title: "Café or pub garden", tip: "Bring their mat and a long chew. Pick a quiet corner and keep the first visit short and sweet." },
  { id: "forest", set: "places", emoji: "🌲", title: "Forest walk", tip: "Sniffing is brain work, so let them take their time. Check for ticks when you get home." },
  { id: "city", set: "places", emoji: "🏙️", title: "City street", tip: "Start somewhere quieter, at a calm time of day. Watch their body language and leave before it's too much." },
  { id: "vet-calm", set: "places", emoji: "🩺", title: "Calm vet visit", any: true, tip: "A happy 'just visiting' trip counts: hello, a weigh-in, treats, home. Ask your practice when it's quiet." },
  { id: "car", set: "places", emoji: "🚗", title: "Car trip", any: true, tip: "Secured in a carrier or crate, behind a dog guard or in a crash-tested harness. Start with short, calm trips." },
  { id: "friend-house", set: "places", emoji: "🏡", title: "A friend's home", tip: "Ask first, bring their mat, and keep it short and calm. Leave before anyone gets tired." },
  { id: "transport", set: "places", emoji: "🚆", title: "Bus or train ride", tip: "Check the operator's rules for dogs first. Go off-peak, with treats and a mat to settle on." },

  // Friends
  { id: "calm-dog", set: "friends", emoji: "🐕", title: "Met a calm dog", tip: "Optional: skip this one if your dog is worried or reactive around dogs; calmly watching from a distance is a win too. Otherwise ask the other owner first, keep leads loose, a short sniff, then walk on." },
  { id: "child", set: "friends", emoji: "🧒", title: "Calm hello with a child", any: true, tip: "Optional: skip it if your pet is unsure around children. Only with a parent's OK and an adult right there. Let your pet choose to say hello, and keep it short." },
  { id: "cat", set: "friends", emoji: "🐈", title: "Polite with a cat", tip: "From a distance, on lead. Reward your dog for looking away from the cat. No chasing, ever." },
  { id: "hat-hivis", set: "friends", emoji: "🦺", title: "Someone in a hat or hi-vis", tip: "Hats, hoods, beards and hi-vis can look odd to a dog. Treats for calmly noticing, from a comfy distance." },
  { id: "doorbell", set: "friends", emoji: "📦", title: "Calm at the doorbell", any: true, tip: "Mat or baby gate first, then treats for staying calm while a parcel arrives." },
  { id: "farm", set: "friends", emoji: "🐄", title: "Farm animals from afar", tip: "Always on lead near livestock, and keep your distance. Reward calm watching, then move on." },

  // Milestones
  { id: "walks-10", set: "milestones", emoji: "👟", title: "10 walks", auto: { walks: 10 }, tip: "Log your walks with one tap. Up to 2 a day count." },
  { id: "walks-50", set: "milestones", emoji: "🥾", title: "50 walks", auto: { walks: 50 }, tip: "Log your walks with one tap. Up to 2 a day count." },
  { id: "walks-100", set: "milestones", emoji: "💯", title: "100 walks", auto: { walks: 100 }, tip: "Log your walks with one tap. Up to 2 a day count." },
  { id: "muzzle-walk", set: "milestones", emoji: "🛡️", title: "First muzzle walk", tip: "Only after muzzle training at home has gone well. A basket muzzle they can pant and drink in, and treats through it." },
  { id: "night-walk", set: "milestones", emoji: "🌙", title: "First night walk", tip: "Wear something reflective, and give your dog a light-up or reflective collar. Stick to routes you know." },
  { id: "class", set: "milestones", emoji: "🎓", title: "A reward-based class", tip: "Look for a trainer who uses rewards, not punishment, and is open about their qualifications." },

  // Seasons
  { id: "rain", set: "seasons", emoji: "🌧️", title: "Rain walk", tip: "Towel at the door. A short walk in the rain still counts." },
  { id: "snow", set: "seasons", emoji: "❄️", title: "Snow or frost", tip: "Wipe paws afterwards: grit and salt can sting, and they're not for licking." },
  { id: "leaves", set: "seasons", emoji: "🍁", title: "Autumn leaves", tip: "Big sniffs, slow pace. Keep them away from conkers, acorns and mushrooms." },
  { id: "spring", set: "seasons", emoji: "🌸", title: "Spring walk", tip: "Lambing season: keep your dog on a lead anywhere near sheep." },
  { id: "summer", set: "seasons", emoji: "🌅", title: "Cool summer morning", tip: "In hot weather, walk early or late when it's cool. Test the pavement with your hand, and bring water." },

  // Brave
  { id: "surface", set: "brave", emoji: "🪵", title: "New surface", tip: "Grates, gravel, wobbly boards. Let them sniff and choose, and treat every brave paw. Never pull them across." },
  { id: "stairs", set: "brave", emoji: "🪜", title: "Stairs", tip: "Open-backed or steep stairs take confidence. Go slowly, on lead, with treats. Puppies: ask your vet about stairs." },
  { id: "lift", set: "brave", emoji: "🛗", title: "Lift", tip: "Try an empty lift first. Treats while the doors open and close, then a short ride." },
  { id: "bridge", set: "brave", emoji: "🌉", title: "Bridge", tip: "Choose a quiet footbridge. Go at their pace and reward calm steps." },
  { id: "hoover", set: "brave", emoji: "🧹", title: "Calm with the hoover", any: true, tip: "Start with it switched off, far away. Treats when it appears, then when it hums from another room." },
  { id: "groom", set: "brave", emoji: "✂️", title: "Calm groom or nail trim", any: true, tip: "One nail at a time is a win. Stop before they've had enough." },
];

/** The stamps for this pet: dogs get the whole book, everyone else the ones marked `any`. */
export const stampsFor = (stamps, species) => (species === "dog" ? stamps : stamps.filter((s) => s.any));
