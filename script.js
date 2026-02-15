"use strict";

// ========== গ্লোবাল স্টেট ==========
let players = [];
let totalScores = [];
let playerStats = [];
let roundHistory = [];
let currentRound = 1;
let currentCallValues = [];
let currentTrickValues = [];
let gameCode = '';

let predictors = [];
let currentPredictor = null;
let connectedGame = null;
let activeBets = [];
let bettingFeed = [];
let currentCigaretteAmount = 10;
let totalPool = 0;

// ========== DOM এলিমেন্ট ==========
const setupPanel = document.getElementById('setupPanel');
const gamePanel = document.getElementById('gamePanel');
const bonusArea = document.getElementById('bonusArea');
const callArea = document.getElementById('callArea');
const callPhase = document.getElementById('callPhase');
const trickPhase = document.getElementById('trickPhase');
const scoreTableBody = document.getElementById('scoreTableBody');
const nameFields = document.getElementById('nameFields');
const mainGameStatus = document.getElementById('mainGameStatus');
const mainRoundInfo = document.getElementById('mainRoundInfo');
const mainGameCode = document.getElementById('mainGameCode');

const predictorCigarettes = document.getElementById('predictorCigarettes');
const connectedGameInfo = document.getElementById('connectedGameInfo');
const connectedGameCode = document.getElementById('connectedGameCode');
const connectedPlayers = document.getElementById('connectedPlayers');
const connectedRound = document.getElementById('connectedRound');
const liveGamePlayers = document.getElementById('liveGamePlayers');
const roundMarket = document.getElementById('roundMarket');
const exactCallMarket = document.getElementById('exactCallMarket');
const overUnderMarket = document.getElementById('overUnderMarket');
const matchWinnerMarket = document.getElementById('matchWinnerMarket');
const bettingFeedContainer = document.getElementById('bettingFeed');
const totalBetsCount = document.getElementById('totalBetsCount');
const predictorsList = document.getElementById('predictorsList');
const betSlipItems = document.getElementById('betSlipItems');
const totalBetAmount = document.getElementById('totalBetAmount');
const predictorHistoryList = document.getElementById('predictorHistoryList');
const predictorCigaretteInput = document.getElementById('predictorCigaretteInput');

const gameEndModal = document.getElementById('gameEndModal');
const podiumContainer = document.getElementById('podiumContainer');
const finalScoresList = document.getElementById('finalScoresList');
const betModal = document.getElementById('betModal');
const predictorSetupModal = document.getElementById('predictorSetupModal');
const modalBetDetails = document.getElementById('modalBetDetails');
const modalPotentialWin = document.getElementById('modalPotentialWin');

const toastContainer = document.getElementById('toastContainer');

// ========== থিম ফাংশন ==========
function setTheme(theme) {
  document.body.className = `theme-${theme}`;
  localStorage.setItem('breezeTheme', theme);
  showToast(`${theme === 'neon' ? 'নিয়ন' : theme === 'day' ? 'ডে' : 'নাইট'} মোড অ্যাক্টিভেটেড`, 'success');
}

// ========== ট্যাব সুইচিং ==========
function switchMainTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  if (tab === 'game') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('gameTab').classList.add('active');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('predictionTab').classList.add('active');
    updatePredictionUI();
  }
}

// ========== গেম ফাংশন ==========

function adjustPlayerCount(delta) {
  const input = document.getElementById('playerCount');
  let value = parseInt(input.value) + delta;
  if (value < 2) value = 2;
  if (value > 6) value = 6;
  input.value = value;
}

function generateNameFields() {
  const count = parseInt(document.getElementById('playerCount').value);
  const avatars = ['👑', '⚡', '🌟', '🔥', '💎', '🎯'];
  let html = '';
  
  for (let i = 0; i < count; i++) {
    html += `
      <div class="name-input">
        <span>${avatars[i]}</span>
        <input type="text" id="playerName${i}" value="প্লেয়ার ${i+1}" placeholder="নাম দিন">
      </div>
    `;
  }
  
  nameFields.innerHTML = html;
}

