/**
 * FinanceQuest - Multi-Platform Finance Manager
 * Firebase Integration with Real-time Sync
 */

// ========================================
// FIREBASE CONFIGURATION
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyBQIrs1W4C0E8dC-T2aLkC8_1e5h3z7k9Q",
  authDomain: "financequest-app.firebaseapp.com",
  projectId: "financequest-app",
  storageBucket: "financequest-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported by browser');
    }
  });

// ========================================
// STATE MANAGEMENT
// ========================================
const AppState = {
  user: {
    uid: null,
    name: '',
    email: '',
    level: 1,
    xp: 0,
    maxXp: 100,
    streak: 0,
    lastLogin: null,
    createdAt: null
  },
  transactions: [],
  goals: [],
  achievements: [
    { id: 1, name: 'Pemula Keuangan', description: 'Buat transaksi pertamamu', icon: '🌱', earned: false },
    { id: 2, name: 'Pencatat Rajin', description: 'Catat 10 transaksi', icon: '📝', earned: false, condition: () => AppState.transactions.length >= 10 },
    { id: 3, name: 'Master Keuangan', description: 'Catat 50 transaksi', icon: '👑', earned: false, condition: () => AppState.transactions.length >= 50 },
    { id: 4, name: 'Penabung Handal', description: 'Capai tabungan 1 juta', icon: '💰', earned: false, condition: () => calculateBalance() >= 1000000 },
    { id: 5, name: 'Streak 7 Hari', description: 'Login 7 hari berturut-turut', icon: '🔥', earned: false, condition: () => AppState.user.streak >= 7 },
    { id: 6, name: 'Pencapaian Target', description: 'Selesaikan 1 target keuangan', icon: '🎯', earned: false, condition: () => AppState.goals.some(g => g.savedAmount >= g.targetAmount) },
    { id: 7, name: 'Hemat 30%', description: 'Hemat 30% dari pendapatan', icon: '📈', earned: false, condition: () => getSavingsRate() >= 30 },
    { id: 8, name: 'Multikategori', description: 'Gunakan 5 kategori berbeda', icon: '📊', earned: false, condition: () => getUniqueCategories() >= 5 }
  ],
  charts: {
    main: null,
    category: null,
    trend: null
  },
  isOnline: navigator.onLine,
  isSyncing: false
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const getToday = () => new Date().toISOString().split('T')[0];

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const calculateXp = (amount) => Math.max(1, Math.floor(amount / 10000));

// ========================================
// CALCULATION FUNCTIONS
// ========================================
const calculateTotalIncome = () => {
  return AppState.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
};

const calculateTotalExpense = () => {
  return AppState.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
};

const calculateBalance = () => calculateTotalIncome() - calculateTotalExpense();

const getMonthlyIncome = () => {
  const now = new Date();
  return AppState.transactions
    .filter(t => t.type === 'income')
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

const getMonthlyExpense = () => {
  const now = new Date();
  return AppState.transactions
    .filter(t => t.type === 'expense')
    .filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + t.amount, 0);
};

const getSavingsRate = () => {
  const income = calculateTotalIncome();
  const balance = calculateBalance();
  return income > 0 ? (balance / income) * 100 : 0;
};

const getUniqueCategories = () => {
  const categories = new Set(AppState.transactions.filter(t => t.type === 'expense').map(t => t.category));
  return categories.size;
};

const getCategoryData = () => {
  const categoryTotals = {};
  AppState.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
  return categoryTotals;
};

// ========================================
// NOTIFICATION SYSTEM
// ========================================
const showNotification = (message, type = 'success', title = null) => {
  const container = document.getElementById('notificationContainer');
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const titles = {
    success: 'Sukses!',
    error: 'Oops!',
    info: 'Info',
    xp: 'XP Didapat!'
  };
  
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    xp: 'fa-star'
  };
  
  notification.innerHTML = `
    <div class="notification-icon"><i class="fas ${icons[type]}"></i></div>
    <div class="notification-content">
      <div class="notification-title">${title || titles[type]}</div>
      <div class="notification-message">${message}</div>
    </div>
    <button class="notification-close"><i class="fas fa-times"></i></button>
  `;
  
  container.appendChild(notification);
  
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.classList.add('hiding');
    setTimeout(() => notification.remove(), 300);
  });
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.classList.add('hiding');
      setTimeout(() => notification.remove(), 300);
    }
  }, 5000);
};

