// Firebase bağlantı değişkenleri
let url;
async function getURL() {
  if (url) return url;
  const pathname = location.pathname.split('/').filter(Boolean);
  const repo = pathname.length > 0 ? `/${pathname[0]}/` : '/';
  const { siteURL } = await import(`${location.origin}${repo}js/siteurl.js`);
  url = siteURL();
  return url;
}

let auth, db;
let createUserWithEmailAndPasswordFn, signInWithEmailAndPasswordFn, signOutFn, onAuthStateChangedFn, sendEmailVerificationFn, applyActionCodeFn;
let docFn, setDocFn, getDocFn, serverTimestampFn;

// Firebase başlatıcı
export async function initFirebase() {
  try {
    // Firebase modüllerini dinamik olarak yükle
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification, applyActionCode} = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    // Firebase konfigürasyonu
    const url = await getURL();
    const configModul = await import(`${url.modul}firebaseConfig.js`);
    const firebaseConfig = configModul.firebaseConfig;
    // Firebase uygulamasını başlat
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    // Global fonksiyon atamaları
    createUserWithEmailAndPasswordFn = createUserWithEmailAndPassword;
    signInWithEmailAndPasswordFn = signInWithEmailAndPassword;
    signOutFn = signOut;
    onAuthStateChangedFn = onAuthStateChanged;
    sendEmailVerificationFn = sendEmailVerification;
    applyActionCodeFn = applyActionCode;
    docFn = doc;
    setDocFn = setDoc;
    getDocFn = getDoc;
    serverTimestampFn = serverTimestamp;
    // E-posta doğrulama kontrolü
    await checkEmailVerification();
    // Auth state listener'ı başlat
    initAuthStateListener();
    return { auth, db };
  } catch (error) {
    console.error("Firebase başlatma hatası:", error);
    throw error;
  }
}

// E-posta doğrulama kontrolü
export async function checkEmailVerification() {
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');
  if (mode === 'verifyEmail' && oobCode) {
    try {
      await applyActionCodeFn(auth, oobCode);
      if (auth.currentUser) {await auth.currentUser.reload();}
      window.showAlert?.("E-posta doğrulama başarılı!", "success");
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error("Doğrulama hatası:", error);
      window.showAlert?.(`Doğrulama başarısız: ${error.message}`, "error");
    }
  }
}

// Geliştirilmiş hata yönetimi
function handleAuthError(error) {
  console.error("Auth hatası detay:", {code: error.code, message: error.message, stack: error.stack});
  const errorMap = {
    'auth/invalid-credential': "eposta veya şifre hatalı!",
    'auth/user-disabled': "hesabınız devre dışı bırakıldı!",
    'auth/permission-denied': "işlem yetkiniz yok, lütfen oturum açın!",
    'auth/network-request-failed': "ağ hatası oluştu, bağlantınızı kontrol edin!",
    'auth/too-many-requests': "çok fazla deneme yaptınız, daha sonra tekrar deneyin!",
    'auth/email-already-in-use': "e-posta adresi zaten kullanımda!",
    'auth/user-not-found': "kullanıcı bulunamadı!",
    'auth/wrong-password': "geçersiz şifre!",
    'auth/invalid-email': "geçersiz e-posta formatı!",
    'auth/weak-password': "şifre en az 6 karakter olmalı!"
  };
  return new Error(errorMap[error.code] || `${error.message || "Bilinmeyen hata"}`);
}

// Kullanıcı durum dinleyici
function initAuthStateListener() {
  if (!auth) return;
  onAuthStateChangedFn(auth, async (user) => {
    if (user) {
      try {
        await user.reload();
        localStorage.setItem("user-" + user.uid, JSON.stringify({userUID: user.uid, userEmail: user.email, emailVerify: user.emailVerified}));
      } catch (error) {
        console.error("Kullanıcı durumu güncelleme hatası:", error);
      }
    } else {
      const keys = Object.keys(localStorage).filter(k => k.startsWith("user-"));
      keys.forEach(k => localStorage.removeItem(k));
    }
  });
}

// KAYIT OL
export async function register(email, password) {
  try {
    if (!auth) await initFirebase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {throw new Error("Geçersiz e-posta formatı");}
    if (password.length < 6) {throw new Error("Şifre en az 6 karakter olmalı");}
    const userCredential = await createUserWithEmailAndPasswordFn(auth, email, password);
    const user = userCredential.user;
    await setDocFn(docFn(db, "users", user.uid), {email, createdAt: serverTimestampFn(), lastLogin: serverTimestampFn()});
    const url = await getURL();
    await sendEmailVerificationFn(user, {url: `${url.site}${url.repository}`, handleCodeInApp: true});
    console.log("Kayıt başarılı. E-posta onayı gönderildi.");
    return user.uid;
  } catch (error) {
    throw handleAuthError(error);
  }
}

// GİRİŞ YAP
export async function login(email, password) {
  try {
    if (!auth) await initFirebase();
    // Önceki oturumu temizle
    await signOutFn(auth);
    const keys = Object.keys(localStorage).filter(k => k.startsWith("user-"));
    keys.forEach(k => localStorage.removeItem(k));
    const userCredential = await signInWithEmailAndPasswordFn(auth, email, password);
    const user = userCredential.user;
    // Kullanıcı durumunu güncelle
    await user.reload();
    await user.getIdToken(true);
    // Firestore'a son giriş zamanını kaydet
    try {
      await setDocFn(docFn(db, "users", user.uid), { lastLogin: serverTimestampFn()}, { merge: true });
    } catch (dbError) {
      console.error("Firestore kayıt hatası:", dbError);
    }
    localStorage.setItem("user-" + user.uid, JSON.stringify({userUID: user.uid, userEmail: user.email, emailVerify: user.emailVerified}));
    return user.uid;
  } catch (error) {
    throw handleAuthError(error);
  }
}