function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function startBonusRound() {
  const count = parseInt(document.getElementById('playerCount').value);
  
  players = [];
  playerStats = [];
  
  for (let i = 0; i < count; i++) {
    let nameInput = document.getElementById(`playerName${i}`);
    let name = nameInput ? nameInput.value.trim() : `প্লেয়ার ${i+1}`;
    players.push(name);
    playerStats.push({
      correctCalls: 0,
      bonusPoints: 0
    });
  }
  
  totalScores = new Array(players.length).fill(0);
  currentRound = 1;
  currentCallValues = new Array(players.length).fill(0);
  currentTrickValues = new Array(players.length).fill(0);
  
  gameCode = generateGameCode();
  mainGameCode.textContent = gameCode;
  
  setupPanel.classList.remove('active');
  gamePanel.classList.add('active');
  mainGameStatus.textContent = 'বোনাস রাউন্ড চলছে';
  mainRoundInfo.textContent = `রাউন্ড ${currentRound}`;
  
  showBonusRound();
  updateScoreTable();
  showToast(`গেম শুরু! কোড: ${gameCode}`, 'success');
  
  updateConnectedGameData();
}

function showBonusRound() {
  bonusArea.style.display = 'block';
  callArea.style.display = 'none';
  
  const grid = document.getElementById('bonusPlayersGrid');
  grid.innerHTML = '';
  
  players.forEach((player, idx) => {
    const card = createPlayerCard(player, idx, 'bonus');
    grid.appendChild(card);
  });
}

function createPlayerCard(player, idx, type) {
  const card = document.createElement('div');
  card.className = 'player-card';
  
  const avatars = ['👑', '⚡', '🌟', '🔥', '💎', '🎯'];
  
  if (type === 'bonus') {
    card.innerHTML = `
      <div class="player-header">
        <span class="player-avatar">${avatars[idx]}</span>
        <div class="player-info">
          <h4>${player}</h4>
        </div>
      </div>
      <div class="input-pair">
        <label>উঠেছে</label>
        <input type="number" id="bonus${idx}" min="0" value="" placeholder="০" step="1">
      </div>
    `;
  } else if (type === 'call') {
    card.innerHTML = `
      <div class="player-header">
        <span class="player-avatar">${avatars[idx]}</span>
        <div class="player-info">
          <h4>${player}</h4>
        </div>
      </div>
      <div class="input-pair">
        <label>কল</label>
        <input type="number" id="call${idx}" min="0" value="" placeholder="০" step="1" onchange="updateCallValue(${idx}, this.value)">
      </div>
    `;
  } else if (type === 'trick') {
    card.innerHTML = `
      <div class="player-header">
        <span class="player-avatar">${avatars[idx]}</span>
        <div class="player-info">
          <h4>${player}</h4>
        </div>
      </div>
      <div class="call-summary">
        কল: ${currentCallValues[idx] || 0}
      </div>
      <div class="input-pair">
        <label>উঠেছে</label>
        <input type="number" id="trick${idx}" min="0" value="" placeholder="০" step="1" onchange="updateTrickValue(${idx}, this.value)">
      </div>
    `;
  }
  
  return card;
}

function updateCallValue(index, value) {
  currentCallValues[index] = parseInt(value) || 0;
  updateLiveGameView();
  updatePredictionMarkets();
}

function updateTrickValue(index, value) {
  currentTrickValues[index] = parseInt(value) || 0;
}

function submitBonusRound() {
  players.forEach((_, i) => {
    const input = document.getElementById(`bonus${i}`);
    let got = parseInt(input?.value, 10) || 0;
    totalScores[i] += got;
  });
  
  currentRound = 2;
  mainRoundInfo.textContent = `রাউন্ড ${currentRound}`;
  mainGameStatus.textContent = 'কল ফেজ চলছে';
  
  bonusArea.style.display = 'none';
  callArea.style.display = 'block';
  callPhase.style.display = 'block';
  trickPhase.style.display = 'none';
  
  loadCallPhase();
  updateScoreTable();
  showToast('বোনাস রাউন্ড শেষ', 'success');
  
  updateConnectedGameData();
}