// ========================================
// SYNC STATUS
// ========================================
const updateSyncStatus = (status) => {
  const syncStatus = document.getElementById('syncStatus');
  if (!syncStatus) return;
  
  if (status === 'syncing') {
    syncStatus.innerHTML = '<i class="fas fa-sync"></i><span>Menyinkron...</span>';
    syncStatus.className = 'sync-status syncing';
  } else if (status === 'synced') {
    syncStatus.innerHTML = '<i class="fas fa-check-circle"></i><span>Tersinkron</span>';
    syncStatus.className = 'sync-status';
  } else if (status === 'error') {
    syncStatus.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Gagal sinkron</span>';
    syncStatus.className = 'sync-status error';
  } else if (status === 'offline') {
    syncStatus.innerHTML = '<i class="fas fa-wifi-slash"></i><span>Offline</span>';
    syncStatus.className = 'sync-status error';
  }
};

// ========================================
// FIREBASE DATA OPERATIONS
// ========================================
const saveUserData = async () => {
  if (!AppState.user.uid) return;
  
  updateSyncStatus('syncing');
  
  try {
    const userRef = db.collection('users').doc(AppState.user.uid);
    await userRef.set({
      name: AppState.user.name,
      email: AppState.user.email,
      level: AppState.user.level,
      xp: AppState.user.xp,
      maxXp: AppState.user.maxXp,
      streak: AppState.user.streak,
      lastLogin: AppState.user.lastLogin,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    updateSyncStatus('synced');
  } catch (error) {
    console.error('Error saving user data:', error);
    updateSyncStatus('error');
  }
};

const loadUserData = async (uid) => {
  try {
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (userDoc.exists) {
      const data = userDoc.data();
      AppState.user = {
        ...AppState.user,
        ...data,
        uid: uid
      };
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
};

const saveTransaction = async (transaction) => {
  if (!AppState.user.uid) return;
  
  try {
    await db.collection('users').doc(AppState.user.uid)
      .collection('transactions')
      .doc(transaction.id)
      .set({
        ...transaction,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Error saving transaction:', error);
  }
};

const deleteTransactionFromDB = async (transactionId) => {
  if (!AppState.user.uid) return;
  
  try {
    await db.collection('users').doc(AppState.user.uid)
      .collection('transactions')
      .doc(transactionId)
      .delete();
  } catch (error) {
    console.error('Error deleting transaction:', error);
  }
};

const saveGoal = async (goal) => {
  if (!AppState.user.uid) return;
  
  try {
    await db.collection('users').doc(AppState.user.uid)
      .collection('goals')
      .doc(goal.id)
      .set({
        ...goal,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
  } catch (error) {
    console.error('Error saving goal:', error);
  }
};

const deleteGoalFromDB = async (goalId) => {
  if (!AppState.user.uid) return;
  
  try {
    await db.collection('users').doc(AppState.user.uid)
      .collection('goals')
      .doc(goalId)
      .delete();
  } catch (error) {
    console.error('Error deleting goal:', error);
  }
};

const setupRealtimeListeners = () => {
  if (!AppState.user.uid) return;
  
  // Listen to transactions
  db.collection('users').doc(AppState.user.uid)
    .collection('transactions')
    .orderBy('date', 'desc')
    .onSnapshot((snapshot) => {
      AppState.transactions = [];
      snapshot.forEach((doc) => {
        AppState.transactions.push({ id: doc.id, ...doc.data() });
      });
      updateDashboard();
      updateTransactionsTable();
      checkAchievements();
    }, (error) => {
      console.error('Error listening to transactions:', error);
    });
  
  // Listen to goals
  db.collection('users').doc(AppState.user.uid)
    .collection('goals')
    .onSnapshot((snapshot) => {
      AppState.goals = [];
      snapshot.forEach((doc) => {
        AppState.goals.push({ id: doc.id, ...doc.data() });
      });
      updateGoalsUI();
    }, (error) => {
      console.error('Error listening to goals:', error);
    });
  
  // Listen to user data
  db.collection('users').doc(AppState.user.uid)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        AppState.user = {
          ...AppState.user,
          ...data
        };
        updateXpDisplay();
      }
    }, (error) => {
      console.error('Error listening to user data:', error);
    });
};

// ========================================
// XP & LEVEL SYSTEM
// ========================================
const addXp = async (amount) => {
  AppState.user.xp += amount;
  
  while (AppState.user.xp >= AppState.user.maxXp) {
    AppState.user.xp -= AppState.user.maxXp;
    AppState.user.level++;
    AppState.user.maxXp = Math.floor(AppState.user.maxXp * 1.5);
    showLevelUpModal();
  }
  
  updateXpDisplay();
  await saveUserData();
};

const showLevelUpModal = () => {
  const modal = document.getElementById('levelUpModal');
  document.getElementById('newLevel').textContent = AppState.user.level;
  modal.classList.add('active');
  
  setTimeout(() => {
    AppState.user.xp += 50;
    updateXpDisplay();
    saveUserData();
  }, 500);
};

const updateXpDisplay = () => {
  document.getElementById('sidebarLevel').textContent = AppState.user.level;
  document.getElementById('headerLevel').textContent = AppState.user.level;
  document.getElementById('currentXP').textContent = AppState.user.xp;
  document.getElementById('maxXP').textContent = AppState.user.maxXp;
  document.getElementById('xpFill').style.width = `${(AppState.user.xp / AppState.user.maxXp) * 100}%`;
};

// ========================================
// ACHIEVEMENT SYSTEM
// ========================================
const checkAchievements = () => {
  let newAchievements = 0;
  
  AppState.achievements.forEach(achievement => {
    if (!achievement.earned && achievement.condition && achievement.condition()) {
      achievement.earned = true;
      achievement.earnedDate = new Date().toISOString();
      newAchievements++;
      
      showNotification(
        `Kamu mendapatkan prestasi "${achievement.name}"!`,
        'success',
        '🏆 Prestasi Baru!'
      );
      
      addXp(25);
    }
  });
  
  if (newAchievements > 0) {
    updateAchievementsUI();
  }
  
  return newAchievements;
};

const updateAchievementsUI = () => {
  const earned = AppState.achievements.filter(a => a.earned).length;
  const total = AppState.achievements.length;
  
  document.getElementById('earnedAchievements').textContent = earned;
  document.getElementById('totalAchievements').textContent = total;
  document.getElementById('completionRate').textContent = `${Math.round((earned / total) * 100)}%`;
  document.getElementById('achievementBadge').textContent = earned;
  
  const grid = document.getElementById('achievementsGrid');
  grid.innerHTML = AppState.achievements.map(achievement => `
    <div class="achievement-card ${achievement.earned ? 'earned' : ''}">
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-info">
        <div class="achievement-name">${achievement.name}</div>
        <div class="achievement-desc">${achievement.description}</div>
      </div>
      <div class="achievement-status">
        ${achievement.earned ? '<i class="fas fa-check"></i> Didapat' : '<i class="fas fa-lock"></i> Terkunci'}
      </div>
    </div>
  `).join('');
};

// ========================================
// CHARTS
// ========================================
const initCharts = () => {
  const mainCtx = document.getElementById('mainChart');
  if (mainCtx) {
    AppState.charts.main = new Chart(mainCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Pendapatan',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'Pengeluaran',
            data: [],
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#94a3b8' } }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              callback: value => 'Rp ' + (value / 1000) + 'K'
            }
          }
        }
      }
    });
  }
  
  const categoryCtx = document.getElementById('categoryChart');
  if (categoryCtx) {
    AppState.charts.category = new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        cutout: '70%'
      }
    });
  }
  
  const trendCtx = document.getElementById('trendChart');
  if (trendCtx) {
    AppState.charts.trend = new Chart(trendCtx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          label: 'Netto',
          data: [],
          backgroundColor: [],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', callback: value => 'Rp ' + (value / 1000) + 'K' }
          }
        }
      }
    });
  }
  
  updateCharts();
};

