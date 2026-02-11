"use strict";

// ----- গ্লোবাল স্টেট -----
let players = [];
let totalScores = [];
let currentRound = 1;
let gameActive = false;

// ----- ডোম এলিমেন্ট রেফারেন্স -----
const setupPanel = document.getElementById('setupPanel');
const gamePanel = document.getElementById('gamePanel');
const bonusArea = document.getElementById('bonusRoundArea');
const callArea = document.getElementById('callRoundArea');
const roundTypeTitle = document.getElementById('roundTypeTitle');
const scoreTableBody = document.getElementById('scoreTable');
const nameFieldsContainer = document.getElementById('nameFieldsContainer');

// ----- ইউটিলিটি -----
function createNameFields() {
  const count = parseInt(document.getElementById('playerCountInput').value, 10);
  if (isNaN(count) || count < 2 || count > 6) {
    alert('২ থেকে ৬ জন খেলোয়াড় দিন');
    return;
  }
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `<input type="text" id="playerName${i}" placeholder="খেলোয়াড় ${i+1} এর নাম" value="P${i+1}" style="margin-bottom: 8px;">`;
  }
  nameFieldsContainer.innerHTML = html;
}

// ----- বোনাস রাউন্ড শুরু -----
function startBonusRound() {
  const count = parseInt(document.getElementById('playerCountInput').value, 10);
  if (isNaN(count) || count < 2 || count > 6) {
    alert('প্রথমে বৈধ প্লেয়ার সংখ্যা দিন ও নাম ফিল্ড তৈরি করুন');
    return;
  }
  
  players = [];
  for (let i = 0; i < count; i++) {
    let nameField = document.getElementById(`playerName${i}`);
    let name = nameField ? nameField.value.trim() : '';
    if (name === '') name = `P${i+1}`;
    players.push(name);
  }
  
  totalScores = new Array(players.length).fill(0);
  currentRound = 1;
  
  setupPanel.style.display = 'none';
  gamePanel.style.display = 'block';
  
  showBonusRoundUI();
  updateScoreTable();
}

// ----- বোনাস রাউন্ড UI লোড -----
function showBonusRoundUI() {
  bonusArea.style.display = 'block';
  callArea.style.display = 'none';
  roundTypeTitle.innerText = '🎁 বোনাস রাউন্ড (কল নাই, শুধু উঠানো)';
  
  const bonusGrid = document.getElementById('bonusInputsGrid');
  bonusGrid.innerHTML = '';
  
  players.forEach((player, idx) => {
    const card = document.createElement('div');
    card.className = 'bonus-player-card';
    card.innerHTML = `
      <h4>${player}</h4>
      <div style="display: flex; justify-content: center; gap: 10px;">
        <label style="font-weight:700;">উঠেছে</label>
        <input type="number" id="bonusGot${idx}" min="0" value="0" style="width: 90px; text-align: center; padding: 12px; border-radius: 60px;">
      </div>
    `;
    bonusGrid.appendChild(card);
  });
}

// ----- বোনাস রাউন্ড জমা -----
function submitBonusRound() {
  if (currentRound !== 1) return;
  
  players.forEach((_, i) => {
    const gotInput = document.getElementById(`bonusGot${i}`);
    let got = parseInt(gotInput?.value, 10) || 0;
    totalScores[i] += got;
  });
  
  currentRound = 2;
  roundTypeTitle.innerText = `📢 কল রাউন্ড ${currentRound}`;
  
  bonusArea.style.display = 'none';
  callArea.style.display = 'block';
  loadCallRoundInputs();
  updateScoreTable();
  saveGameToLocal();
}

// ----- কল রাউন্ড ইনপুট লোড -----
function loadCallRoundInputs() {
  const callGrid = document.getElementById('callInputsGrid');
  callGrid.innerHTML = '';
  
  players.forEach((player, idx) => {
    const card = document.createElement('div');
    card.className = 'call-card';
    card.innerHTML = `
      <h4>🌪️ ${player}</h4>
      <div class="input-pair">
        <label>📞 কল</label>
        <input type="number" id="call${idx}" min="0" value="0" step="1">
      </div>
      <div class="input-pair">
        <label>🎯 উঠেছে</label>
        <input type="number" id="got${idx}" min="0" value="0" step="1">
      </div>
      <small style="color: #145c66;">৪→৫ = ৪.১ // ৫→৪ = -৫</small>
    `;
    callGrid.appendChild(card);
  });
}

