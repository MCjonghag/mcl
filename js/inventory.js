/**
 * 재고 관리 모듈
 */

// 재고 데이터 관리
const inventoryManager = {
  data: [],
  currentItem: null,

  // 데이터 초기화
  init() {
    this.loadData();
    this.initTable();
    this.setupEventListeners();
  },

  // 데이터 로드
  loadData() {
    this.data = app.utils.storage.get('inventoryData') || this.getDefaultData();
  },

  // 기본 데이터
  getDefaultData() {
    return [
      {
        code: 'INV001',
        name: '엔진 마운트',
        category: '엔진부품',
        supplier: '한국철강',
        unit: '개',
        minStock: 100,
        maxStock: 500,
        currentStock: 300,
        location: 'A-1-1',
        notes: '주요 부품',
      },
      {
        code: 'INV002',
        name: '브레이크 패드',
        category: '제동장치',
        supplier: '대한알루미늄',
        unit: '세트',
        minStock: 50,
        maxStock: 200,
        currentStock: 150,
        location: 'B-2-3',
        notes: '',
      },
    ];
  },

  // 데이터 저장
  saveData() {
    app.utils.storage.set('inventoryData', this.data);
  },

  // 재고 항목 추가
  addItem(item) {
    if (this.data.some((i) => i.code === item.code)) {
      app.ui.showNotification('이미 존재하는 품목코드입니다.', 'error');
      return false;
    }
    this.data.push(item);
    this.saveData();
    app.ui.showNotification('새 재고 항목이 추가되었습니다.', 'success');
    return true;
  },

  // 재고 항목 수정
  updateItem(item) {
    const index = this.data.findIndex((i) => i.code === item.code);
    if (index === -1) {
      app.ui.showNotification('재고 항목을 찾을 수 없습니다.', 'error');
      return false;
    }
    this.data[index] = item;
    this.saveData();
    app.ui.showNotification('재고 정보가 업데이트되었습니다.', 'success');
    return true;
  },

  // 재고 항목 삭제
  deleteItem(code) {
    if (!confirm('이 재고 항목을 삭제하시겠습니까?')) return false;

    this.data = this.data.filter((i) => i.code !== code);
    this.saveData();
    app.ui.showNotification('재고 항목이 삭제되었습니다.', 'success');
    return true;
  },

  // 재고 검색
  searchItems(term) {
    const searchTerm = term.toLowerCase();
    return this.data.filter(
      (item) =>
        item.code.toLowerCase().includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.supplier.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm)
    );
  },

  // 재고 조정
  adjustStock(code, quantity, type) {
    const item = this.data.find((i) => i.code === code);
    if (!item) {
      app.ui.showNotification('재고 항목을 찾을 수 없습니다.', 'error');
      return false;
    }

    const adjustment = type === 'in' ? quantity : -quantity;
    const newStock = item.currentStock + adjustment;

    if (newStock < 0) {
      app.ui.showNotification('재고가 부족합니다.', 'error');
      return false;
    }

    item.currentStock = newStock;
    this.saveData();
    app.ui.showNotification('재고가 조정되었습니다.', 'success');
    return true;
  },
};

