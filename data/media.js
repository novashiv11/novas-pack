// Real photos, GIFs and clips (Nova's, and later Shiv's Learn with Nova content) for training steps and guides.
// A photo here replaces the drawn picture for that step. Keys: skill id → { step number (1-based): { src, alt } }.
// To add one: put the file in img/steps/ (JPG/WEBP/GIF under 300 KB, location data removed) and add a line below.
export const STEP_PHOTOS = {
  "talk-buttons": {
    2: { src: "img/steps/buttons-wait.jpg", alt: "Nova, a black and tan German Shepherd, lying next to a green talk button and looking up hopefully" },
    3: { src: "img/steps/buttons-press.jpg", alt: "Nova pressing the green talk button with her nose" },
  },
};
export const GUIDE_PHOTOS = {
  feeding: { src: "img/steps/food-bowl.jpg", alt: "Nova's dinner: soaked kibble with a spoon of wet food in a steel bowl" },
};
