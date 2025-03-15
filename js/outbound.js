/**
 * 출고 관리 모듈
 */

// 출고 데이터 관리
const outboundManager = {
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
    this.data = app.utils.storage.get('outboundData') || this.getDefaultData();
  },

  // 기본 데이터
  getDefaultData() {
    return [
      {
        id: 'OUT001',
        date: app.utils.formatDate(new Date()),
        client: '현대자동차',
        itemCode: 'INV001',
        itemName: '엔진 마운트',
        quantity: 50,
        unit: '개',
        price: 55000,
        totalAmount: 2750000,
        notes: '정상 출고',
      },
      {
        id: 'OUT002',
        date: app.utils.formatDate(new Date()),
        client: '기아자동차',
        itemCode: 'INV002',
        itemName: '브레이크 패드',
        quantity: 30,
        unit: '세트',
        price: 35000,
        totalAmount: 1050000,
        notes: '정상 출고',
      },
    ];
  },

  // 데이터 저장
  saveData() {
    app.utils.storage.set('outboundData', this.data);
  },

  // 출고 항목 추가
  addItem(item) {
    if (this.data.some((i) => i.id === item.id)) {
      app.ui.showNotification('이미 존재하는 출고번호입니다.', 'error');
      return false;
    }
    this.data.push(item);
    this.saveData();
    app.ui.showNotification('새 출고 항목이 추가되었습니다.', 'success');
    return true;
  },

  // 출고 항목 수정
  updateItem(item) {
    const index = this.data.findIndex((i) => i.id === item.id);
    if (index === -1) {
      app.ui.showNotification('출고 항목을 찾을 수 없습니다.', 'error');
      return false;
    }
    this.data[index] = item;
    this.saveData();
    app.ui.showNotification('출고 정보가 업데이트되었습니다.', 'success');
    return true;
  },

  // 출고 항목 삭제
  deleteItem(id) {
    if (!confirm('이 출고 항목을 삭제하시겠습니까?')) return false;

    this.data = this.data.filter((i) => i.id !== id);
    this.saveData();
    app.ui.showNotification('출고 항목이 삭제되었습니다.', 'success');
    return true;
  },

  // 출고 검색
  searchItems(term) {
    const searchTerm = term.toLowerCase();
    return this.data.filter(
      (item) =>
        item.id.toLowerCase().includes(searchTerm) ||
        item.client.toLowerCase().includes(searchTerm) ||
        item.itemCode.toLowerCase().includes(searchTerm) ||
        item.itemName.toLowerCase().includes(searchTerm) ||
        item.notes.toLowerCase().includes(searchTerm)
    );
  },
};

// UI 관리
const outboundUI = {
  table: null,

  // 테이블 초기화
  initTable() {
    this.table = app.ui.table.init('outbound-table');
    this.refreshTable();
  },

  // 테이블 새로고침
  refreshTable() {
    this.table.clear();
    outboundManager.data.forEach((item) => {
      this.table.addRow(item, this.getRowTemplate());
    });
  },

  // 행 템플릿
  getRowTemplate() {
    return (item) => `
            <td>${item.id}</td>
            <td>${item.date}</td>
            <td>${item.client}</td>
            <td>${item.itemCode}</td>
            <td>${item.itemName}</td>
            <td>${app.utils.formatNumber(item.quantity)}</td>
            <td>${item.unit}</td>
            <td>${app.utils.formatNumber(item.price)}</td>
            <td>${app.utils.formatNumber(item.totalAmount)}</td>
            <td>${item.notes}</td>
            <td>
                <button class="edit-btn" data-id="${item.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
  },

  // 모달 표시
  showModal(item = null) {
    const modal = document.getElementById('outbound-modal');
    const title = document.getElementById('outbound-modal-title');
    const form = document.getElementById('outbound-form');
    const idInput = document.getElementById('outbound-id');

    title.textContent = item ? '출고 정보 수정' : '신규 출고 등록';
    idInput.disabled = !!item;

    if (item) {
      outboundManager.currentItem = item;
      this.fillForm(item);
    } else {
      outboundManager.currentItem = null;
      form.reset();
      document.getElementById('outbound-date').value = app.utils.formatDate(
        new Date()
      );
    }

    app.ui.modal.show('outbound-modal');
  },

  // 폼 채우기
  fillForm(item) {
    Object.keys(item).forEach((key) => {
      const input = document.getElementById(`outbound-${key}`);
      if (input) input.value = item[key];
    });
  },

  // 폼 데이터 가져오기
  getFormData() {
    const form = document.getElementById('outbound-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // 숫자 필드 변환
    data.quantity = parseInt(data.quantity);
    data.price = parseInt(data.price);
    data.totalAmount = data.quantity * data.price;

    return data;
  },
};

// 이벤트 핸들러
const outboundEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 신규 등록 버튼
    app.events.registerButton('outbound-add', () => outboundUI.showModal());

    // 엑셀 내보내기
    app.events.registerButton('outbound-excel-export', () => {
      app.utils.excel.export(outboundManager.data, '출고목록', '출고목록.xlsx');
    });

    // 엑셀 가져오기
    app.events.registerButton('outbound-excel-import', () => {
      document.getElementById('outbound-excel-file').click();
    });

    // 엑셀 파일 선택
    document
      .getElementById('outbound-excel-file')
      .addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          app.utils.excel
            .import(e.target.files[0])
            .then((data) => {
              outboundManager.data = data;
              outboundManager.saveData();
              outboundUI.refreshTable();
              app.ui.showNotification(
                '출고 데이터가 가져와졌습니다.',
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
    app.events.registerButton('outbound-search-btn', () => {
      const term = document.getElementById('outbound-search').value;
      const results = outboundManager.searchItems(term);
      outboundUI.table.clear();
      results.forEach((item) => {
        outboundUI.table.addRow(item, outboundUI.getRowTemplate());
      });
    });

    // 폼 제출
    app.events.registerForm('outbound-form', () => {
      const formData = outboundUI.getFormData();
      if (outboundManager.currentItem) {
        outboundManager.updateItem(formData);
      } else {
        outboundManager.addItem(formData);
      }
      outboundUI.refreshTable();
      app.ui.modal.hide('outbound-modal');
    });

    // 테이블 이벤트 위임
    document.getElementById('outbound-table').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const id = row.querySelector('[data-id]')?.dataset.id;
      if (!id) return;

      const item = outboundManager.data.find((i) => i.id === id);

      if (e.target.closest('.edit-btn')) {
        outboundUI.showModal(item);
      } else if (e.target.closest('.delete-btn')) {
        if (outboundManager.deleteItem(id)) {
          outboundUI.refreshTable();
        }
      }
    });
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  outboundManager.init();
  outboundEvents.setup();
});
