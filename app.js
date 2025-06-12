// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// إعدادات Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCqOK8dAsYVd3G5kv6rFbrkDfLhmgFOXAU",
  authDomain: "flight-scheduler-3daea.firebaseapp.com",
  projectId: "flight-scheduler-3daea",
  storageBucket: "flight-scheduler-3daea.appspot.com",
  messagingSenderId: "1036581965112",
  appId: "1:1036581965112:web:0bd21e436764ea4294c5cd"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تسجيل الدخول
window.login = async function () {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "flights.html";
  } catch (err) {
    alert("فشل تسجيل الدخول:\n" + err.message);
  }
};

// تسجيل الخروج
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// البريد الخاص بالمشرف
const adminEmail = "ahmedaltalqani@gmail.com";

// التحقق من المستخدم الحالي
onAuthStateChanged(auth, (user) => {
  if (!user) {
    if (window.location.pathname.includes("index.html")) return;
    window.location.href = "index.html";
  } else {
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = user.email;

    if (
      user.email === adminEmail &&
      window.location.pathname.includes("flights.html")
    ) {
      window.location.href = "admin.html";
    }
  }
});

// حفظ الرحلات
window.saveFlights = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const cards = document.querySelectorAll(".card");
  let savedCount = 0;
  const allData = [];

  for (let card of cards) {
    const inputs = card.querySelectorAll("input, textarea");
    const data = {};
    let isFilled = false;

    inputs.forEach((input) => {
      const value = input.value.trim();
      data[input.name] = value;
      if (value !== "") isFilled = true;
    });

    if (!isFilled) continue;

    data.createdBy = user.email;
    data.createdAt = serverTimestamp();
    allData.push(data);

    try {
      await addDoc(collection(db, "flights"), data);
      savedCount++;
    } catch (err) {
      console.error("فشل في الحفظ:", err);
    }
  }

  if (savedCount > 0) {
    localStorage.removeItem("cachedFlights");
    alert(`✅ تم حفظ ${savedCount} رحلة`);
  } else {
    localStorage.setItem("cachedFlights", JSON.stringify(allData));
    alert("⚠️ تم حفظ الرحلات مؤقتًا لعدم توفر الاتصال بالإنترنت. سيتم حفظها عند توفر الإنترنت.");
  }
};

// استعادة الحقول المؤقتة عند التحميل
window.addEventListener("load", () => {
  const cachedData = localStorage.getItem("cachedFlights");
  if (cachedData) {
    const parsed = JSON.parse(cachedData);
    parsed.forEach((entry, index) => {
      for (const key in entry) {
        const input = document.querySelector(
          `.card:nth-child(${index + 1}) [name='${key}']`
        );
        if (input) input.value = entry[key];
      }
    });
  }
});

// تصدير PDF
window.exportToPDF = async function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 10;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("جدول الرحلات", 105, y, { align: "center" });
  y += 10;

  const cards = document.querySelectorAll(".card");

  cards.forEach((card, index) => {
    const inputs = card.querySelectorAll("input, textarea");
    let isFilled = false;
    const data = {};
    inputs.forEach((input) => {
      const value = input.value.trim();
      data[input.name] = value;
      if (value !== "") isFilled = true;
    });

    if (!isFilled) return;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`الرحلة ${index + 1}:`, 10, y);
    y += 6;

    for (let key in data) {
      doc.text(`${key}: ${data[key]}`, 12, y);
      y += 6;
    }

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save("flights.pdf");
};