const updateCharts = () => {
  updateMainChart();
  updateCategoryChart();
  updateTrendChart();
};

const updateMainChart = (period = 'month') => {
  if (!AppState.charts.main) return;
  
  const groupedData = {};
  AppState.transactions.forEach(t => {
    const date = new Date(t.date);
    let key;
    
    if (period === 'week') {
      key = date.toLocaleDateString('id-ID', { weekday: 'short' });
    } else if (period === 'month') {
      key = date.getDate().toString();
    } else {
      key = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    }
    
    if (!groupedData[key]) {
      groupedData[key] = { income: 0, expense: 0 };
    }
    groupedData[key][t.type] += t.amount;
  });
  
  const labels = Object.keys(groupedData).slice(-7);
  const incomeData = labels.map(l => groupedData[l]?.income || 0);
  const expenseData = labels.map(l => groupedData[l]?.expense || 0);
  
  AppState.charts.main.data.labels = labels;
  AppState.charts.main.data.datasets[0].data = incomeData;
  AppState.charts.main.data.datasets[1].data = expenseData;
  AppState.charts.main.update();
};

const updateCategoryChart = () => {
  if (!AppState.charts.category) return;
  
  const categoryData = getCategoryData();
  const labels = Object.keys(categoryData);
  const data = Object.values(categoryData);
  
  AppState.charts.category.data.labels = labels;
  AppState.charts.category.data.datasets[0].data = data;
  AppState.charts.category.update();
  
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];
  const legend = document.getElementById('categoryLegend');
  if (legend) {
    legend.innerHTML = labels.map((label, i) => `
      <div class="legend-item">
        <div class="legend-color" style="background: ${colors[i % colors.length]}"></div>
        <span>${label}</span>
      </div>
    `).join('');
  }
};

