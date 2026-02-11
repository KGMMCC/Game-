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
const scoreTableBody = document.getElementById('scoreTableBody');
const nameFieldsContainer = document.getElementById('nameFieldsContainer');
const leaderboardModal = document.getElementById('leaderboardModal');

// ----- ইউটিলিটি ফাংশন -----
function createNameFields() {
  const count = parseInt(document.getElementById('playerCountInput').value, 10);
  if (isNaN(count) || count < 2 || count > 6) {
    showNotification('২ থেকে ৬ জন খেলোয়াড় দিন', 'error');
    return;
  }
  
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `<input type="text" id="playerName${i}" placeholder="খেলোয়াড় ${i+1} এর নাম" value="" style="margin-bottom: 8px;">`;
  }
  nameFieldsContainer.innerHTML = html;
}

// ----- নোটিফিকেশন -----
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 15px 25px;
    border-radius: 50px;
    box-shadow: 0 8px 0 ${type === 'error' ? '#962d2d' : '#2d6e2d'};
    z-index: 2000;
    animation: slideIn 0.3s ease;
    font-weight: 600;
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ----- বোনাস রাউন্ড শুরু -----
function startBonusRound() {
  const count = parseInt(document.getElementById('playerCountInput').value, 10);
  if (isNaN(count) || count < 2 || count > 6) {
    showNotification('প্রথমে বৈধ প্লেয়ার সংখ্যা দিন', 'error');
    return;
  }
  
  // প্লেয়ার নাম সংগ্রহ
  players = [];
  let hasEmptyName = false;
  
  for (let i = 0; i < count; i++) {
    let nameField = document.getElementById(`playerName${i}`);
    let name = nameField ? nameField.value.trim() : '';
    
    if (name === '') {
      hasEmptyName = true;
      name = `প্লেয়ার ${i+1}`;
    }
    players.push(name);
  }
  
  if (hasEmptyName) {
    showNotification('কিছু নাম ফাঁকা ছিল, অটো নাম দেওয়া হয়েছে', 'info');
  }
  
  totalScores = new Array(players.length).fill(0);
  currentRound = 1;
  
  setupPanel.style.display = 'none';
  gamePanel.style.display = 'block';
  
  showBonusRoundUI();
  updateScoreTable();
  showNotification('বোনাস রাউন্ড শুরু!', 'success');
}