function loadCallPhase() {
  const grid = document.getElementById('callPlayersGrid');
  grid.innerHTML = '';
  
  players.forEach((player, idx) => {
    const card = createPlayerCard(player, idx, 'call');
    grid.appendChild(card);
  });
  
  updateLiveGameView();
}

function submitCallPhase() {
  players.forEach((_, i) => {
    const input = document.getElementById(`call${i}`);
    let call = parseInt(input?.value, 10) || 0;
    currentCallValues[i] = call;
  });
  
  callPhase.style.display = 'none';
  trickPhase.style.display = 'block';
  
  loadTrickPhase();
  showToast('কল সাবমিট হয়েছে', 'success');
  
  updateConnectedGameData();
  updateLiveGameView();
}

function loadTrickPhase() {
  const grid = document.getElementById('trickPlayersGrid');
  grid.innerHTML = '';
  
  players.forEach((player, idx) => {
    const card = createPlayerCard(player, idx, 'trick');
    grid.appendChild(card);
  });
}

function submitTrickPhase() {
  players.forEach((_, i) => {
    const input = document.getElementById(`trick${i}`);
    let got = parseInt(input?.value, 10) || 0;
    currentTrickValues[i] = got;
    
    let call = currentCallValues[i] || 0;
    let score = calculateScore(call, got);
    totalScores[i] += score;
    
    if (call === got) playerStats[i].correctCalls++;
  });
  
  checkBetResults(currentRound);
  
  currentRound++;
  mainRoundInfo.textContent = `রাউন্ড ${currentRound}`;
  mainGameStatus.textContent = 'কল ফেজ চলছে';
  
  callPhase.style.display = 'block';
  trickPhase.style.display = 'none';
  
  loadCallPhase();
  updateScoreTable();
  showToast(`রাউন্ড ${currentRound-1} শেষ`, 'success');
  
  updateConnectedGameData();
}

function calculateScore(call, got) {
  call = parseInt(call) || 0;
  got = parseInt(got) || 0;
  
  if (got > call) {
    return call + ((got - call) * 0.1);
  } else if (call === got) {
    return call;
  } else {
    return -call;
  }
}

function updateScoreTable() {
  let html = '';
  
  players.forEach((player, i) => {
    html += `
      <tr>
        <td>${player}</td>
        <td>${currentCallValues[i] || '-'}</td>
        <td>${currentTrickValues[i] || '-'}</td>
        <td>${totalScores[i].toFixed(1)}</td>
      </tr>
    `;
  });
  
  scoreTableBody.innerHTML = html;
}

function copyMainGameCode() {
  navigator.clipboard.writeText(gameCode);
  showToast('গেম কোড কপি হয়েছে!', 'success');
}

// ========== গেম শেষ ফাংশন ==========
function showGameEndModal() {
  // বিজয়ী নির্ধারণ
  const sortedPlayers = players.map((player, index) => ({
    name: player,
    score: totalScores[index],
    index
  })).sort((a, b) => b.score - a.score);
  
  // পোডিয়াম তৈরি
  let podiumHtml = '';
  for (let i = 0; i < Math.min(3, sortedPlayers.length); i++) {
    const p = sortedPlayers[i];
    const position = i === 0 ? 'first' : i === 1 ? 'second' : 'third';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
    
    podiumHtml += `
      <div class="podium-item ${position}">
        <div class="podium-rank">${medal}</div>
        <div class="podium-name">${p.name}</div>
        <div class="podium-score">${p.score.toFixed(1)}</div>
      </div>
    `;
  }
  podiumContainer.innerHTML = podiumHtml;
  
  // সব প্লেয়ারের স্কোর
  let scoresHtml = '';
  sortedPlayers.forEach((p, i) => {
    const position = i === 0 ? 'first' : i === 1 ? 'second' : i === 2 ? 'third' : '';
    scoresHtml += `
      <div class="score-item ${position}">
        <span class="score-rank">#${i+1}</span>
        <span class="score-name">${p.name}</span>
        <span class="score-points">${p.score.toFixed(1)}</span>
      </div>
    `;
  });
  finalScoresList.innerHTML = scoresHtml;
  
  // ম্যাচ বিজয়ী বাজি চেক
  checkMatchWinnerBets(sortedPlayers[0].index);
  
  gameEndModal.style.display = 'flex';
}