const updateTrendChart = () => {
  if (!AppState.charts.trend) return;
  
  const monthlyData = {};
  AppState.transactions.forEach(t => {
    const date = new Date(t.date);
    const key = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    
    if (!monthlyData[key]) {
      monthlyData[key] = 0;
    }
    monthlyData[key] += t.type === 'income' ? t.amount : -t.amount;
  });
  
  const labels = Object.keys(monthlyData).slice(-6);
  const data = labels.map(l => monthlyData[l]);
  const colors = data.map(v => v >= 0 ? '#10b981' : '#ef4444');
  
  AppState.charts.trend.data.labels = labels;
  AppState.charts.trend.data.datasets[0].data = data;
  AppState.charts.trend.data.datasets[0].backgroundColor = colors;
  AppState.charts.trend.update();
};

// ========================================
// UI UPDATES
// ========================================
const updateDashboard = () => {
  const income = calculateTotalIncome();
  const expense = calculateTotalExpense();
  const balance = calculateBalance();
  const savingsRate = getSavingsRate();
  
  document.getElementById('totalIncome').textContent = formatCurrency(income);
  document.getElementById('totalExpense').textContent = formatCurrency(expense);
  document.getElementById('currentBalance').textContent = formatCurrency(balance);
  document.getElementById('savingsRate').textContent = savingsRate.toFixed(0) + '%';
  
  const maxVal = Math.max(income, expense, 1);
  document.getElementById('incomeProgress').style.width = `${(income / maxVal) * 100}%`;
  document.getElementById('expenseProgress').style.width = `${(expense / maxVal) * 100}%`;
  document.getElementById('balanceProgress').style.width = `${Math.min(Math.abs(balance) / maxVal * 100, 100)}%`;
  document.getElementById('savingsProgress').style.width = `${Math.min(savingsRate, 100)}%`;
  
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpense = getMonthlyExpense();
  document.getElementById('incomeChange').textContent = `+${formatCurrency(monthlyIncome)} bulan ini`;
  document.getElementById('expenseChange').textContent = `+${formatCurrency(monthlyExpense)} bulan ini`;
  
  const savingsChange = document.getElementById('savingsChange');
  if (savingsRate >= 20) {
    savingsChange.innerHTML = '<i class="fas fa-arrow-up"></i><span>Sangat baik!</span>';
    savingsChange.className = 'stat-change positive';
  } else if (savingsRate >= 10) {
    savingsChange.innerHTML = '<i class="fas fa-minus"></i><span>Cukup baik</span>';
    savingsChange.className = 'stat-change neutral';
  } else {
    savingsChange.innerHTML = '<i class="fas fa-arrow-down"></i><span>Perlu perbaikan</span>';
    savingsChange.className = 'stat-change negative';
  }
  
  updateRecentTransactions();
  updateCharts();
};

