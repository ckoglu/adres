let authInstance, sendPasswordResetEmailFn;

export async function initFirebasePasswordReset() {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getAuth, sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

  // Firebase konfigürasyonu
  const url = await getURL();
  const configModul = await import(`${url.modul}firebaseConfig.js`);
  const firebaseConfig = configModul.firebaseConfig;

  const app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  sendPasswordResetEmailFn = sendPasswordResetEmail;
}

export async function resetPassword(email) {
  if (!authInstance) await initFirebasePasswordReset();
  try {
    await sendPasswordResetEmailFn(authInstance, email);
    return "şifre sıfırlama bağlantısı e-posta adresinize gönderildi.";
  } catch (error) {
    console.error("şifre sıfırlama hatası:", error);
    throw new Error("şifre sıfırlama başarısız: " + (error.message || ""));
  }
}