// ÇIKIŞ YAP
export async function logout() {
  try {
    if (!auth) await initFirebase();
    // Firestore'a çıkış zamanını kaydet (isteğe bağlı)
    const user = auth.currentUser;
    if (user) {
      try {
        await setDocFn(docFn(db, "users", user.uid), { lastLogout: serverTimestampFn() }, { merge: true });
      } catch (dbError) {
        console.error("Firestore çıkış kaydı hatası:", dbError);
      }
    }
    await signOutFn(auth);
    const keys = Object.keys(localStorage).filter(k => k.startsWith("user-"));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (error) {
    console.error("Çıkış hatası:", error);
    throw new Error("Çıkış işlemi başarısız");
  }
}

// KULLANICI BİLGİLERİ
export async function getCurrentUser() {
  if (!auth) await initFirebase();
  // Kullanıcı hazırsa direkt döndür
  if (auth.currentUser) {
    await auth.currentUser.reload();
    return {uid: auth.currentUser.uid, email: auth.currentUser.email, emailVerified: auth.currentUser.emailVerified};
  }
  // Aksi halde onAuthStateChanged ile bekle
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChangedFn(auth, async (user) => {
      unsubscribe(); // dinleyiciyi kaldır
      if (user) {
        await user.reload();
        resolve({uid: user.uid, email: user.email, emailVerified: user.emailVerified});
      } else {
        resolve(null);
      }
    });
  });
}

export async function isLoggedIn() {
  try {
    if (!auth) await initFirebase();
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChangedFn(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
    if (!user) return false;
    const stored = localStorage.getItem("user-" + user.uid);
    if (!stored) return false;
    return true; 
  } catch (error) {
    console.error("Giriş kontrol hatası:", error);
    return false;
  }
}

export async function isVerified() {
  try {
    if (!auth) await initFirebase();
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChangedFn(auth, async (user) => {
        unsubscribe();
        if (user && !user.emailVerified) {
          await user.reload();
          resolve(auth.currentUser);
        } else {
          resolve(user);
        }
      });
    });
    return user?.emailVerified || false;
  } catch (error) {
    console.error("Doğrulama kontrol hatası:", error);
    return false;
  }
}

// TEKRAR EPOSTA ONAYI
export async function resendVerificationEmail() {
  if (!auth) await initFirebase();
  const user = auth.currentUser;
  if (user && !user.emailVerified) {
    try {
      await user.reload();
      const url = await getURL();
      await sendEmailVerificationFn(user, {url: `${url.site}${url.repository}`, handleCodeInApp: true});
      return "Doğrulama e-postası gönderildi.";
    } catch (error) {
      console.error("E-posta gönderme hatası:", error);
      throw new Error("E-posta gönderilemedi: " + error.message);
    }
  } else {
    throw new Error("Kullanıcı oturumu açık değil veya zaten doğrulanmış.");
  }
}

// SIFRE SIFIRLAMA
export async function resetPassword(email) {
  try {
    if (!auth) await initFirebase();
    const url = await getURL();
    const { sendPasswordResetEmail } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    await sendPasswordResetEmail(auth, email, {url: `${url.site}${url.repository}login.html`, handleCodeInApp: true});
    return "e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.";
  } catch (error) {
    throw handleAuthError(error);
  }
}

// HESAP SIL
export async function reauthAndDelete(password) {
  if (!auth) await initFirebase();
  const { EmailAuthProvider, reauthenticateWithCredential, deleteUser } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");

  // Mevcut kullanıcıyı yeniden yükle
  await auth.currentUser?.reload();
  const user = auth.currentUser;
  
  if (!user) {
    // Eğer kullanıcı yoksa localStorage'ı temizle
    const keys = Object.keys(localStorage).filter(k => k.startsWith("user-"));
    keys.forEach(k => localStorage.removeItem(k));
    throw new Error("Oturum açmış kullanıcı bulunamadı. Lütfen tekrar giriş yapın.");
  }

  try {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    await deleteUser(user);
    
    // Kullanıcı silindikten sonra localStorage'ı temizle
    localStorage.removeItem("user-" + user.uid);
    localStorage.removeItem("set-" + user.uid);
    localStorage.removeItem("history-" + user.uid);
    return "Hesabınız başarıyla silindi. yönlendiriliyorsunuz...";
  } catch (error) {
    console.error("Hesap silme hatası:", error);
    if (error.code === "auth/wrong-password") {
      throw new Error("Şifre yanlış. Lütfen tekrar deneyin.");
    } else if (error.code === "auth/requires-recent-login") {
      throw new Error("Lütfen çıkış yapıp tekrar giriş yapın.");
    }
    throw new Error("Hesap silme başarısız: " + error.message);
  }
}

// Giriş yapan kullanıcının tüm bilgilerini döndür
export async function getFullUserInfo() {
  if (!auth) await initFirebase();
  const user = auth.currentUser;
  if (!user) return null;
  await user.reload();
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    creationTime: user.metadata.creationTime,
    lastSignInTime: user.metadata.lastSignInTime,
    providerData: user.providerData
  };
}