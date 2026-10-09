// Nova's Pack site settings. The only thing to edit here is the invite link.
//
// To show the "No Instagram? Join on WhatsApp" buttons, paste your WhatsApp
// Community invite link between the quotes, e.g.
//   const WHATSAPP_INVITE = "https://chat.whatsapp.com/AbC123...";
// Keep "Approve new members" switched on in WhatsApp. Leave it empty to hide the buttons.
const WHATSAPP_INVITE = "";

if (/^https:\/\/chat\.whatsapp\.com\/\S+$/.test(WHATSAPP_INVITE)) {
  document.querySelectorAll("[data-wa]").forEach((a) => {
    a.href = WHATSAPP_INVITE;
    a.hidden = false;
  });
}