function closeGameEndModal() {
  gameEndModal.style.display = 'none';
}

function startNewGame() {
  // সব স্টেট রিসেট
  players = [];
  totalScores = [];
  playerStats = [];
  roundHistory = [];
  currentRound = 1;
  currentCallValues = [];
  currentTrickValues = [];
  gameCode = '';
  
  // UI রিসেট
  gamePanel.classList.remove('active');
  setupPanel.classList.add('active');
  mainGameCode.textContent = '----';
  mainGameStatus.textContent = 'সেটআপ মোড';
  mainRoundInfo.textContent = 'রাউন্ড ০';
  
  // মডাল বন্ধ
  gameEndModal.style.display = 'none';
  
  // নাম ফিল্ড রি-জেনারেট
  generateNameFields();
  
  showToast('নতুন গেম শুরু! সেটআপ করুন', 'success');
}

function checkMatchWinnerBets(winnerIndex) {
  activeBets.forEach(bet => {
    if (bet.type === 'match' && bet.status === 'pending') {
      if (bet.playerIndex === winnerIndex) {
        bet.status = 'win';
        const winAmount = bet.amount * bet.odds;
        
        const predictor = predictors.find(p => p.id === bet.predictorId);
        if (predictor) {
          predictor.cigarettes += winAmount;
          predictor.wins++;
          
          addToBettingFeed({
            ...bet,
            time: new Date().toLocaleTimeString(),
            result: `জিতেছেন ${winAmount.toFixed(1)} 🚬`
          });
        }
      } else {
        bet.status = 'lose';
        const predictor = predictors.find(p => p.id === bet.predictorId);
        if (predictor) {
          predictor.losses++;
        }
      }
    }
  });
  
  updatePredictorsList();
  updatePredictorHistory();
}