// ----- ফ্রাকশনাল স্কোর ক্যালকুলেশন -----
function computeCallScore(call, got) {
  call = parseInt(call, 10) || 0;
  got = parseInt(got, 10) || 0;
  
  if (got > call) {
    let extra = got - call;
    return call + (extra * 0.1);
  } else if (call === got) {
    return call;
  } else {
    return -call;
  }
}

// ----- কল রাউন্ড জমা -----
function submitCallRound() {
  if (!players.length) return;
  
  players.forEach((_, i) => {
    const callInput = document.getElementById(`call${i}`);
    const gotInput = document.getElementById(`got${i}`);
    let callVal = callInput ? callInput.value : 0;
    let gotVal = gotInput ? gotInput.value : 0;
    let roundScore = computeCallScore(callVal, gotVal);
    totalScores[i] += roundScore;
  });
  
  currentRound++;
  roundTypeTitle.innerText = `📢 কল রাউন্ড ${currentRound}`;
  
  loadCallRoundInputs();
  updateScoreTable();
  saveGameToLocal();
}

// ----- স্কোর টেবিল আপডেট -----
function updateScoreTable() {
  let html = `<tr><th>খেলোয়াড়</th><th>মোট পয়েন্ট</th></tr>`;
  
  players.forEach((p, i) => {
    let scoreFixed = totalScores[i].toFixed(1);
    html += `<tr id="scoreRow${i}"><td>${p}</td><td>${scoreFixed}</td></tr>`;
  });
  
  scoreTableBody.innerHTML = html;
}

// ----- গেম শেষ -----
function endGame() {
  if (!players.length) return;
  
  let maxScore = Math.max(...totalScores);
  
  players.forEach((_, i) => {
    const row = document.getElementById(`scoreRow${i}`);
    if (row) {
      if (totalScores[i] === maxScore) {
        row.classList.add('winner-row');
      } else {
        row.classList.remove('winner-row');
      }
    }
  });
  
  alert(`🏆 খেলা শেষ! সর্বোচ্চ স্কোর: ${maxScore.toFixed(1)} 🏆`);
  localStorage.removeItem('breezeStormState');
}

// ----- লোকাল স্টোরেজ সেভ -----
function saveGameToLocal() {
  const state = {
    players,
    totalScores,
    currentRound
  };
  localStorage.setItem('breezeStormState', JSON.stringify(state));
}

// ----- উইন্ডো লোড -----
window.onload = function() {
  document.getElementById('playerCountInput').value = 4;
  createNameFields();
  
  let nameFields = ['জাহিন', 'রাইসা', 'তানভীর', 'নুশরাত'];
  for (let i = 0; i < nameFields.length; i++) {
    let fld = document.getElementById(`playerName${i}`);
    if (fld) fld.value = nameFields[i];
  }
  
  const saved = localStorage.getItem('breezeStormState');
  if (saved) {
    try {
      const state = JSON.parse(saved);
      players = state.players || [];
      totalScores = state.totalScores || [];
      currentRound = state.currentRound || 2;
      
      if (players.length > 0) {
        setupPanel.style.display = 'none';
        gamePanel.style.display = 'block';
        
        if (currentRound === 1) {
          showBonusRoundUI();
        } else {
          bonusArea.style.display = 'none';
          callArea.style.display = 'block';
          roundTypeTitle.innerText = `📢 কল রাউন্ড ${currentRound}`;
          loadCallRoundInputs();
        }
        updateScoreTable();
      }
    } catch (e) {}
  }
};

// ----- ফাংশন এক্সপোর্ট (গ্লোবাল) -----
window.createNameFields = createNameFields;
window.startBonusRound = startBonusRound;
window.submitBonusRound = submitBonusRound;
window.submitCallRound = submitCallRound;
window.endGame = endGame;
window.saveGameToLocal = saveGameToLocal;
window.computeCallScore = computeCallScore;
