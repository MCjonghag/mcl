/**
 * 자동차 부품 재고 관리 시스템 - 대시보드 JavaScript 파일
 */

/**
 * 대시보드 모듈
 */

// 대시보드 데이터 관리
const dashboardManager = {
  data: {
    inventory: [],
    inbound: [],
    outbound: [],
    clients: [],
    suppliers: [],
  },

  // 데이터 초기화
  init() {
    this.loadData();
    this.updateDashboard();
    this.setupEventListeners();
  },

  // 데이터 로드
  loadData() {
    this.data.inventory = app.utils.storage.get('inventoryData') || [];
    this.data.inbound = app.utils.storage.get('inboundData') || [];
    this.data.outbound = app.utils.storage.get('outboundData') || [];
    this.data.clients = app.utils.storage.get('clientData') || [];
    this.data.suppliers = app.utils.storage.get('supplierData') || [];
  },

  // 대시보드 업데이트
  updateDashboard() {
    this.updateSummaryCards();
    this.updateInventoryStatus();
    this.updateRecentActivities();
    this.updateCharts();
  },

  // 요약 카드 업데이트
  updateSummaryCards() {
    // 재고 현황
    const totalItems = this.data.inventory.length;
    const lowStockItems = this.data.inventory.filter(
      (item) => item.currentStock <= item.minStock
    ).length;
    const outOfStockItems = this.data.inventory.filter(
      (item) => item.currentStock === 0
    ).length;

    // 거래 현황
    const totalClients = this.data.clients.length;
    const totalSuppliers = this.data.suppliers.length;
    const recentInbound = this.data.inbound.length;
    const recentOutbound = this.data.outbound.length;

    // 카드 업데이트
    document.getElementById('total-items').textContent =
      app.utils.formatNumber(totalItems);
    document.getElementById('low-stock-items').textContent =
      app.utils.formatNumber(lowStockItems);
    document.getElementById('out-of-stock-items').textContent =
      app.utils.formatNumber(outOfStockItems);
    document.getElementById('total-clients').textContent =
      app.utils.formatNumber(totalClients);
    document.getElementById('total-suppliers').textContent =
      app.utils.formatNumber(totalSuppliers);
    document.getElementById('recent-inbound').textContent =
      app.utils.formatNumber(recentInbound);
    document.getElementById('recent-outbound').textContent =
      app.utils.formatNumber(recentOutbound);
  },

  // 재고 현황 업데이트
  updateInventoryStatus() {
    const table = document.getElementById('inventory-status-table');
    if (!table) return;

    // 테이블 초기화
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    // 재고 현황 데이터 정렬 (재고량 기준)
    const sortedInventory = [...this.data.inventory].sort(
      (a, b) => a.currentStock - b.currentStock
    );

    // 상위 5개 항목만 표시
    sortedInventory.slice(0, 5).forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${app.utils.formatNumber(item.currentStock)}</td>
                <td>${item.unit}</td>
                <td class="${
                  item.currentStock <= item.minStock ? 'text-danger' : ''
                }">
                    ${app.utils.formatNumber(item.minStock)}
                </td>
            `;
      tbody.appendChild(row);
    });
  },

  // 최근 활동 업데이트
  updateRecentActivities() {
    const table = document.getElementById('recent-activities-table');
    if (!table) return;

    // 테이블 초기화
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    // 모든 활동 데이터 수집 및 정렬
    const activities = [
      ...this.data.inbound.map((item) => ({
        type: 'inbound',
        date: item.date,
        description: `${item.supplier} - ${
          item.itemName
        } (${app.utils.formatNumber(item.quantity)} ${item.unit})`,
      })),
      ...this.data.outbound.map((item) => ({
        type: 'outbound',
        date: item.date,
        description: `${item.client} - ${
          item.itemName
        } (${app.utils.formatNumber(item.quantity)} ${item.unit})`,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    // 최근 5개 활동만 표시
    activities.slice(0, 5).forEach((activity) => {
      const row = document.createElement('tr');
      row.innerHTML = `
                <td>${activity.date}</td>
                <td>${activity.type === 'inbound' ? '입고' : '출고'}</td>
                <td>${activity.description}</td>
            `;
      tbody.appendChild(row);
    });
  },

  // 차트 업데이트
  updateCharts() {
    this.updateInventoryChart();
    this.updateTransactionChart();
  },

  // 재고 차트 업데이트
  updateInventoryChart() {
    const ctx = document.getElementById('inventory-chart');
    if (!ctx) return;

    // 카테고리별 재고 현황 집계
    const categoryData = this.data.inventory.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.currentStock;
      return acc;
    }, {});

    // 차트 데이터 준비
    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    // 차트 생성
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  },

  // 거래 차트 업데이트
  updateTransactionChart() {
    const ctx = document.getElementById('transaction-chart');
    if (!ctx) return;

    // 최근 7일간의 입출고 현황 집계
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return app.utils.formatDate(date);
    }).reverse();

    const inboundData = dates.map(
      (date) => this.data.inbound.filter((item) => item.date === date).length
    );

    const outboundData = dates.map(
      (date) => this.data.outbound.filter((item) => item.date === date).length
    );

    // 차트 생성
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: '입고',
            data: inboundData,
            borderColor: '#36A2EB',
            tension: 0.1,
          },
          {
            label: '출고',
            data: outboundData,
            borderColor: '#FF6384',
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    });
  },
};

// UI 관리
const dashboardUI = {
  // 대시보드 새로고침
  refresh() {
    dashboardManager.updateDashboard();
  },
};

// 이벤트 핸들러
const dashboardEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 새로고침 버튼
    app.events.registerButton('dashboard-refresh', () => {
      dashboardUI.refresh();
      app.ui.showNotification('대시보드가 새로고침되었습니다.', 'success');
    });

    // 자동 새로고침 (5분마다)
    setInterval(() => {
      dashboardUI.refresh();
    }, 5 * 60 * 1000);
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  dashboardManager.init();
  dashboardEvents.setup();
});
