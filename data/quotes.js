// Nova's Pack: "1% better every day" (spec v2, part D). One line a day, the same for everyone.
//
// NOVA_LINES   original lines in Nova's voice (warm, witty, adult; effort, not perfection; never shaming)
// FAMOUS       a few well-known quotes, ONLY with attribution we're sure of. If in doubt, it's not here.
//              (For example, "We are what we repeatedly do" is Will Durant summarising Aristotle, not Aristotle.)
// YOU_ACTIONS  tiny daily actions for the human (no therapy language, no health claims)
// REPLIES      what Nova says when both of today's 1% actions are ticked
// lineOfDay()  picks today's line from the mixed pool, by the local date

export const NOVA_LINES = [
  "1% better today is still better. I checked.",
  "Progress is a walk, not a sprint. Mostly a sniff.",
  "You showed up. That's the hardest trick.",
  "Small steps. Big sniffs. Good days.",
  "Nobody learns recall in a day. Not even me. Especially not me.",
  "A five-minute session beats a perfect plan you never start.",
  "Missed a few days? Welcome back. Today counts.",
  "End on a win. Then have a biscuit. Both of you.",
  "Good habits are just good days, repeated.",
  "Your dog doesn't need perfect. Your dog needs you, a bit more often.",
  "Patience is a treat you give yourself.",
  "Every 'nearly' is practice for 'nailed it'.",
  "Slow is smooth. Smooth is fewer zoomies. Usually.",
  "Today's goal: one good moment. Notice it.",
  "Calm is a skill. You're allowed to practise it too.",
  "Rewards work on humans as well. Go on, praise yourself.",
  "A bad session is just information with a tail.",
  "Consistency beats any trick. I've seen a lot of tricks.",
  "Sniff more, rush less. Professional advice.",
  "Your walk counts even if it rained. Especially if it rained.",
  "Training is a conversation where one side has snacks.",
  "Progress hides in small things. Look closer. Lower. Nose height.",
  "Look after yourself today. Good handlers need water and snacks too.",
  "Five calm minutes beat an hour of frustration.",
  "If it's not fun, make it shorter, not stricter.",
  "You don't need more time. You need the next five minutes.",
  "Little wins stack up. Like treats in a pocket.",
  "Every expert was once a beginner holding the lead the wrong way round.",
  "One good walk can reset a whole day. Try me.",
  "Your effort matters more than any streak.",
  "Learning together is the point. The tricks are a bonus.",
  "Notice what went right. It's a longer list than you think.",
  "Fresh air, fresh start. That's the deal.",
  "A dog's day is made of small moments. So is yours.",
  "Kindness is the method. Treats are the delivery.",
  "Hard day? Do the smallest thing. Then call it a win.",
  "The best time to train was yesterday. The second best is after my nap.",
  "Today, listen with your eyes. I talk with my whole body.",
  "Reward what you like. Skip the drama. Works on teenagers too.",
  "Practice doesn't make perfect. It makes progress. Perfect is boring.",
  "Your dog learns from you all day. Mostly good news, I promise.",
  "Go at your dog's pace today. We know where the good sniffs are.",
  "Rest days are part of training. I take several a day.",
  "Small and kind beats big and loud. Every time.",
  "You're doing better than you think. I'd know. I watch you a lot.",
  "Every walk is a chance to notice something new together.",
  "Breathe first. Then cue. We can tell when a human is rushing.",
  "A little better every day is a lot better by spring.",
  "Celebrate the try, not just the result.",
  "Habits are built on ordinary days. Ordinary days are underrated.",
  "Today counts, even if it's a small one.",
  "Leave the phone. Bring the treats. Look up.",
  "Got it wrong? Make it easier. That's not cheating, that's teaching.",
  "A calm human is a dog's favourite place.",
  "Growth looks slow up close. Look back a month instead.",
  "Teams have off days. Teams come back. We're a team.",
  "Short sessions, long friendship.",
  "Make it easy to get right, then a little harder. Repeat for life.",
  "Today: one walk, one cuddle, one proud moment. Done.",
  "Better together. Slightly muddier, but better.",
  "Nobody's grading this. Except me, and I'm generous with biscuits.",
];

export const FAMOUS = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", by: "Will Durant", source: "The Story of Philosophy (1926), summarising Aristotle" },
  { text: "A journey of a thousand miles begins with a single step.", by: "Laozi", source: "Tao Te Ching, chapter 64 (a common translation)" },
  { text: "Not all those who wander are lost.", by: "J.R.R. Tolkien", source: "The Fellowship of the Ring (1954)" },
  { text: "Happiness is a warm puppy.", by: "Charles M. Schulz", source: "Peanuts" },
  { text: "Little by little, one goes far.", by: "Spanish proverb", source: "\"Poco a poco se va lejos\"" },
];

export const YOU_ACTIONS = [
  "Walk without your phone for 5 minutes.",
  "Notice 3 things your dog did well today.",
  "Take 5 slow breaths before training.",
  "Drink a glass of water before the walk.",
  "Thank yourself for showing up.",
  "Step outside for 2 minutes of fresh air.",
  "Drop your shoulders. Unclench your jaw.",
  "Send a kind message to someone.",
  "Stretch for one slow minute.",
  "Look up at the sky on your walk.",
  "Write one line in your Growth Journal tonight.",
  "Say one kind thing to yourself. Quietly is fine.",
  "Tidy one small thing. Just one.",
  "Go to bed 10 minutes earlier tonight.",
  "Listen to one song you love, all the way through.",
  "Notice one thing you're grateful for.",
  "Leave your phone in another room for 15 minutes.",
  "Sit with your dog for 2 minutes, doing nothing.",
  "Take the long way round, once.",
  "Pause for one breath before you react today.",
  "Wear comfy shoes. Your feet are on the team.",
  "Learn one new thing in the Academy.",
];

export const REPLIES = [
  "Both done. That's 1% each. I'm proud. Don't let it go to your head.",
  "Look at the two of you. Better than yesterday.",
  "Done and done. Today counts.",
  "One for the dog, one for the human. Balanced, like a good biscuit ratio.",
  "That's the whole trick: small things, done kindly.",
  "Proper teamwork. Treat yourself. Treat me too.",
];

/** Days since 1 Jan 2000 for a local date, so everyone sees the same line on the same date. */
export function dayNumber(d = new Date()) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000) - 10957;
}

/** The pool: Nova's lines with a famous quote after every 12th. Each item: { text, by?, source? }. */
export const LINES = (() => {
  const out = [];
  NOVA_LINES.forEach((text, i) => {
    out.push({ text });
    const f = FAMOUS[Math.floor(i / 12)];
    if (i % 12 === 11 && f) out.push(f);
  });
  return out;
})();

export function lineOfDay(d = new Date()) {
  const n = dayNumber(d);
  return LINES[((n * 7) % LINES.length + LINES.length) % LINES.length];
}
export function youActionOfDay(d = new Date()) {
  const n = dayNumber(d);
  return YOU_ACTIONS[((n * 5) % YOU_ACTIONS.length + YOU_ACTIONS.length) % YOU_ACTIONS.length];
}
export function replyOfDay(d = new Date()) {
  return REPLIES[((dayNumber(d) % REPLIES.length) + REPLIES.length) % REPLIES.length];
}
