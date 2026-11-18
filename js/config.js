/*
 * Havya IFM site settings.
 *
 * formspreeEndpoint – your Formspree form URL, e.g. "https://formspree.io/f/abcdwxyz".
 *                     Leave empty to fall back to opening the visitor's email app.
 *
 * firebase          – Firebase web app config (Project settings → Your apps → Web app).
 *                     Set to null to turn mobile OTP verification off.
 */
window.HAVYA_CONFIG = {
  contactEmail: 'info@fnglobal.in',
  whatsappNumber: '917676276066',
  formspreeEndpoint: '',
  firebase: null
  // firebase: {
  //   apiKey: '...',
  //   authDomain: 'your-project.firebaseapp.com',
  //   projectId: 'your-project',
  //   appId: '...'
  // }
};