const updateRecentTransactions = () => {
  const container = document.getElementById('recentTransactions');
  const recent = [...AppState.transactions].slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-receipt"></i></div>
        <p>Belum ada transaksi</p>
        <span>Tambahkan transaksi pertamamu!</span>
      </div>
    `;
    return;
  }
  
  container.innerHTML = recent.map(t => `
    <div class="transaction-card">
      <div class="transaction-icon ${t.type}">
        <i class="fas fa-${t.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
      </div>
      <div class="transaction-details">
        <div class="transaction-title">${t.description}</div>
        <div class="transaction-meta">
          <span class="transaction-category">${t.category}</span>
          <span>${formatDate(t.date)}</span>
        </div>
      </div>
      <div class="transaction-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </div>
      <div class="transaction-xp">
        <i class="fas fa-star"></i> +${t.xp}
      </div>
    </div>
  `).join('');
};

const updateTransactionsTable = () => {
  const tbody = document.getElementById('transactionsBody');
  const mobile = document.getElementById('transactionsMobile');
  
  document.getElementById('transactionBadge').textContent = AppState.transactions.length;
  
  tbody.innerHTML = AppState.transactions.map(t => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td>${t.description}</td>
      <td><span class="category-badge">${t.category}</span></td>
      <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td><span class="xp-badge"><i class="fas fa-star"></i> +${t.xp}</span></td>
      <td>
        <button class="action-btn" onclick="deleteTransaction('${t.id}')">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  mobile.innerHTML = AppState.transactions.map(t => `
    <div class="transaction-mobile-card">
      <div class="transaction-icon ${t.type}">
        <i class="fas fa-${t.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
      </div>
      <div class="transaction-details">
        <div class="transaction-title">${t.description}</div>
        <div class="transaction-meta">
          <span class="transaction-category">${t.category}</span>
          <span>${formatDate(t.date)}</span>
        </div>
      </div>
      <div class="transaction-amount ${t.type}">
        ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
      </div>
    </div>
  `).join('');
};

const updateGoalsUI = () => {
  const grid = document.getElementById('goalsGrid');
  
  if (AppState.goals.length === 0) {
    grid.innerHTML = `
      <div class="empty-state goals-empty">
        <div class="empty-icon"><i class="fas fa-bullseye"></i></div>
        <p>Belum ada target keuangan</p>
        <span>Buat target untuk memulai perjalanan finansialmu!</span>
      </div>
    `;
    updateAIAdvice();
    return;
  }
  
  grid.innerHTML = AppState.goals.map(goal => {
    const progress = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
    const daysLeft = Math.ceil((new Date(goal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    const isCompleted = goal.savedAmount >= goal.targetAmount;
    
    return `
      <div class="goal-card ${isCompleted ? 'completed' : ''}">
        <div class="goal-header">
          <div class="goal-icon">${goal.icon}</div>
          <div class="goal-info">
            <div class="goal-name">${goal.name}</div>
            <div class="goal-deadline">
              <i class="fas fa-calendar"></i> ${daysLeft > 0 ? daysLeft + ' hari lagi' : 'Deadline terlewat'}
            </div>
          </div>
        </div>
        <div class="goal-amount">
          <span class="goal-current">${formatCurrency(goal.savedAmount)}</span>
          <span class="goal-target">dari ${formatCurrency(goal.targetAmount)}</span>
        </div>
        <div class="goal-progress">
          <div class="goal-progress-bar">
            <div class="goal-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="goal-progress-text">
            <span>${progress.toFixed(0)}% tercapai</span>
            <span>${formatCurrency(goal.targetAmount - goal.savedAmount)} lagi</span>
          </div>
        </div>
        <div class="goal-actions">
          <button class="btn-add" onclick="addToGoal('${goal.id}', 50000)">+ Rp50.000</button>
          <button class="btn-add" onclick="addToGoal('${goal.id}', 100000)">+ Rp100.000</button>
          <button onclick="deleteGoal('${goal.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
  
  updateAIAdvice();
};

