// ──────────────────────────────────────────────
// firebase-handler.js
// Firebase Realtime Database를 이용한 실시간 접속자 및 누적 방문자 관리
// ──────────────────────────────────────────────

// 1. Firebase SDK 모듈식 로드 (v9+)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, set, push, onDisconnect } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 2. Firebase 설정 (사용자가 제공한 값)
const firebaseConfig = {
    apiKey: "AIzaSyDFVrORrIptgvBF1fw5EvzLcm4KhLNW3FY",
    authDomain: "arcane-barrage.firebaseapp.com",
    databaseURL: "https://arcane-barrage-default-rtdb.firebaseio.com",
    projectId: "arcane-barrage",
    storageBucket: "arcane-barrage.firebasestorage.app",
    messagingSenderId: "541297460201",
    appId: "1:541297460201:web:d05569cd9811896d6e0178",
    measurementId: "G-W9PTPZM44L"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 경로 설정
const totalRef = ref(db, 'stats/total_visits');
const onlineRef = ref(db, 'status');

// --- A. 누적 방문자 처리 ---
// 세션당 한 번만 증가 (localStorage 활용)
const hasVisited = sessionStorage.getItem('arcane_visited');
if (!hasVisited) {
    // increment(1) 대신 원시적인 방식으로 처리 (트랜잭션 없이 간단하게)
    onValue(totalRef, (snapshot) => {
        if (!sessionStorage.getItem('arcane_visited')) {
            const currentTotal = snapshot.val() || 0;
            set(totalRef, currentTotal + 1);
            sessionStorage.setItem('arcane_visited', 'true');
        }
    }, { onlyOnce: true });
}

// --- B. 실시간 접속자 처리 ---
// 고유 연결 레퍼런스 생성
const myConnectionRef = push(onlineRef);

// 연결 시 데이터 쓰기
set(myConnectionRef, {
    last_changed: Date.now(),
    state: 'online'
});

// 연결 끊길 시 자동 제거
onDisconnect(myConnectionRef).remove();

// --- C. UI 업데이트 리스너 ---
// 누적 방문자 수 감시
onValue(totalRef, (snapshot) => {
    const count = snapshot.val() || 0;
    const elem = document.getElementById('totalVisits');
    if (elem) elem.textContent = count.toLocaleString();
});

// 실시간 접속자 수 감시
onValue(onlineRef, (snapshot) => {
    // onlineRef 하위 노드의 개수를 센다
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    const elem = document.getElementById('onlineCount');
    if (elem) elem.textContent = count.toLocaleString();
});
