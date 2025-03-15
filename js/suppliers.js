/**
 * 공급업체 관리 모듈
 */

// 공급업체 데이터 관리
const supplierManager = {
  data: [],
  currentSupplier: null,

  // 데이터 초기화
  init() {
    this.loadData();
    this.initTable();
    this.setupEventListeners();
  },

  // 데이터 로드
  loadData() {
    this.data = app.utils.storage.get('supplierData') || this.getDefaultData();
  },

  // 기본 데이터
  getDefaultData() {
    return [
      {
        code: 'SUP001',
        name: '한국철강',
        ceo: '김철강',
        businessNo: '123-45-67890',
        phone: '02-1234-5678',
        email: 'contact@koreansteel.com',
        address: '서울시 강남구 테헤란로 123',
        manager: '이담당',
        managerPhone: '010-1234-5678',
        items: '철강, 스테인리스',
        notes: '주요 공급업체',
      },
      {
        code: 'SUP002',
        name: '대한알루미늄',
        ceo: '박알루',
        businessNo: '234-56-78901',
        phone: '02-2345-6789',
        email: 'contact@daehanal.com',
        address: '서울시 서초구 양재동 231',
        manager: '김관리',
        managerPhone: '010-2345-6789',
        items: '알루미늄, 합금',
        notes: '',
      },
    ];
  },

  // 데이터 저장
  saveData() {
    app.utils.storage.set('supplierData', this.data);
  },

  // 공급업체 추가
  addSupplier(supplier) {
    if (this.data.some((s) => s.code === supplier.code)) {
      app.ui.showNotification('이미 존재하는 업체코드입니다.', 'error');
      return false;
    }
    this.data.push(supplier);
    this.saveData();
    app.ui.showNotification('새 공급업체가 추가되었습니다.', 'success');
    return true;
  },

  // 공급업체 수정
  updateSupplier(supplier) {
    const index = this.data.findIndex((s) => s.code === supplier.code);
    if (index === -1) {
      app.ui.showNotification('공급업체를 찾을 수 없습니다.', 'error');
      return false;
    }
    this.data[index] = supplier;
    this.saveData();
    app.ui.showNotification('공급업체 정보가 업데이트되었습니다.', 'success');
    return true;
  },

  // 공급업체 삭제
  deleteSupplier(code) {
    if (!confirm('이 공급업체를 삭제하시겠습니까?')) return false;

    this.data = this.data.filter((s) => s.code !== code);
    this.saveData();
    app.ui.showNotification('공급업체가 삭제되었습니다.', 'success');
    return true;
  },

  // 공급업체 검색
  searchSuppliers(term) {
    const searchTerm = term.toLowerCase();
    return this.data.filter(
      (supplier) =>
        supplier.code.toLowerCase().includes(searchTerm) ||
        supplier.name.toLowerCase().includes(searchTerm) ||
        supplier.ceo.toLowerCase().includes(searchTerm) ||
        supplier.businessNo.toLowerCase().includes(searchTerm) ||
        supplier.items.toLowerCase().includes(searchTerm)
    );
  },
};

// UI 관리
const supplierUI = {
  table: null,

  // 테이블 초기화
  initTable() {
    this.table = app.ui.table.init('supplier-table');
    this.refreshTable();
  },

  // 테이블 새로고침
  refreshTable() {
    this.table.clear();
    supplierManager.data.forEach((supplier) => {
      this.table.addRow(supplier, this.getRowTemplate());
    });
  },

  // 행 템플릿
  getRowTemplate() {
    return (supplier) => `
            <td>${supplier.code}</td>
            <td>${supplier.name}</td>
            <td>${supplier.ceo}</td>
            <td>${supplier.businessNo}</td>
            <td>${supplier.phone}</td>
            <td>${supplier.email}</td>
            <td>${supplier.address}</td>
            <td>${supplier.manager}</td>
            <td>${supplier.managerPhone}</td>
            <td>${supplier.items}</td>
            <td>${supplier.notes}</td>
            <td>
                <button class="edit-btn" data-code="${supplier.code}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-code="${supplier.code}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
  },

  // 모달 표시
  showModal(supplier = null) {
    const modal = document.getElementById('supplier-modal');
    const title = document.getElementById('supplier-modal-title');
    const form = document.getElementById('supplier-form');
    const codeInput = document.getElementById('supplier-code');

    title.textContent = supplier ? '공급업체 정보 수정' : '신규 공급업체 등록';
    codeInput.disabled = !!supplier;

    if (supplier) {
      supplierManager.currentSupplier = supplier;
      this.fillForm(supplier);
    } else {
      supplierManager.currentSupplier = null;
      form.reset();
    }

    app.ui.modal.show('supplier-modal');
  },

  // 폼 채우기
  fillForm(supplier) {
    Object.keys(supplier).forEach((key) => {
      const input = document.getElementById(`supplier-${key}`);
      if (input) input.value = supplier[key];
    });
  },

  // 폼 데이터 가져오기
  getFormData() {
    const form = document.getElementById('supplier-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  },
};

// 이벤트 핸들러
const supplierEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 신규 등록 버튼
    app.events.registerButton('supplier-add', () => supplierUI.showModal());

    // 엑셀 내보내기
    app.events.registerButton('supplier-excel-export', () => {
      app.utils.excel.export(
        supplierManager.data,
        '공급업체목록',
        '공급업체목록.xlsx'
      );
    });

    // 엑셀 가져오기
    app.events.registerButton('supplier-excel-import', () => {
      document.getElementById('supplier-excel-file').click();
    });

    // 엑셀 파일 선택
    document
      .getElementById('supplier-excel-file')
      .addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          app.utils.excel
            .import(e.target.files[0])
            .then((data) => {
              supplierManager.data = data;
              supplierManager.saveData();
              supplierUI.refreshTable();
              app.ui.showNotification(
                '공급업체 데이터가 가져와졌습니다.',
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
    app.events.registerButton('supplier-search-btn', () => {
      const term = document.getElementById('supplier-search').value;
      const results = supplierManager.searchSuppliers(term);
      supplierUI.table.clear();
      results.forEach((supplier) => {
        supplierUI.table.addRow(supplier, supplierUI.getRowTemplate());
      });
    });

    // 폼 제출
    app.events.registerForm('supplier-form', () => {
      const formData = supplierUI.getFormData();
      if (supplierManager.currentSupplier) {
        supplierManager.updateSupplier(formData);
      } else {
        supplierManager.addSupplier(formData);
      }
      supplierUI.refreshTable();
      app.ui.modal.hide('supplier-modal');
    });

    // 테이블 이벤트 위임
    document.getElementById('supplier-table').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const code = row.querySelector('[data-code]')?.dataset.code;
      if (!code) return;

      if (e.target.closest('.edit-btn')) {
        const supplier = supplierManager.data.find((s) => s.code === code);
        supplierUI.showModal(supplier);
      } else if (e.target.closest('.delete-btn')) {
        if (supplierManager.deleteSupplier(code)) {
          supplierUI.refreshTable();
        }
      }
    });
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  supplierManager.init();
  supplierEvents.setup();
});