const updateAIAdvice = () => {
  const adviceEl = document.getElementById('aiAdvice');
  const balance = calculateBalance();
  const savingsRate = getSavingsRate();
  const monthlyExpense = getMonthlyExpense();
  
  if (AppState.goals.length === 0) {
    adviceEl.textContent = 'Buat target keuangan pertamamu untuk mendapatkan rekomendasi personal. Target membantumu fokus pada prioritas finansial.';
    return;
  }
  
  if (AppState.transactions.length === 0) {
    adviceEl.textContent = 'Tambahkan transaksi untuk melihat analisis keuanganmu. Semakin banyak data, semakin akurat rekomendasinya!';
    return;
  }
  
  let advice = [];
  
  if (savingsRate >= 30) {
    advice.push('🌟 Luar biasa! Kamu menghemat ' + savingsRate.toFixed(0) + '% dari pendapatan. Pertahankan kebiasaan baik ini!');
  } else if (savingsRate >= 20) {
    advice.push('👍 Bagus! Tingkat tabunganmu ' + savingsRate.toFixed(0) + '%. Coba tingkatkan ke 30% untuk hasil maksimal.');
  } else if (savingsRate >= 10) {
    advice.push('💡 Tingkat tabunganmu ' + savingsRate.toFixed(0) + '%. Ada ruang untuk meningkatkan tabungan. Coba kurangi pengeluaran tidak penting.');
  } else {
    advice.push('⚠️ Tingkat tabunganmu di bawah 10%. Perhatikan pengeluaranmu dan buat anggaran untuk meningkatkan tabungan.');
  }
  
  const activeGoals = AppState.goals.filter(g => g.savedAmount < g.targetAmount);
  if (activeGoals.length > 0) {
    const nearestGoal = activeGoals.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))[0];
    const daysLeft = Math.ceil((new Date(nearestGoal.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
    const amountNeeded = nearestGoal.targetAmount - nearestGoal.savedAmount;
    const dailyTarget = daysLeft > 0 ? Math.ceil(amountNeeded / daysLeft) : amountNeeded;
    
    advice.push(`🎯 Untuk target "${nearestGoal.name}", sisihkan ${formatCurrency(dailyTarget)} per hari untuk mencapainya tepat waktu.`);
  }
  
  if (monthlyExpense > calculateTotalIncome() * 0.8) {
    advice.push('📊 Pengeluaran bulananmu mendekati 80% dari pendapatan. Pertimbangkan untuk mengurangi pengeluaran atau mencari sumber pendapatan tambahan.');
  }
  
  adviceEl.innerHTML = advice.join('<br><br>');
};

const updateAnalytics = () => {
  document.getElementById('monthlyIncome').textContent = formatCurrency(getMonthlyIncome());
  document.getElementById('monthlyExpense').textContent = formatCurrency(getMonthlyExpense());
  document.getElementById('monthlyNet').textContent = formatCurrency(getMonthlyIncome() - getMonthlyExpense());
  
  const categoryData = getCategoryData();
  const sortedCategories = Object.entries(categoryData).sort((a, b) => b[1] - a[1]).slice(0, 5);
  
  const topCategoriesEl = document.getElementById('topCategories');
  if (sortedCategories.length === 0) {
    topCategoriesEl.innerHTML = '<div class="empty-state mini"><p>Belum ada data</p></div>';
  } else {
    topCategoriesEl.innerHTML = sortedCategories.map(([name, amount], i) => `
      <div class="top-category-item">
        <div class="top-category-rank">${i + 1}</div>
        <div class="top-category-name">${name}</div>
        <div class="top-category-amount">${formatCurrency(amount)}</div>
      </div>
    `).join('');
  }
};

// ========================================
// ACTIONS
// ========================================
const addTransaction = async (e) => {
  e.preventDefault();
  
  const type = document.querySelector('input[name="transactionType"]:checked').value;
  const amount = parseFloat(document.getElementById('transactionAmount').value);
  const description = document.getElementById('transactionDescription').value;
  const category = type === 'income' ? 'Pendapatan' : document.getElementById('transactionCategory').value;
  const date = document.getElementById('transactionDate').value;
  
  if (!amount || amount <= 0) {
    showNotification('Jumlah harus lebih dari 0', 'error');
    return;
  }
  
  const xp = calculateXp(amount);
  const transaction = {
    id: generateId(),
    type,
    amount,
    description,
    category,
    date,
    xp
  };
  
  AppState.transactions.unshift(transaction);
  await saveTransaction(transaction);
  
  addXp(xp);
  updateDashboard();
  closeModal('transactionModal');
  
  showNotification(`Transaksi berhasil ditambahkan! +${xp} XP`, 'xp');
  
  document.getElementById('transactionForm').reset();
  document.getElementById('transactionDate').value = getToday();
};

const deleteTransaction = async (id) => {
  if (confirm('Yakin ingin menghapus transaksi ini?')) {
    AppState.transactions = AppState.transactions.filter(t => t.id !== id);
    await deleteTransactionFromDB(id);
    updateDashboard();
    updateTransactionsTable();
    showNotification('Transaksi berhasil dihapus', 'success');
  }
};

const addGoal = async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('goalName').value;
  const targetAmount = parseFloat(document.getElementById('goalAmount').value);
  const savedAmount = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const targetDate = document.getElementById('goalDate').value;
  const icon = document.querySelector('.icon-option.active')?.dataset.icon || '🎯';
  
  if (!targetAmount || targetAmount <= 0) {
    showNotification('Jumlah target harus lebih dari 0', 'error');
    return;
  }
  
  if (new Date(targetDate) <= new Date()) {
    showNotification('Tanggal target harus di masa depan', 'error');
    return;
  }
  
  const goal = {
    id: generateId(),
    name,
    targetAmount,
    savedAmount,
    targetDate,
    icon
  };
  
  AppState.goals.push(goal);
  await saveGoal(goal);
  
  addXp(10);
  updateGoalsUI();
  closeModal('goalModal');
  showNotification('Target keuangan berhasil dibuat! +10 XP', 'success');
  
  document.getElementById('goalForm').reset();
  document.getElementById('goalDate').value = getToday();
};

const addToGoal = async (goalId, amount) => {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (goal) {
    goal.savedAmount = Math.min(goal.savedAmount + amount, goal.targetAmount);
    await saveGoal(goal);
    updateGoalsUI();
    addXp(5);
    showNotification(`Berhasil menambahkan ${formatCurrency(amount)} ke target!`, 'success');
    
    if (goal.savedAmount >= goal.targetAmount) {
      showNotification(`🎉 Selamat! Target "${goal.name}" telah tercapai!`, 'success', 'Target Tercapai!');
      addXp(50);
    }
  }
};

const deleteGoal = async (id) => {
  if (confirm('Yakin ingin menghapus target ini?')) {
    AppState.goals = AppState.goals.filter(g => g.id !== id);
    await deleteGoalFromDB(id);
    updateGoalsUI();
    showNotification('Target berhasil dihapus', 'success');
  }
};

// ========================================
// MODAL HANDLING
// ========================================
const openModal = (modalId) => {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
};

const closeModal = (modalId) => {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
};

