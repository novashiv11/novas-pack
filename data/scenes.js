// A picture for every simple step (see js/scenes.js for the part vocabulary). One spec per step, in the same order
// as EASY[skillId].steps in data/easysteps.js. Canvas 160 x 100: floor at y 78, feet at y 90. The person stands
// left, the dog (flip: true) faces them from the right, so hands and treats meet at the dog's nose.
// Steps with a real photo in data/media.js keep the photo; these are the fallback.

const SHOW = (x = 96, o = {}) => ({ t: "dog", v: "sit", x, s: 1.3, flip: true, ...o }); // sitting dog facing the person on the left

export const SCENES = {
  recall: [
    { bg: "grass", parts: [{ t: "person", x: 38, arm: "out", hair: 1 }, { t: "dog", v: "stand", x: 124, s: 1.2, flip: true, mouth: "open" }, { t: "bubble", text: "come!", x: 64, y: 16, c: "gold", to: [42, 30] }] },
    { bg: "grass", parts: [SHOW(96, { mouth: "open" }), { t: "person", x: 32, arm: "out", hold: "treat", hair: 1 }, { t: "tally", x: 118, y: 16, n: 3, s: 1.3 }] },
    { bg: "grass", parts: [{ t: "dog", v: "run", x: 62, s: 1.1 }, { t: "motion", x: 22, y: 66, len: 12 }, { t: "person", v: "walk", x: 124, arm: "out", hair: 1 }, { t: "arrow", from: [42, 22], to: [96, 22], c: "gold", bend: -6, dash: true }] },
    { bg: "grass", parts: [SHOW(96, { mouth: "open" }), { t: "person", x: 32, arm: "out", hold: "treat", hair: 1 }, { t: "tally", x: 104, y: 15, n: 5, s: 1.3 }, { t: "spark", pts: [[138, 36, 1.6], [24, 24, 1.2]] }] },
  ],
  "loose-lead": [
    { bg: "grass", parts: [{ t: "person", v: "walk", x: 30, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 110, s: 1.2 }, { t: "lead" }, { t: "label", text: "like a smile", x: 80, y: 16 }] },
    { bg: "grass", parts: [{ t: "dog", v: "walk", x: 112, s: 1.2, flip: true, mouth: "open" }, { t: "person", v: "walk", x: 36, arm: "lead", arm2: "low", hold2: "treat", hair: 1 }, { t: "lead" }, { t: "spark", x: 84, y: 32 }] },
    { bg: "grass", parts: [{ t: "person", x: 30, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 114, s: 1.2 }, { t: "lead", v: "tight" }, { t: "stop", x: 34, y: 18, s: 1.2 }] },
    { bg: "grass", parts: [{ t: "person", v: "walk", x: 40, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 108, s: 1.2, mouth: "open" }, { t: "lead" }, { t: "bubble", text: "yes!", x: 46, y: 16, c: "gold", to: [46, 30] }, { t: "spark", x: 130, y: 30 }] },
    { bg: "hall", parts: [{ t: "person", v: "walk", x: 62, s: .85, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 108, s: 1 }, { t: "lead" }, { t: "icon", v: "garden", x: 138, y: 18, s: 1.3 }] },
  ],
  settle: [
    { bg: "room", parts: [{ t: "mat", x: 100, y: 91, s: 1.4 }, { t: "person", x: 34, arm: "point", hair: 1 }, { t: "spark", pts: [[100, 56, 1.6], [128, 66, 1.2]] }] },
    { bg: "room", parts: [{ t: "mat", x: 92, y: 92, s: 1.5 }, { t: "dog", v: "stand", x: 92, y: 88, s: 1.2, flip: true, mouth: "open" }, { t: "treat", x: 108, y: 90 }, { t: "person", x: 32, arm: "low", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 38, y: 16, c: "gold", to: [36, 30] }] },
    { bg: "room", parts: [{ t: "mat", x: 96, y: 92, s: 1.5 }, SHOW(96, { y: 88 }), { t: "person", x: 32, arm: "out", hold: "treat", hair: 1 }] },
    { bg: "room", parts: [{ t: "mat", x: 96, y: 92, s: 1.5 }, { t: "dog", v: "down", x: 98, y: 88, s: 1.3, flip: true, calm: true }, { t: "person", x: 32, arm: "low", hold: "treat", hair: 1 }, { t: "label", text: "1 2 3", x: 80, y: 16 }] },
    { bg: "room", parts: [{ t: "mat", x: 70, y: 92, s: 1.4 }, { t: "person", x: 24, arm: "out", hair: 1 }, { t: "dog", v: "walk", x: 116, s: 1.2, mouth: "open" }, { t: "motion", x: 90, y: 66, len: 11 }, { t: "bubble", text: "free!", x: 44, y: 16, c: "gold", to: [28, 30] }] },
  ],
  greetings: [
    { bg: "room", parts: [SHOW(96, { calm: true }), { t: "person", x: 32, arm: "out", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 38, y: 16, c: "gold", to: [36, 30] }] },
    { bg: "room", parts: [{ t: "door", v: "open", x: 138, s: .95 }, { t: "dog", v: "sit", x: 40, s: 1.3, calm: true }, { t: "person", v: "walk", x: 106, flip: true, shirt: "pink", hair: 1, skin: 2 }, { t: "label", text: "slowly", x: 70, y: 16 }] },
    { bg: "room", parts: [{ t: "dog", v: "jump", x: 50, s: 1.2, mouth: "open" }, { t: "person", x: 112, arm: "back", shirt: "pink", hair: 1, skin: 2 }, { t: "pause", x: 112, y: 16 }] },
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 114, s: 1.3, flip: true, mouth: "open" }, { t: "person", x: 40, arm: "out", shirt: "pink", hair: 1, skin: 2 }, { t: "bubble", text: "hello", x: 52, y: 16, c: "gold", to: [44, 30] }, { t: "check", x: 138, y: 34, s: 1.2 }] },
    { bg: "room", parts: [{ t: "dog", v: "sit", x: 42, s: 1.3, worried: true }, { t: "person", x: 126, s: .9, shirt: "pink", hair: 1, skin: 2, flip: true }, { t: "arrow", from: [70, 62], to: [100, 62], c: "gold", both: true, dash: true }, { t: "label", text: "give space", x: 80, y: 16 }] },
  ],
  "leave-it": [
    { bg: "room", parts: [SHOW(128, { s: 1.35 }), { t: "hand", v: "fist", treat: true, x: 82, y: 50, s: 1.4 }, { t: "label", text: "plain treat", x: 56, y: 16 }] },
    { bg: "room", parts: [SHOW(128, { s: 1.35, mouth: "open" }), { t: "hand", v: "fist", x: 82, y: 50, s: 1.4 }, { t: "pause", x: 70, y: 20 }] },
    { bg: "room", parts: [SHOW(108, { look: "up" }), { t: "person", x: 44, arm: "low", hold: "fist", arm2: [30, -12, 3], hold2: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 36, y: 16, c: "gold", to: [47, 30] }] },
    { bg: "room", parts: [SHOW(100), { t: "person", x: 34, arm: "low", hold: "fist", hair: 1 }, { t: "bubble", text: "leave it", x: 62, y: 16, c: "gold", to: [38, 30] }, { t: "tally", x: 124, y: 16, n: 5, s: 1.3 }] },
    { bg: "room", parts: [SHOW(128, { s: 1.35, mouth: "open" }), { t: "hand", v: "fist", treat: true, x: 82, y: 52, s: 1.4 }, { t: "stop", x: 60, y: 20, s: 1.2 }] },
  ],
  "wait-doors": [
    { bg: "room", parts: [{ t: "door", x: 128, s: 1.05 }, { t: "dog", v: "sit", x: 80, s: 1.25 }, { t: "person", x: 34, arm: "lead", hair: 1 }, { t: "lead" }] },
    { bg: "room", parts: [{ t: "door", x: 132, s: 1.05 }, { t: "dog", v: "sit", x: 38, s: 1.25 }, { t: "treat", x: 62, y: 89 }, { t: "person", x: 94, arm: "reach", hair: 1 }, { t: "bubble", text: "yes!", x: 56, y: 16, c: "gold", to: [58, 34] }] },
    { bg: "room", parts: [{ t: "door", v: "ajar", x: 128, s: 1.05 }, { t: "dog", v: "walk", x: 40, s: 1.25 }, { t: "motion", x: 14, y: 68, len: 11 }, { t: "person", x: 104, arm: "reach", hair: 1 }, { t: "label", text: "close gently", x: 66, y: 16 }] },
    { bg: "room", parts: [{ t: "door", v: "open", x: 134, s: 1.05 }, { t: "person", v: "walk", x: 56, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 94, s: 1.1, mouth: "open" }, { t: "lead" }, { t: "bubble", text: "OK!", x: 60, y: 16, c: "gold", to: [60, 34] }] },
  ],
  handling: [
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 78, y: 88, s: 1.75, calm: true }, { t: "hand", v: "open", x: 96, y: 47, s: 1.1 }, { t: "clock", x: 28, y: 22, text: "1 sec" }] },
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 72, s: 1.7 }, { t: "ring", x: 87, y: 53, r: 10, text: "1" }, { t: "ring", x: 84, y: 85, r: 8, ry: 5, text: "2" }, { t: "ring", x: 106, y: 20, r: 9, text: "3" }, { t: "treat", x: 138, y: 88, n: 2 }] },
    { bg: "room", parts: [{ t: "hand", v: "open", x: 62, y: 56, s: 1.1 }, { t: "dog", v: "walk", x: 112, s: 1.3 }, { t: "motion", x: 78, y: 62, len: 10 }, { t: "label", text: "back a step", x: 70, y: 16 }] },
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 80, s: 1.5, worried: true, mouth: "yawn" }, { t: "stop", x: 134, y: 24, s: 1.2 }, { t: "label", text: "too much", x: 40, y: 16 }] },
  ],
  "trick-spin": [
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 96, s: 1.3, flip: true }, { t: "person", v: "kneel", x: 32, arm: "out", hold: "treat", hair: 1 }] },
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 100, s: 1.1, flip: true }, { t: "spin", x: 100, y: 58, rx: 44, ry: 24, c: "gold" }, { t: "hand", v: "pinch", x: 62, y: 56, s: .8 }] },
    { bg: "room", parts: [{ t: "spin", x: 80, y: 58, rx: 46, ry: 22, c: "gold" }, { t: "dog", v: "spin", x: 80, s: 1.35, mouth: "open" }, { t: "bubble", text: "yes!", x: 80, y: 16, c: "gold", to: [80, 40] }, { t: "spark", pts: [[26, 40, 1.5], [136, 36, 1.3]] }] },
    { bg: "room", parts: [{ t: "person", x: 26, arm: "out", hair: 1 }, { t: "bubble", text: "spin", x: 54, y: 16, to: [28, 30] }, { t: "dog", v: "spin", x: 100, s: 1.3 }, { t: "spin", x: 100, y: 60, rx: 32, ry: 16, c: "gold" }, { t: "tally", x: 126, y: 16, n: 5, s: 1.3 }] },
  ],
  muzzle: [
    { bg: "room", parts: [SHOW(132, { s: 1.25 }), { t: "hand", v: "open", hold: "muzzle", treat: true, x: 70, y: 50, s: 1.1 }, { t: "spark", x: 36, y: 22 }] },
    { bg: "room", parts: [SHOW(128, { s: 1.25 }), { t: "hand", v: "open", hold: "muzzle", treat: true, x: 74, y: 48, s: 1.1 }] },
    { bg: "room", parts: [{ t: "dog", v: "nose-in", x: 78, s: 1.4 }, { t: "clock", x: 28, y: 22, text: "1 sec" }, { t: "arrow", from: [46, 22], to: [112, 22], c: "gold" }, { t: "clock", x: 130, y: 22, text: "2 sec" }] },
    { bg: "room", parts: [{ t: "dog", v: "nose-in", x: 78, s: 1.4, strap: true, calm: true }, { t: "check", x: 134, y: 26 }, { t: "label", text: "only if happy", x: 56, y: 16 }] },
    { bg: "room", parts: [SHOW(126, { s: 1.25, worried: true }), { t: "hand", v: "open", hold: "muzzle", x: 76, y: 50, s: 1.1 }, { t: "no", x: 94, y: 52, r: 24 }, { t: "clock", x: 28, y: 22, text: "short" }] },
  ],
  "toilet-training": [
    { bg: "grass", parts: [{ t: "person", v: "walk", x: 40, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 100, s: .8 }, { t: "lead" }, { t: "icon", v: "sleep", x: 36, y: 16, s: 1.2 }, { t: "icon", v: "eat", x: 80, y: 16, s: 1.2 }, { t: "icon", v: "play", x: 124, y: 16, s: 1.2 }] },
    { bg: "grass", parts: [{ t: "ring", x: 112, y: 89, r: 22, ry: 5 }, { t: "dog", v: "sniff", x: 100, s: .85 }, { t: "person", x: 34, arm: "down", hair: 1 }, { t: "pause", x: 134, y: 24 }] },
    { bg: "grass", parts: [{ t: "puddle", x: 106, y: 91 }, { t: "dog", v: "stand", x: 104, s: .85, flip: true }, { t: "person", x: 46, arm: "low", hold: "treat", hair: 1 }, { t: "bubble", text: "good!", x: 50, y: 16, c: "gold", to: [49, 32] }] },
    { bg: "room", parts: [{ t: "puddle", x: 94, y: 91 }, { t: "dog", v: "sit", x: 140, s: .85, flip: true, calm: true }, { t: "person", v: "kneel", x: 62, arm: [28, 32, 3], hold: "cloth", hair: 1 }, { t: "bubble", text: "it's ok", x: 56, y: 16, c: "gold", to: [66, 34] }] },
    { bg: "grass", parts: [{ t: "clock", x: 38, y: 42, s: 2, text: "1-2 h" }, { t: "arrow", from: [66, 46], to: [96, 56], c: "gold", bend: -6 }, { t: "dog", v: "walk", x: 124, s: .9, mouth: "open" }, { t: "icon", v: "garden", x: 138, y: 18, s: 1.2 }] },
  ],
  "alone-time": [
    { bg: "room", parts: [{ t: "door", v: "open", x: 140, s: .95 }, { t: "dog", v: "down", x: 46, s: 1.25 }, { t: "toy", x: 92, y: 89, s: .9 }, { t: "person", v: "walk", x: 108, hair: 1 }, { t: "clock", x: 80, y: 20, text: "5 sec" }] },
    { bg: "room", parts: [{ t: "door", v: "open", x: 140, s: .95 }, { t: "dog", v: "down", x: 40, s: 1.25, calm: true }, { t: "toy", x: 86, y: 89, s: .9 }, { t: "person", v: "walk", x: 108, flip: true, hair: 1 }, { t: "label", text: "no fuss", x: 80, y: 16 }] },
    { bg: "room", parts: [{ t: "dog", v: "down", x: 70, s: 1.3, calm: true }, { t: "toy", x: 120, y: 89 }, { t: "clock", x: 32, y: 22, text: "5 s" }, { t: "arrow", from: [48, 22], to: [62, 22], c: "gold" }, { t: "clock", x: 80, y: 22, text: "10 s" }, { t: "arrow", from: [96, 22], to: [110, 22], c: "gold" }, { t: "clock", x: 128, y: 22, text: "30 s" }] },
    { bg: "room", parts: [{ t: "door", v: "open", x: 142, s: .95 }, { t: "dog", v: "down", x: 40, s: 1.25, calm: true }, { t: "toy", x: 86, y: 89, s: .9 }, { t: "person", v: "walk", x: 108, hair: 1 }, { t: "bubble", text: "bye!", x: 84, y: 16, to: [104, 34] }, { t: "no", x: 84, y: 16, r: 15 }] },
    { bg: "room", parts: [{ t: "dog", v: "sit", x: 50, s: 1.35, worried: true, mouth: "open" }, { t: "clock", x: 96, y: 24, text: "5 s" }, { t: "arrow", from: [112, 24], to: [124, 24], c: "gold" }, { t: "icon", v: "vet", x: 140, y: 24, s: 1.3 }] },
  ],
  "cat-carrier": [
    { bg: "room", parts: [{ t: "carrier", x: 66, s: 1.7, door: "open" }, { t: "cat", v: "sit", x: 140, s: 1.1 }] },
    { bg: "room", parts: [{ t: "carrier", x: 104, s: 1.5, door: "open" }, { t: "treat", x: 96, y: 74, n: 2, gap: 10 }, { t: "treat", x: 62, y: 89, n: 3, gap: 10 }, { t: "cat", v: "stand", x: 30, s: 1.15 }] },
    { bg: "room", parts: [{ t: "carrier", x: 76, s: 1.7, door: "open", cat: true, mood: "happy" }, { t: "bubble", text: "good", x: 130, y: 30, c: "gold", to: [96, 62] }, { t: "spark", pts: [[140, 56, 1.5], [24, 34, 1.3]] }] },
    { bg: "room", parts: [{ t: "carrier", x: 70, s: 1.7, door: "closed", cat: true }, { t: "clock", x: 130, y: 26, text: "3 sec" }, { t: "treat", x: 130, y: 88, n: 2 }] },
  ],
  "cat-handling": [
    { bg: "room", parts: [{ t: "cat", v: "sit", x: 102, s: 1.5, mood: "happy" }, { t: "person", v: "kneel", x: 62, arm: [28, -6, 3], hair: 2, skin: 1 }, { t: "treat", x: 142, y: 88 }, { t: "spark", x: 130, y: 26 }] },
    { bg: "plain", parts: [{ t: "paw", x: 84, y: 60, s: 1.15, claw: false }, { t: "clock", x: 138, y: 24, text: "1 sec" }] },
    { bg: "plain", parts: [{ t: "paw", x: 84, y: 62, s: 1.4 }, { t: "spark", pts: [[130, 30, 1.6], [136, 70, 1.2]] }] },
    { bg: "room", parts: [{ t: "cat", v: "sit", x: 82, s: 1.5, mood: "upset", swish: true }, { t: "stop", x: 134, y: 24, s: 1.2 }] },
    { bg: "room", parts: [{ t: "cat", v: "sit", x: 108, s: 1.3, mood: "calm" }, { t: "person", x: 46, arm: "reach", shirt: "green", badge: "cross", hair: 3 }, { t: "icon", v: "vet", x: 134, y: 20, s: 1.4 }] },
  ],
  sit: [
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 100, s: 1.3, flip: true }, { t: "person", x: 34, arm: "out", hold: "treat", hair: 1 }] },
    { bg: "room", parts: [{ t: "dog", v: "sit", x: 100, s: 1.3, flip: true, look: "up" }, { t: "hand", v: "pinch", treat: true, x: 84, y: 34, s: .9 }, { t: "arrow", from: [70, 52], to: [84, 30], c: "gold", bend: -4 }] },
    { bg: "room", parts: [SHOW(100, { mouth: "open" }), { t: "person", x: 34, arm: "out", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 42, y: 16, c: "gold", to: [40, 30] }] },
    { bg: "room", parts: [SHOW(100), { t: "person", x: 34, arm: "up", hair: 1 }, { t: "tally", x: 120, y: 16, n: 5, s: 1.3 }] },
  ],
  down: [
    { bg: "room", parts: [{ t: "mat", x: 100, y: 92, s: 1.5 }, SHOW(100, { y: 88 }), { t: "person", x: 34, arm: "out", hair: 1 }] },
    { bg: "room", parts: [{ t: "mat", x: 100, y: 92, s: 1.5 }, SHOW(100, { y: 88, look: "down" }), { t: "hand", v: "pinch", treat: true, x: 78, y: 82, s: .9 }, { t: "arrow", from: [74, 46], to: [76, 74], c: "gold" }] },
    { bg: "room", parts: [{ t: "mat", x: 100, y: 92, s: 1.5 }, { t: "dog", v: "down", x: 102, y: 88, s: 1.3, flip: true }, { t: "treat", x: 80, y: 90 }, { t: "person", x: 32, arm: "low", hair: 1 }, { t: "bubble", text: "yes!", x: 40, y: 16, c: "gold", to: [36, 30] }] },
    { bg: "room", parts: [{ t: "mat", x: 100, y: 92, s: 1.5 }, { t: "dog", v: "down", x: 102, y: 88, s: 1.3, flip: true, calm: true }, { t: "person", x: 32, arm: "low", hold: "treat", hair: 1 }, { t: "check", x: 132, y: 20 }] },
  ],
  "check-in": [
    { bg: "room", parts: [{ t: "dog", v: "sit", x: 104, s: 1.3 }, { t: "person", x: 34, hair: 1 }, { t: "bubble", text: "Nova!", x: 46, y: 16, c: "gold", to: [38, 30] }] },
    { bg: "room", parts: [SHOW(104, { look: "up", mouth: "open" }), { t: "person", x: 34, arm: "out", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 42, y: 16, c: "gold", to: [40, 30] }] },
    { bg: "room", parts: [SHOW(70, { s: 1.1 }), { t: "person", x: 130, hair: 1, flip: true }, { t: "arrow", from: [40, 30], to: [116, 30], c: "gold", bend: -8, dash: true }] },
    { bg: "grass", parts: [{ t: "person", v: "walk", x: 34, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 108, s: 1.2, flip: true, look: "up" }, { t: "lead" }, { t: "spark", x: 84, y: 30 }] },
  ],
  "drop-it": [
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 104, s: 1.3, flip: true }, { t: "toy", x: 82, y: 66 }, { t: "hand", v: "pinch", treat: true, x: 66, y: 58, s: .9 }] },
    { bg: "room", parts: [{ t: "toy", x: 96, y: 90 }, SHOW(108, { mouth: "open" }), { t: "person", x: 34, arm: "out", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 42, y: 16, c: "gold", to: [40, 30] }] },
    { bg: "grass", parts: [{ t: "person", x: 30, arm: "up", hair: 1 }, { t: "ball", x: 72, y: 30 }, { t: "dog", v: "run", x: 112, s: 1.1, mouth: "open" }, { t: "arrow", from: [44, 24], to: [66, 26], c: "gold", bend: -4 }] },
    { bg: "room", parts: [{ t: "dog", v: "stand", x: 104, s: 1.3, flip: true }, { t: "person", v: "walk", x: 40, hair: 1 }, { t: "no", x: 140, y: 30 }, { t: "label", text: "swap, don't chase", x: 80, y: 12 }] },
  ],
  stay: [
    { bg: "room", parts: [SHOW(100), { t: "person", x: 34, arm: "out", hold: "treat", hair: 1 }, { t: "clock", x: 128, y: 22, text: "1 sec" }] },
    { bg: "room", parts: [{ t: "dog", v: "walk", x: 108, s: 1.2, mouth: "open" }, { t: "motion", x: 84, y: 62, len: 10 }, { t: "person", x: 34, arm: "out", hair: 1 }, { t: "bubble", text: "free!", x: 44, y: 16, c: "gold", to: [38, 30] }] },
    { bg: "room", parts: [SHOW(108), { t: "person", x: 34, arm: "out", hair: 1 }, { t: "label", text: "2… 3… 5", x: 80, y: 16 }] },
    { bg: "room", parts: [SHOW(116), { t: "person", v: "walk", x: 54, hair: 1 }, { t: "arrow", from: [56, 34], to: [36, 34], c: "gold", both: true, dash: true }, { t: "check", x: 132, y: 20 }] },
  ],
  "look-at-that": [
    { bg: "grass", parts: [{ t: "person", x: 26, s: .9, arm: "lead", hair: 1 }, { t: "dog", v: "sit", x: 58, s: 1.05, calm: true }, { t: "lead" }, { t: "dog", v: "walk", x: 140, s: .6, coat: "cream" }, { t: "arrow", from: [84, 50], to: [128, 50], c: "gold", both: true, dash: true }] },
    { bg: "grass", parts: [{ t: "person", x: 26, s: .9, arm: "out", hold: "treat", hair: 1 }, { t: "dog", v: "sit", x: 60, s: 1.05, look: "up", mouth: "open" }, { t: "dog", v: "walk", x: 140, s: .6, coat: "cream" }, { t: "bubble", text: "yes!", x: 36, y: 14, c: "gold", to: [30, 26] }] },
    { bg: "grass", parts: [{ t: "person", v: "walk", x: 22, s: .9, arm: "lead", hair: 1 }, { t: "dog", v: "walk", x: 56, s: 1, worried: true, flip: true }, { t: "lead" }, { t: "dog", v: "walk", x: 120, s: .7, coat: "cream" }, { t: "arrow", from: [80, 30], to: [40, 30], c: "gold", dash: true }] },
    { bg: "grass", parts: [{ t: "dog", v: "sniff", x: 90, s: 1.2, calm: true }, { t: "person", x: 30, hair: 1 }, { t: "spark", pts: [[130, 40, 1.4], [60, 30, 1.1]] }] },
  ],
  "talk-buttons": [
    { bg: "room", parts: [{ t: "button", x: 88, y: 90, s: 1.5, on: true }, { t: "bowl", x: 130, y: 90, s: 1.3 }, { t: "person", v: "kneel", x: 36, arm: "reach", hair: 1 }, { t: "bubble", text: "snack please", x: 82, y: 16, to: [88, 70] }] },
    { bg: "room", parts: [{ t: "button", x: 88, y: 90, s: 1.3, on: true }, SHOW(136, { s: 1.2, mouth: "open" }), { t: "person", v: "kneel", x: 58, arm: "reach", arm2: "out", hold2: "treat", hair: 1 }, { t: "bubble", text: "snack please", x: 82, y: 16, c: "gold", to: [88, 72] }] },
    { bg: "room", parts: [{ t: "dog", v: "sniff", x: 44, s: 1.3 }, { t: "button", x: 100, y: 90, s: 1.2, on: true }, { t: "bubble", text: "snack please", x: 64, y: 16, c: "gold", to: [100, 72] }, { t: "person", v: "kneel", x: 142, flip: true, arm: "low", hold: "treat", hair: 1 }, { t: "bubble", text: "yes!", x: 136, y: 36, to: [138, 44] }] },
    { bg: "room", parts: [{ t: "label", text: "snack times only", x: 80, y: 16 }, { t: "button", x: 50, y: 90, s: 1.4 }, { t: "icon", v: "sleep", x: 50, y: 50 }, { t: "bowl", x: 116, y: 90, s: 1.3 }] },
  ],
};