// ----- বোনাস রাউন্ড UI -----
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
      <div class="input-pair">
        <label>🎯 উঠেছে</label>
        <input type="number" id="bonusGot${idx}" min="0" value="0" step="1" placeholder="০">
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
  showNotification('বোনাস রাউন্ড জমা হয়েছে!', 'success');
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
        <input type="number" id="call${idx}" min="0" value="" step="1" placeholder="০">
      </div>
      <div class="input-pair">
        <label>🎯 উঠেছে</label>
        <input type="number" id="got${idx}" min="0" value="" step="1" placeholder="০">
      </div>
      <small style="color: #145c66;">৪→৫ = ৪.১ // ৫→৪ = -৫</small>
    `;
    callGrid.appendChild(card);
    
    // ফোকাস এনিমেশন
    const inputs = card.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
      });
      input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
      });
    });
  });
}

// ----- স্কোর ক্যালকুলেশন -----
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
  
  // সব ফিল্ড চেক করা
  let allFilled = true;
  players.forEach((_, i) => {
    const callInput = document.getElementById(`call${i}`);
    const gotInput = document.getElementById(`got${i}`);
    if (!callInput?.value && !gotInput?.value) {
      allFilled = false;
    }
  });
  
  if (!allFilled) {
    showNotification('ফাঁকা ফিল্ড ০ ধরে নেওয়া হয়েছে', 'info');
  }
  
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
  showNotification(`রাউন্ড ${currentRound-1} জমা হয়েছে!`, 'success');
}

// ----- স্কোর টেবিল আপডেট -----
function updateScoreTable() {
  let html = '';
  
  // সাজানো অ্যারে
  const sortedPlayers = players.map((player, index) => ({
    name: player,
    score: totalScores[index],
    index
  })).sort((a, b) => b.score - a.score);
  
  sortedPlayers.forEach((player, pos) => {
    let scoreFixed = player.score.toFixed(1);
    let medal = '';
    if (pos === 0) medal = '🥇 ';
    else if (pos === 1) medal = '🥈 ';
    else if (pos === 2) medal = '🥉 ';
    
    html += `<tr id="scoreRow${player.index}" class="${pos === 0 ? 'leader-row' : ''}">
              <td>${medal} ${player.name}</td>
              <td>${scoreFixed}</td>
            </tr>`;
  });
  
  if (scoreTableBody) {
    scoreTableBody.innerHTML = html;
  }
}

// ----- গেম শেষ ও লিডারবোর্ড -----
function endGame() {
  if (!players.length) return;
  
  showLeaderboard();
  saveGameToLocal();
}

// ----- লিডারবোর্ড দেখান -----
function showLeaderboard() {
  if (!players.length) return;
  
  // স্কোর অনুযায়ী সাজানো
  const sortedPlayers = players.map((player, index) => ({
    name: player,
    score: totalScores[index],
    index
  })).sort((a, b) => b.score - a.score);
  
  const podiumContainer = document.getElementById('leaderboardPodium');
  const leaderboardList = document.getElementById('leaderboardList');
  
  // পোডিয়াম তৈরি
  podiumContainer.innerHTML = '';
  for (let i = 0; i < Math.min(3, sortedPlayers.length); i++) {
    const player = sortedPlayers[i];
    const podiumItem = document.createElement('div');
    podiumItem.className = 'podium-item';
    
    let medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    let colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
    
    podiumItem.innerHTML = `
      <div class="podium-rank" style="background: ${colors[i]};">${medal}</div>
      <div class="podium-name">${player.name}</div>
      <div class="podium-score">${player.score.toFixed(1)} পয়েন্ট</div>
    `;
    podiumContainer.appendChild(podiumItem);
  }
  
  // সম্পূর্ণ লিডারবোর্ড
  leaderboardList.innerHTML = '<h3 style="margin-bottom: 20px;">📋 সম্পূর্ণ স্কোরবোর্ড</h3>';
  
  sortedPlayers.forEach((player, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.style.animationDelay = `${index * 0.1}s`;
    
    let medal = '';
    if (index === 0) medal = '🏆';
    else if (index === 1) medal = '🥈';
    else if (index === 2) medal = '🥉';
    else medal = `${index + 1}`;
    
    item.innerHTML = `
      <div class="leaderboard-rank" style="background: ${index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#0e6b7a'}">
        ${medal}
      </div>
      <div class="leaderboard-info">
        <span class="leaderboard-name">${player.name}</span>
        <span class="leaderboard-score">${player.score.toFixed(1)}</span>
      </div>
    `;
    leaderboardList.appendChild(item);
  });
  
  // মডাল দেখান
  leaderboardModal.style.display = 'flex';
}

// ----- লিডারবোর্ড বন্ধ -----
function closeLeaderboard() {
  leaderboardModal.style.display = 'none';
}

// ----- নতুন গেম শুরু -----
function newGame() {
  // স্টেট রিসেট
  players = [];
  totalScores = [];
  currentRound = 1;
  gameActive = false;
  
  // লোকাল স্টোরেজ ক্লিয়ার
  localStorage.removeItem('breezeStormState');
  
  // UI রিসেট
  leaderboardModal.style.display = 'none';
  gamePanel.style.display = 'none';
  setupPanel.style.display = 'block';
  
  // প্লেয়ার কাউন্ট রিসেট
  document.getElementById('playerCountInput').value = 4;
  createNameFields();
  
  showNotification('নতুন গেম শুরু! খেলোয়াড় সেটআপ করুন', 'success');
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

// ----- গেম রিজিউম -----
function resumeGame() {
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
        showNotification('গেম রিজিউম করা হয়েছে!', 'success');
      }
    } catch (e) {
      console.error('রিজিউম করতে সমস্যা:', e);
    }
  }
}

// ----- উইন্ডো লোড -----
window.onload = function() {
  // ডিফল্ট সেটআপ
  document.getElementById('playerCountInput').value = 4;
  createNameFields();
  
  // লোকাল স্টোরেজ চেক
  resumeGame();
  
  // কীবোর্ড শর্টকাট
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && leaderboardModal.style.display === 'flex') {
      closeLeaderboard();
    }
  });
};

// ----- গ্লোবাল ফাংশন -----
window.createNameFields = createNameFields;
window.startBonusRound = startBonusRound;
window.submitBonusRound = submitBonusRound;
window.submitCallRound = submitCallRound;
window.endGame = endGame;
window.showLeaderboard = showLeaderboard;
window.closeLeaderboard = closeLeaderboard;
window.newGame = newGame;
window.resumeGame = resumeGame;
