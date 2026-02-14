/**
 * FinanceQuest - Finance Manager
 * LocalStorage-based with Export/Import for multi-device support
 */

// ========================================
// STATE MANAGEMENT
// ========================================
const AppState = {
  currentUser: null,
  users: {},
  user: {
    name: '',
    username: '',
    level: 1,
    xp: 0,
    maxXp: 100,
    streak: 0,
    lastLogin: null
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
  }
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
// LOCAL STORAGE
// ========================================
const saveData = () => {
  if (!AppState.currentUser) return;
  
  const data = {
    user: AppState.user,
    transactions: AppState.transactions,
    goals: AppState.goals,
    achievements: AppState.achievements
  };
  
  localStorage.setItem(`financeQuest_${AppState.currentUser}`, JSON.stringify(data));
  localStorage.setItem('financeQuest_users', JSON.stringify(AppState.users));
};

const loadData = () => {
  // Load users
  const savedUsers = localStorage.getItem('financeQuest_users');
  if (savedUsers) {
    AppState.users = JSON.parse(savedUsers);
  }
};

const loadUserData = (username) => {
  const saved = localStorage.getItem(`financeQuest_${username}`);
  if (saved) {
    const data = JSON.parse(saved);
    AppState.user = data.user || AppState.user;
    AppState.transactions = data.transactions || [];
    AppState.goals = data.goals || [];
    if (data.achievements) {
      AppState.achievements = data.achievements;
    }
  }
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
// XP & LEVEL SYSTEM
// ========================================
const addXp = (amount) => {
  AppState.user.xp += amount;
  
  while (AppState.user.xp >= AppState.user.maxXp) {
    AppState.user.xp -= AppState.user.maxXp;
    AppState.user.level++;
    AppState.user.maxXp = Math.floor(AppState.user.maxXp * 1.5);
    showLevelUpModal();
  }
  
  updateXpDisplay();
  saveData();
};

const showLevelUpModal = () => {
  const modal = document.getElementById('levelUpModal');
  document.getElementById('newLevel').textContent = AppState.user.level;
  modal.classList.add('active');
  
  setTimeout(() => {
    AppState.user.xp += 50;
    updateXpDisplay();
    saveData();
  }, 500);
};

const updateXpDisplay = () => {
  document.getElementById('sidebarLevel').textContent = AppState.user.level;
  document.getElementById('headerLevel').textContent = AppState.user.level;
  document.getElementById('currentXP').textContent = AppState.user.xp;
  document.getElementById('maxXP').textContent = AppState.user.maxXp;
  document.getElementById('xpFill').style.width = `${(AppState.user.xp / AppState.user.maxXp) * 100}%`;
  document.getElementById('streakCount').textContent = AppState.user.streak;
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

const updateSettingsUI = () => {
  document.getElementById('settingsUserName').textContent = AppState.user.name || 'User';
  document.getElementById('settingsLevel').textContent = AppState.user.level;
  document.getElementById('settingsAvatar').textContent = (AppState.user.name || 'U').charAt(0).toUpperCase();
};

// ========================================
// ACTIONS
// ========================================
const addTransaction = (e) => {
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
  saveData();
  
  addXp(xp);
  updateDashboard();
  closeModal('transactionModal');
  
  showNotification(`Transaksi berhasil ditambahkan! +${xp} XP`, 'xp');
  
  document.getElementById('transactionForm').reset();
  document.getElementById('transactionDate').value = getToday();
  
  checkAchievements();
};

const deleteTransaction = (id) => {
  if (confirm('Yakin ingin menghapus transaksi ini?')) {
    AppState.transactions = AppState.transactions.filter(t => t.id !== id);
    saveData();
    updateDashboard();
    updateTransactionsTable();
    showNotification('Transaksi berhasil dihapus', 'success');
  }
};

const addGoal = (e) => {
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
  saveData();
  
  addXp(10);
  updateGoalsUI();
  closeModal('goalModal');
  showNotification('Target keuangan berhasil dibuat! +10 XP', 'success');
  
  document.getElementById('goalForm').reset();
  document.getElementById('goalDate').value = getToday();
  
  checkAchievements();
};

const addToGoal = (goalId, amount) => {
  const goal = AppState.goals.find(g => g.id === goalId);
  if (goal) {
    goal.savedAmount = Math.min(goal.savedAmount + amount, goal.targetAmount);
    saveData();
    updateGoalsUI();
    addXp(5);
    showNotification(`Berhasil menambahkan ${formatCurrency(amount)} ke target!`, 'success');
    
    if (goal.savedAmount >= goal.targetAmount) {
      showNotification(`🎉 Selamat! Target "${goal.name}" telah tercapai!`, 'success', 'Target Tercapai!');
      addXp(50);
      checkAchievements();
    }
  }
};

const deleteGoal = (id) => {
  if (confirm('Yakin ingin menghapus target ini?')) {
    AppState.goals = AppState.goals.filter(g => g.id !== id);
    saveData();
    updateGoalsUI();
    showNotification('Target berhasil dihapus', 'success');
  }
};

// ========================================
// EXPORT/IMPORT
// ========================================
const exportData = () => {
  const data = {
    user: AppState.user,
    transactions: AppState.transactions,
    goals: AppState.goals,
    achievements: AppState.achievements,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const dataStr = JSON.stringify(data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `financequest_backup_${AppState.user.username}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showNotification('Data berhasil diexport! Simpan file ini dengan aman.', 'success');
};

const importData = (file) => {
  const reader = new FileReader();
  
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (!data.user || !data.transactions || !data.goals) {
        showNotification('File tidak valid!', 'error');
        return;
      }
      
      if (confirm('Ini akan mengganti semua data saat ini. Lanjutkan?')) {
        AppState.user = { ...data.user, username: AppState.user.username };
        AppState.transactions = data.transactions || [];
        AppState.goals = data.goals || [];
        if (data.achievements) {
          AppState.achievements = data.achievements;
        }
        
        saveData();
        updateAllUI();
        showNotification('Data berhasil dipulihkan!', 'success');
      }
    } catch (error) {
      console.error('Import error:', error);
      showNotification('Gagal membaca file. Pastikan format JSON benar.', 'error');
    }
  };
  
  reader.readAsText(file);
};

const resetAllData = () => {
  if (confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA data kamu! Tindakan ini tidak bisa dibatalkan. Lanjutkan?')) {
    if (confirm('Yakin benar? Semua transaksi, target, dan progress akan hilang.')) {
      AppState.transactions = [];
      AppState.goals = [];
      AppState.user.level = 1;
      AppState.user.xp = 0;
      AppState.user.maxXp = 100;
      AppState.user.streak = 1;
      AppState.achievements.forEach(a => a.earned = false);
      
      saveData();
      updateAllUI();
      showNotification('Semua data telah direset.', 'info');
    }
  }
};

const updateAllUI = () => {
  updateXpDisplay();
  updateDashboard();
  updateTransactionsTable();
  updateGoalsUI();
  updateAchievementsUI();
  updateAnalytics();
  updateSettingsUI();
  updateCharts();
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
    analytics: 'Analisis Keuangan',
    settings: 'Pengaturan'
  };
  
  document.getElementById('pageTitle').textContent = titles[section];
  document.getElementById('breadcrumbPage').textContent = titles[section];
  
  if (section === 'transactions') updateTransactionsTable();
  if (section === 'goals') updateGoalsUI();
  if (section === 'achievements') updateAchievementsUI();
  if (section === 'analytics') updateAnalytics();
  if (section === 'settings') updateSettingsUI();
  
  document.getElementById('sidebar').classList.remove('open');
};

// ========================================
// AUTHENTICATION
// ========================================
const handleLogin = (e) => {
  e.preventDefault();
  
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const loginBtn = document.getElementById('loginBtn');
  
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<i class="fas fa-spinner"></i> Masuk...';
  
  setTimeout(() => {
    if (AppState.users[username] && AppState.users[username].password === password) {
      AppState.currentUser = username;
      loadUserData(username);
      
      document.getElementById('loginSuccess').classList.add('show');
      document.getElementById('loginError').classList.remove('show');
      
      initializeApp();
    } else {
      document.getElementById('loginError').classList.add('show');
      document.getElementById('loginSuccess').classList.remove('show');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
    }
  }, 500);
};

const handleRegister = (e) => {
  e.preventDefault();
  
  const name = document.getElementById('registerName').value.trim();
  const username = document.getElementById('registerUsername').value.trim().toLowerCase();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const registerBtn = document.getElementById('registerBtn');
  const errorEl = document.getElementById('registerError');
  
  if (password !== confirmPassword) {
    errorEl.querySelector('span').textContent = 'Kata sandi tidak cocok';
    errorEl.classList.add('show');
    return;
  }
  
  if (password.length < 4) {
    errorEl.querySelector('span').textContent = 'Kata sandi minimal 4 karakter';
    errorEl.classList.add('show');
    return;
  }
  
  if (AppState.users[username]) {
    errorEl.querySelector('span').textContent = 'Nama pengguna sudah terdaftar';
    errorEl.classList.add('show');
    return;
  }
  
  registerBtn.disabled = true;
  registerBtn.innerHTML = '<i class="fas fa-spinner"></i> Mendaftar...';
  
  setTimeout(() => {
    // Create new user
    AppState.users[username] = {
      password: password,
      createdAt: new Date().toISOString()
    };
    
    // Initialize user data
    AppState.currentUser = username;
    AppState.user = {
      name: name,
      username: username,
      level: 1,
      xp: 0,
      maxXp: 100,
      streak: 1,
      lastLogin: new Date().toISOString()
    };
    AppState.transactions = [];
    AppState.goals = [];
    
    saveData();
    
    showNotification('Akun berhasil dibuat! Selamat datang!', 'success');
    initializeApp();
  }, 500);
};

const initializeApp = () => {
  document.getElementById('loadingScreen').classList.add('active');
  
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
  saveData();
  
  // Update UI
  document.getElementById('displayUserName').textContent = AppState.user.name || 'User';
  document.getElementById('userAvatar').innerHTML = `<span>${(AppState.user.name || 'U').charAt(0).toUpperCase()}</span>`;
  
  setTimeout(() => {
    document.getElementById('loadingScreen').classList.remove('active');
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('appContainer').classList.add('show');
    
    updateXpDisplay();
    updateDashboard();
    initCharts();
    updateAchievementsUI();
    
    showNotification('Selamat datang kembali, ' + (AppState.user.name || 'User') + '!', 'success');
  }, 1000);
};

const handleLogout = () => {
  if (confirm('Yakin ingin keluar?')) {
    AppState.currentUser = null;
    
    document.getElementById('appContainer').classList.remove('show');
    document.getElementById('loginContainer').classList.remove('hidden');
    document.getElementById('loginForm').reset();
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').innerHTML = '<span>Masuk</span><i class="fas fa-arrow-right"></i>';
    document.getElementById('loginSuccess').classList.remove('show');
    document.getElementById('loginError').classList.remove('show');
    
    showNotification('Berhasil keluar', 'success');
  }
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load saved data
  loadData();
  
  // Set default dates
  document.getElementById('transactionDate').value = getToday();
  document.getElementById('goalDate').value = getToday();
  
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
  
  // Settings - Export/Import/Reset
  document.getElementById('exportBtn').addEventListener('click', exportData);
  
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      importData(e.target.files[0]);
      e.target.value = '';
    }
  });
  
  document.getElementById('resetBtn').addEventListener('click', resetAllData);
});

// Make functions globally accessible
window.deleteTransaction = deleteTransaction;
window.addToGoal = addToGoal;
window.deleteGoal = deleteGoal;