// UI 관리
const inventoryUI = {
  table: null,

  // 테이블 초기화
  initTable() {
    this.table = app.ui.table.init('inventory-table');
    this.refreshTable();
  },

  // 테이블 새로고침
  refreshTable() {
    this.table.clear();
    inventoryManager.data.forEach((item) => {
      this.table.addRow(item, this.getRowTemplate());
    });
  },

  // 행 템플릿
  getRowTemplate() {
    return (item) => `
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.supplier}</td>
            <td>${item.unit}</td>
            <td>${app.utils.formatNumber(item.minStock)}</td>
            <td>${app.utils.formatNumber(item.maxStock)}</td>
            <td>${app.utils.formatNumber(item.currentStock)}</td>
            <td>${item.location}</td>
            <td>${item.notes}</td>
            <td>
                <button class="edit-btn" data-code="${item.code}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-code="${item.code}">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="adjust-btn" data-code="${item.code}">
                    <i class="fas fa-balance-scale"></i>
                </button>
            </td>
        `;
  },

  // 모달 표시
  showModal(item = null) {
    const modal = document.getElementById('inventory-modal');
    const title = document.getElementById('inventory-modal-title');
    const form = document.getElementById('inventory-form');
    const codeInput = document.getElementById('inventory-code');

    title.textContent = item ? '재고 정보 수정' : '신규 재고 등록';
    codeInput.disabled = !!item;

    if (item) {
      inventoryManager.currentItem = item;
      this.fillForm(item);
    } else {
      inventoryManager.currentItem = null;
      form.reset();
    }

    app.ui.modal.show('inventory-modal');
  },

  // 재고 조정 모달 표시
  showAdjustModal(item) {
    const modal = document.getElementById('adjust-modal');
    const title = document.getElementById('adjust-modal-title');
    const form = document.getElementById('adjust-form');
    const currentStock = document.getElementById('current-stock');

    title.textContent = `${item.name} 재고 조정`;
    currentStock.textContent = app.utils.formatNumber(item.currentStock);

    inventoryManager.currentItem = item;
    form.reset();

    app.ui.modal.show('adjust-modal');
  },

  // 폼 채우기
  fillForm(item) {
    Object.keys(item).forEach((key) => {
      const input = document.getElementById(`inventory-${key}`);
      if (input) input.value = item[key];
    });
  },

  // 폼 데이터 가져오기
  getFormData() {
    const form = document.getElementById('inventory-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  },

  // 재고 조정 데이터 가져오기
  getAdjustData() {
    const form = document.getElementById('adjust-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    return {
      quantity: parseInt(data.quantity),
      type: data.type,
    };
  },
};

// 이벤트 핸들러
const inventoryEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 신규 등록 버튼
    app.events.registerButton('inventory-add', () => inventoryUI.showModal());

    // 엑셀 내보내기
    app.events.registerButton('inventory-excel-export', () => {
      app.utils.excel.export(
        inventoryManager.data,
        '재고목록',
        '재고목록.xlsx'
      );
    });

    // 엑셀 가져오기
    app.events.registerButton('inventory-excel-import', () => {
      document.getElementById('inventory-excel-file').click();
    });

    // 엑셀 파일 선택
    document
      .getElementById('inventory-excel-file')
      .addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          app.utils.excel
            .import(e.target.files[0])
            .then((data) => {
              inventoryManager.data = data;
              inventoryManager.saveData();
              inventoryUI.refreshTable();
              app.ui.showNotification(
                '재고 데이터가 가져와졌습니다.',
                'success'
              );
            })
            .catch((error) => {
              app.ui.showNotification(
                '엑셀 파일 처리 중 오류가 발생했습니다.',
                'error'
              );
            });
          e.target.value = '';
        }
      });

    // 검색
    app.events.registerButton('inventory-search-btn', () => {
      const term = document.getElementById('inventory-search').value;
      const results = inventoryManager.searchItems(term);
      inventoryUI.table.clear();
      results.forEach((item) => {
        inventoryUI.table.addRow(item, inventoryUI.getRowTemplate());
      });
    });

    // 폼 제출
    app.events.registerForm('inventory-form', () => {
      const formData = inventoryUI.getFormData();
      if (inventoryManager.currentItem) {
        inventoryManager.updateItem(formData);
      } else {
        inventoryManager.addItem(formData);
      }
      inventoryUI.refreshTable();
      app.ui.modal.hide('inventory-modal');
    });

    // 재고 조정 폼 제출
    app.events.registerForm('adjust-form', () => {
      const { quantity, type } = inventoryUI.getAdjustData();
      if (
        inventoryManager.adjustStock(
          inventoryManager.currentItem.code,
          quantity,
          type
        )
      ) {
        inventoryUI.refreshTable();
        app.ui.modal.hide('adjust-modal');
      }
    });

    // 테이블 이벤트 위임
    document
      .getElementById('inventory-table')
      .addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (!row) return;

        const code = row.querySelector('[data-code]')?.dataset.code;
        if (!code) return;

        const item = inventoryManager.data.find((i) => i.code === code);

        if (e.target.closest('.edit-btn')) {
          inventoryUI.showModal(item);
        } else if (e.target.closest('.delete-btn')) {
          if (inventoryManager.deleteItem(code)) {
            inventoryUI.refreshTable();
          }
        } else if (e.target.closest('.adjust-btn')) {
          inventoryUI.showAdjustModal(item);
        }
      });
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  inventoryManager.init();
  inventoryEvents.setup();
});