function shootConfetti() {
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}%;
        top: -10px;
        width: 8px;
        height: 8px;
        background: hsl(${Math.random() * 360}, 100%, 50%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        animation: confettiFall ${Math.random() * 3 + 2}s linear;
      `;
      document.body.appendChild(confetti);
      
      setTimeout(() => confetti.remove(), 5000);
    }, i * 30);
  }
}

// ========== প্রেডিকশন ফাংশন ==========

function showPredictorSetup() {
  predictorSetupModal.style.display = 'flex';
}

function setSetupCigarette(amount) {
  document.getElementById('predictorCigaretteSetup').value = amount;
}

function savePredictorSetup() {
  const name = document.getElementById('predictorNameInput').value.trim();
  const cigarettes = parseFloat(document.getElementById('predictorCigaretteSetup').value);
  
  if (!name) {
    showToast('নাম দিন!', 'error');
    return;
  }
  
  if (cigarettes < 1) {
    showToast('সর্বনিম্ন ১ সিগারেট!', 'error');
    return;
  }
  
  currentPredictor = {
    id: Date.now(),
    name: name,
    cigarettes: cigarettes,
    bets: [],
    wins: 0,
    losses: 0
  };
  
  predictors.push(currentPredictor);
  
  predictorCigarettes.textContent = currentPredictor.cigarettes.toFixed(1);
  predictorCigaretteInput.value = '10';
  currentCigaretteAmount = 10;
  
  closeModal('predictorSetupModal');
  updatePredictorsList();
  showToast(`${name} হিসেবে সেটআপ সম্পন্ন`, 'success');
}

function setCigaretteAmount(amount) {
  if (currentPredictor && amount > currentPredictor.cigarettes) {
    showToast('পর্যাপ্ত সিগারেট নেই!', 'error');
    return;
  }
  
  if (amount < 1) amount = 1;
  if (amount > 20) amount = 20;
  
  currentCigaretteAmount = amount;
  predictorCigaretteInput.value = amount.toFixed(1);
}

function setCustomCigaretteAmount() {
  const input = document.getElementById('predictorCigaretteInput');
  let amount = parseFloat(input.value);
  
  if (isNaN(amount) || amount < 1) {
    showToast('সর্বনিম্ন ১ সিগারেট!', 'error');
    input.value = 1;
    currentCigaretteAmount = 1;
    return;
  }
  
  if (amount > 20) {
    showToast('সর্বোচ্চ ২০ সিগারেট!', 'error');
    input.value = 20;
    currentCigaretteAmount = 20;
    return;
  }
  
  if (currentPredictor && amount > currentPredictor.cigarettes) {
    showToast('পর্যাপ্ত সিগারেট নেই!', 'error');
    input.value = currentPredictor.cigarettes;
    currentCigaretteAmount = currentPredictor.cigarettes;
    return;
  }
  
  currentCigaretteAmount = amount;
}

function connectToGame() {
  const code = document.getElementById('predictionGameCode').value.toUpperCase();
  
  if (code === gameCode) {
    connectedGame = {
      code: code,
      players: players,
      round: currentRound,
      calls: currentCallValues,
      scores: totalScores
    };
    
    connectedGameInfo.style.display = 'flex';
    connectedGameCode.textContent = code;
    connectedPlayers.textContent = players.length;
    connectedRound.textContent = currentRound;
    
    updateLiveGameView();
    updatePredictionMarkets();
    
    showToast('গেমে কানেক্টেড!', 'success');
  } else {
    showToast('ভুল গেম কোড!', 'error');
  }
}

function updateConnectedGameData() {
  if (!connectedGame) return;
  
  connectedGame.players = players;
  connectedGame.round = currentRound;
  connectedGame.calls = currentCallValues;
  
  connectedPlayers.textContent = players.length;
  connectedRound.textContent = currentRound;
  
  updateLiveGameView();
  updatePredictionMarkets();
}

function updateLiveGameView() {
  if (!connectedGame || !liveGamePlayers) return;
  
  let html = '';
  
  players.forEach((player, i) => {
    html += `
      <div class="live-player-card">
        <span class="player-name">${player}</span>
        <span class="player-call">${currentCallValues[i] || '০'}</span>
      </div>
    `;
  });
  
  liveGamePlayers.innerHTML = html;
}

function updatePredictionMarkets() {
  if (!connectedGame) return;
  
  const avatars = ['👑', '⚡', '🌟', '🔥', '💎', '🎯'];
  
  roundMarket.innerHTML = '';
  players.forEach((player, i) => {
    const odds = (players.length * 1.2).toFixed(2);
    roundMarket.innerHTML += `
      <div class="market-item" onclick="openBetModal('round', ${i}, '${player}', 'এই রাউন্ডের বিজয়ী', ${odds})">
        <div class="market-item-left">
          <span class="market-player-avatar">${avatars[i]}</span>
          <span>${player}</span>
        </div>
        <div class="market-item-right">
          <span class="market-odds-value">${odds}x</span>
          <button class="bet-now-btn">বাজি</button>
        </div>
      </div>
    `;
  });
  
  exactCallMarket.innerHTML = '';
  players.forEach((player, i) => {
    exactCallMarket.innerHTML += `
      <div class="market-item" onclick="openBetModal('exact', ${i}, '${player}', 'সঠিক কল উঠবে', 5.0)">
        <div class="market-item-left">
          <span class="market-player-avatar">${avatars[i]}</span>
          <span>${player}</span>
        </div>
        <div class="market-item-right">
          <span class="market-odds-value">৫.০x</span>
          <button class="bet-now-btn">বাজি</button>
        </div>
      </div>
    `;
  });
  
  overUnderMarket.innerHTML = '';
  players.forEach((player, i) => {
    overUnderMarket.innerHTML += `
      <div class="market-item" onclick="openBetModal('over', ${i}, '${player}', 'কলের বেশি উঠবে', 3.0)">
        <div class="market-item-left">
          <span class="market-player-avatar">${avatars[i]}</span>
          <span>${player} - বেশি</span>
        </div>
        <div class="market-item-right">
          <span class="market-odds-value">৩.০x</span>
          <button class="bet-now-btn">বাজি</button>
        </div>
      </div>
      <div class="market-item" onclick="openBetModal('under', ${i}, '${player}', 'কলের কম উঠবে', 4.0)">
        <div class="market-item-left">
          <span class="market-player-avatar">${avatars[i]}</span>
          <span>${player} - কম</span>
        </div>
        <div class="market-item-right">
          <span class="market-odds-value">৪.০x</span>
          <button class="bet-now-btn">বাজি</button>
        </div>
      </div>
    `;
  });
  
  matchWinnerMarket.innerHTML = '';
  players.forEach((player, i) => {
    const odds = (players.length * 1.5).toFixed(2);
    matchWinnerMarket.innerHTML += `
      <div class="market-item" onclick="openBetModal('match', ${i}, '${player}', 'পুরো গেমের বিজয়ী', ${odds})">
        <div class="market-item-left">
          <span class="market-player-avatar">${avatars[i]}</span>
          <span>${player}</span>
        </div>
        <div class="market-item-right">
          <span class="market-odds-value">${odds}x</span>
          <button class="bet-now-btn">বাজি</button>
        </div>
      </div>
    `;
  });
}

let currentBetSelection = null;

function openBetModal(type, playerIndex, playerName, description, odds) {
  if (!currentPredictor) {
    showToast('প্রথমে প্রেডিক্টর সেটআপ করুন!', 'error');
    predictorSetupModal.style.display = 'flex';
    return;
  }
  
  currentBetSelection = {
    type: type,
    playerIndex: playerIndex,
    playerName: playerName,
    description: description,
    odds: parseFloat(odds)
  };
  
  modalBetDetails.innerHTML = `
    <div style="font-size: 1.1rem; margin-bottom: 10px;">${description}</div>
    <div style="color: var(--accent); font-size: 1.2rem; margin-bottom: 10px;">ওডস: ${odds}x</div>
    <div style="background: var(--card-bg); padding: 10px; border-radius: 10px; border: 1px solid var(--border-color);">
      <div style="margin-bottom: 5px;">আপনার বাজি: <span style="color: var(--accent); font-weight: 700;">${currentCigaretteAmount}</span> সিগারেট</div>
      <div>সর্বনিম্ন: ১ | সর্বোচ্চ: ২০</div>
    </div>
  `;
  
  const potentialWin = (currentCigaretteAmount * parseFloat(odds)).toFixed(1);
  modalPotentialWin.innerHTML = `<span style="color: #4caf50; font-size: 1.3rem;">${potentialWin}</span> সিগারেট`;
  
  betModal.style.display = 'flex';
}

function confirmBet() {
  if (!currentPredictor || !currentBetSelection) return;
  
  if (currentCigaretteAmount > currentPredictor.cigarettes) {
    showToast('পর্যাপ্ত সিগারেট নেই!', 'error');
    closeModal('betModal');
    return;
  }
  
  const bet = {
    id: Date.now(),
    predictorId: currentPredictor.id,
    predictorName: currentPredictor.name,
    type: currentBetSelection.type,
    playerIndex: currentBetSelection.playerIndex,
    playerName: currentBetSelection.playerName,
    description: currentBetSelection.description,
    amount: currentCigaretteAmount,
    odds: currentBetSelection.odds,
    round: currentRound,
    status: 'pending',
    timestamp: new Date().toLocaleTimeString()
  };
  
  activeBets.push(bet);
  currentPredictor.bets.push(bet);
  currentPredictor.cigarettes -= currentCigaretteAmount;
  
  totalPool += currentCigaretteAmount;
  
  addToBettingFeed(bet);
  
  predictorCigarettes.textContent = currentPredictor.cigarettes.toFixed(1);
  updateBetSlip();
  updatePredictorsList();
  
  closeModal('betModal');
  showToast('বাজি সফলভাবে যোগ হয়েছে!', 'success');
}

function addToBettingFeed(bet) {
  const feedItem = {
    ...bet,
    time: new Date().toLocaleTimeString()
  };
  
  bettingFeed.unshift(feedItem);
  
  if (bettingFeed.length > 20) {
    bettingFeed.pop();
  }
  
  updateBettingFeed();
}

function updateBettingFeed() {
  let html = '';
  
  bettingFeed.forEach(item => {
    html += `
      <div class="feed-item">
        <span class="feed-time">${item.time}</span>
        <span class="feed-predictor">${item.predictorName}</span>
        <span>বাজি ধরেছেন</span>
        <span class="feed-bet">${item.amount} 🚬</span>
        <span>অন</span>
        <span>${item.playerName}</span>
        ${item.result ? `<span style="color: #4caf50;">${item.result}</span>` : ''}
      </div>
    `;
  });
  
  bettingFeedContainer.innerHTML = html;
  totalBetsCount.textContent = `${activeBets.length}টি বাজি`;
}

function updateBetSlip() {
  if (!currentPredictor) return;
  
  const pendingBets = currentPredictor.bets.filter(b => b.status === 'pending');
  
  if (pendingBets.length === 0) {
    betSlipItems.innerHTML = '<div class="empty-slip">কোনো বাজি নেই</div>';
    totalBetAmount.textContent = '০';
    return;
  }
  
  let html = '';
  let total = 0;
  
  pendingBets.forEach((bet, index) => {
    total += bet.amount;
    html += `
      <div class="slip-item">
        <span>${bet.playerName} - ${bet.amount} 🚬</span>
        <span class="slip-remove" onclick="removeBet(${index})">✕</span>
      </div>
    `;
  });
  
  betSlipItems.innerHTML = html;
  totalBetAmount.textContent = total.toFixed(1);
}

function removeBet(index) {
  if (!currentPredictor) return;
  
  const bet = currentPredictor.bets[index];
  currentPredictor.cigarettes += bet.amount;
  currentPredictor.bets.splice(index, 1);
  
  predictorCigarettes.textContent = currentPredictor.cigarettes.toFixed(1);
  updateBetSlip();
}

function placeBets() {
  if (!currentPredictor || currentPredictor.bets.length === 0) {
    showToast('কোনো বাজি নেই!', 'error');
    return;
  }
  
  showToast('বাজি জমা হয়েছে! ফলাফলের জন্য অপেক্ষা করুন', 'success');
}

function checkBetResults(round) {
  if (!connectedGame || activeBets.length === 0) return;
  
  const roundBets = activeBets.filter(b => b.round === round && b.status === 'pending');
  
  if (roundBets.length === 0) return;
  
  const winners = [];
  const losers = [];
  
  roundBets.forEach(bet => {
    let won = false;
    
    if (bet.type === 'round') {
      const maxTrick = Math.max(...currentTrickValues);
      const winnersCount = currentTrickValues.filter(v => v === maxTrick).length;
      
      if (currentTrickValues[bet.playerIndex] === maxTrick && winnersCount === 1) {
        won = true;
      }
    } else if (bet.type === 'exact') {
      if (currentCallValues[bet.playerIndex] === currentTrickValues[bet.playerIndex]) {
        won = true;
      }
    } else if (bet.type === 'over') {
      if (currentTrickValues[bet.playerIndex] > currentCallValues[bet.playerIndex]) {
        won = true;
      }
    } else if (bet.type === 'under') {
      if (currentTrickValues[bet.playerIndex] < currentCallValues[bet.playerIndex]) {
        won = true;
      }
    }
    
    if (won) {
      winners.push(bet);
    } else {
      losers.push(bet);
    }
  });
  
  const totalPool = roundBets.reduce((sum, bet) => sum + bet.amount, 0);
  
  if (winners.length > 0) {
    const winAmount = totalPool / winners.length;
    
    winners.forEach(bet => {
      bet.status = 'win';
      
      const predictor = predictors.find(p => p.id === bet.predictorId);
      if (predictor) {
        predictor.cigarettes += winAmount;
        predictor.wins++;
        
        addToBettingFeed({
          ...bet,
          time: new Date().toLocaleTimeString(),
          result: `জিতেছেন ${winAmount.toFixed(1)} 🚬`
        });
      }
    });
  }
  
  losers.forEach(bet => {
    bet.status = 'lose';
    const predictor = predictors.find(p => p.id === bet.predictorId);
    if (predictor) {
      predictor.losses++;
    }
  });
  
  updatePredictorsList();
  updatePredictorHistory();
}

function updatePredictorsList() {
  let html = '';
  
  predictors.forEach(p => {
    const totalBets = p.bets.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
    html += `
      <div class="predictor-tag">
        <div class="predictor-tag-left">
          <i class="fas fa-user"></i>
          <span class="predictor-name">${p.name}</span>
        </div>
        <div>
          <span class="predictor-bet-amount">${totalBets.toFixed(1)}</span>
          <span>🚬</span>
        </div>
      </div>
    `;
  });
  
  predictorsList.innerHTML = html;
}

function updatePredictorHistory() {
  if (!currentPredictor) return;
  
  let html = '';
  
  currentPredictor.bets.slice(-5).reverse().forEach(b => {
    const statusClass = b.status === 'win' ? 'win' : b.status === 'lose' ? 'lose' : 'pending';
    const statusText = b.status === 'win' ? '✅ জিতেছে' : b.status === 'lose' ? '❌ হেরেছে' : '⏳ অপেক্ষায়';
    
    html += `
      <div class="history-item ${statusClass}">
        <span>${b.playerName}</span>
        <span>${b.amount} 🚬</span>
        <span class="history-status">${statusText}</span>
      </div>
    `;
  });
  
  predictorHistoryList.innerHTML = html;
}

function updatePredictionUI() {
  if (connectedGame) {
    updateConnectedGameData();
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// ========== টোস্ট ফাংশন ==========
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ========== উইন্ডো লোড ==========
window.onload = function() {
  // থিম লোড
  const savedTheme = localStorage.getItem('breezeTheme') || 'neon';
  setTheme(savedTheme);
  
  generateNameFields();
  predictorCigarettes.textContent = '০';
};

// ========== গ্লোবাল ফাংশন ==========
window.setTheme = setTheme;
window.switchMainTab = switchMainTab;
window.adjustPlayerCount = adjustPlayerCount;
window.generateNameFields = generateNameFields;
window.startBonusRound = startBonusRound;
window.submitBonusRound = submitBonusRound;
window.submitCallPhase = submitCallPhase;
window.submitTrickPhase = submitTrickPhase;
window.copyMainGameCode = copyMainGameCode;
window.showGameEndModal = showGameEndModal;
window.closeGameEndModal = closeGameEndModal;
window.startNewGame = startNewGame;
window.updateCallValue = updateCallValue;
window.updateTrickValue = updateTrickValue;

window.showPredictorSetup = showPredictorSetup;
window.setSetupCigarette = setSetupCigarette;
window.savePredictorSetup = savePredictorSetup;
window.setCigaretteAmount = setCigaretteAmount;
window.setCustomCigaretteAmount = setCustomCigaretteAmount;
window.connectToGame = connectToGame;
window.openBetModal = openBetModal;
window.confirmBet = confirmBet;
window.placeBets = placeBets;
window.removeBet = removeBet;
window.closeModal = closeModal;