// ========================================
// NAVIGATION
// ========================================
const navigateTo = (section) => {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-section="${section}"]`)?.closest('.nav-item')?.classList.add('active');
  
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  document.getElementById(section + 'Section')?.classList.add('active');
  
  const titles = {
    dashboard: 'Dashboard',
    transactions: 'Riwayat Transaksi',
    goals: 'Target Keuangan',
    achievements: 'Prestasi',
    analytics: 'Analisis Keuangan'
  };
  
  document.getElementById('pageTitle').textContent = titles[section];
  document.getElementById('breadcrumbPage').textContent = titles[section];
  
  if (section === 'transactions') updateTransactionsTable();
  if (section === 'goals') updateGoalsUI();
  if (section === 'achievements') updateAchievementsUI();
  if (section === 'analytics') updateAnalytics();
  
  document.getElementById('sidebar').classList.remove('open');
};

// ========================================
// AUTHENTICATION
// ========================================
const handleLogin = async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner"></i> Masuk...';
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    document.getElementById('loginSuccess').classList.add('show');
    document.getElementById('loginError').classList.remove('show');
    
    await initializeUser(user);
  } catch (error) {
    console.error('Login error:', error);
    document.getElementById('loginError').classList.add('show');
    document.getElementById('loginSuccess').classList.remove('show');
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const registerBtn = document.getElementById('registerBtn');
  const errorEl = document.getElementById('registerError');
  
  if (password !== confirmPassword) {
    errorEl.querySelector('span').textContent = 'Kata sandi tidak cocok';
    errorEl.classList.add('show');
    return;
  }
  
  if (password.length < 6) {
    errorEl.querySelector('span').textContent = 'Kata sandi minimal 6 karakter';
    errorEl.classList.add('show');
    return;
  }
  
  registerBtn.disabled = true;
  registerBtn.innerHTML = '<i class="fas fa-spinner"></i> Mendaftar...';
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Save user profile
    await db.collection('users').doc(user.uid).set({
      name: name,
      email: email,
      level: 1,
      xp: 0,
      maxXp: 100,
      streak: 1,
      lastLogin: new Date().toISOString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    showNotification('Akun berhasil dibuat! Selamat datang!', 'success');
    await initializeUser(user);
  } catch (error) {
    console.error('Register error:', error);
    errorEl.querySelector('span').textContent = getAuthErrorMessage(error.code);
    errorEl.classList.add('show');
    registerBtn.disabled = false;
    registerBtn.innerHTML = '<span>Daftar</span><i class="fas fa-user-plus"></i>';
  }
};

const getAuthErrorMessage = (code) => {
  const messages = {
    'auth/email-already-in-use': 'Email sudah terdaftar',
    'auth/invalid-email': 'Email tidak valid',
    'auth/weak-password': 'Kata sandi terlalu lemah',
    'auth/user-not-found': 'Email tidak ditemukan',
    'auth/wrong-password': 'Kata sandi salah',
    'auth/invalid-credential': 'Email atau kata sandi salah'
  };
  return messages[code] || 'Terjadi kesalahan. Coba lagi.';
};

const initializeUser = async (user) => {
  document.getElementById('loadingScreen').classList.add('active');
  
  AppState.user.uid = user.uid;
  AppState.user.email = user.email;
  
  await loadUserData(user.uid);
  
  // Update UI with user data
  document.getElementById('displayUserName').textContent = AppState.user.name || 'User';
  document.getElementById('userAvatar').innerHTML = `<span>${(AppState.user.name || 'U').charAt(0).toUpperCase()}</span>`;
  
  // Check streak
  const today = new Date().toDateString();
  const lastLogin = AppState.user.lastLogin;
  
  if (lastLogin) {
    const lastDate = new Date(lastLogin);
    const diffDays = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      AppState.user.streak++;
      showNotification(`🔥 Streak ${AppState.user.streak} hari! Pertahankan!`, 'success');
      addXp(AppState.user.streak * 5);
    } else if (diffDays > 1) {
      AppState.user.streak = 1;
      showNotification('Streak reset. Ayo mulai lagi!', 'info');
    }
  } else {
    AppState.user.streak = 1;
  }
  
  AppState.user.lastLogin = new Date().toISOString();
  await saveUserData();
  
  // Setup real-time listeners
  setupRealtimeListeners();
  
  // Show app
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.add('show');
    
    updateXpDisplay();
    updateDashboard();
    initCharts();
    updateAchievementsUI();
    
    showNotification('Selamat datang kembali, ' + (AppState.user.name || 'User') + '!', 'success');
  }, 1500);
};

const handleLogout = async () => {
  if (confirm('Yakin ingin keluar?')) {
    try {
      await auth.signOut();
      
      // Reset state
      AppState.user = {
        uid: null,
        name: '',
        email: '',
        level: 1,
        xp: 0,
        maxXp: 100,
        streak: 0,
        lastLogin: null,
        createdAt: null
      };
      AppState.transactions = [];
      AppState.goals = [];
      
      // Reset UI
      document.getElementById('appContainer').classList.remove('show');
      document.getElementById('loginContainer').classList.remove('hidden');
      document.getElementById('loginForm').reset();
      document.getElementById('loginBtn').disabled = false;
      document.getElementById('loginBtn').innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
      
      showNotification('Berhasil keluar', 'success');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Set default dates
  document.getElementById('transactionDate').value = getToday();
  document.getElementById('goalDate').value = getToday();
  
  // Auth state listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      console.log('User is signed in:', user.email);
    } else {
      // User is signed out
      console.log('User is signed out');
    }
  });
  
  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  
  // Register form
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  
  // Toggle password visibility
  document.getElementById('toggleLoginPassword').addEventListener('click', function() {
    const input = document.getElementById('loginPassword');
    const icon = this.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
  
  document.getElementById('toggleRegisterPassword').addEventListener('click', function() {
    const input = document.getElementById('registerPassword');
    const icon = this.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
  });
  
  // Toggle login/register forms
  document.getElementById('toggleFormBtn').addEventListener('click', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleText = document.getElementById('toggleText');
    const toggleBtn = document.getElementById('toggleFormBtn');
    
    if (loginForm.style.display === 'none') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      toggleText.textContent = 'Belum punya akun?';
      toggleBtn.textContent = 'Daftar sekarang';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      toggleText.textContent = 'Sudah punya akun?';
      toggleBtn.textContent = 'Masuk sekarang';
    }
  });
  
  // Transaction form
  document.getElementById('transactionForm').addEventListener('submit', addTransaction);
  
  // Goal form
  document.getElementById('goalForm').addEventListener('submit', addGoal);
  
  // Modal controls
  document.getElementById('fab').addEventListener('click', () => openModal('transactionModal'));
  document.getElementById('addTransactionBtn').addEventListener('click', () => openModal('transactionModal'));
  document.getElementById('addGoalBtn').addEventListener('click', () => openModal('goalModal'));
  
  document.getElementById('closeTransactionModal').addEventListener('click', () => closeModal('transactionModal'));
  document.getElementById('closeGoalModal').addEventListener('click', () => closeModal('goalModal'));
  document.getElementById('closeLevelUp').addEventListener('click', () => closeModal('levelUpModal'));
  
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function() {
      this.closest('.modal').classList.remove('active');
      document.body.style.overflow = '';
    });
  });
  
  // Navigation
  document.querySelectorAll('.nav-item a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });
  
  document.querySelectorAll('.view-all').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo(link.dataset.section);
    });
  });
  
  // Sidebar toggle
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  
  // Transaction type change
  document.querySelectorAll('input[name="transactionType"]').forEach(radio => {
    radio.addEventListener('change', function() {
      document.getElementById('categoryGroup').style.display = 
        this.value === 'expense' ? 'block' : 'none';
    });
  });
  
  // Icon selector
  document.querySelectorAll('.icon-option').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  // Chart filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      updateMainChart(this.dataset.period);
    });
  });
  
  // Search and filter
  document.getElementById('searchTransaction')?.addEventListener('input', function() {
    const search = this.value.toLowerCase();
    const rows = document.querySelectorAll('#transactionsBody tr');
    rows.forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none';
    });
  });
  
  const applyFilters = () => {
    const typeFilter = document.getElementById('filterType')?.value;
    const categoryFilter = document.getElementById('filterCategory')?.value;
    
    let filtered = [...AppState.transactions];
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = filtered.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description}</td>
        <td><span class="category-badge">${t.category}</span></td>
        <td class="amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
        <td><span class="xp-badge"><i class="fas fa-star"></i> +${t.xp}</span></td>
        <td>
          <button class="action-btn" onclick="deleteTransaction('${t.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
  };
  
  document.getElementById('filterType')?.addEventListener('change', applyFilters);
  document.getElementById('filterCategory')?.addEventListener('change', applyFilters);
  
  // Populate category filter
  const categories = ['Makanan', 'Transportasi', 'Tempat Tinggal', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Belanja', 'Lainnya'];
  const categorySelect = document.getElementById('filterCategory');
  if (categorySelect) {
    categories.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat;
      option.textContent = cat;
      categorySelect.appendChild(option);
    });
  }
  
  // Online/offline detection
  window.addEventListener('online', () => {
    AppState.isOnline = true;
    updateSyncStatus('synced');
    showNotification('Koneksi internet kembali', 'success');
  });
  
  window.addEventListener('offline', () => {
    AppState.isOnline = false;
    updateSyncStatus('offline');
    showNotification('Kamu offline. Data akan disinkron saat online.', 'info');
  });
});

// Make functions globally accessible
window.deleteTransaction = deleteTransaction;
window.addToGoal = addToGoal;
window.deleteGoal = deleteGoal;
