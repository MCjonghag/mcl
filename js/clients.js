/**
 * 납품처 관리 모듈
 */

// 납품처 데이터 관리
const clientManager = {
  data: [],
  currentClient: null,

  // 데이터 초기화
  init() {
    this.loadData();
    this.initTable();
    this.setupEventListeners();
  },

  // 데이터 로드
  loadData() {
    this.data = app.utils.storage.get('clientData') || this.getDefaultData();
  },

  // 기본 데이터
  getDefaultData() {
    return [
      {
        code: 'CLI001',
        name: '현대자동차',
        ceo: '정의선',
        businessNo: '123-45-67890',
        phone: '02-1234-5678',
        email: 'contact@hyundai.com',
        address: '서울시 서초구 헌릉로 12',
        manager: '김담당',
        managerPhone: '010-1234-5678',
        items: '엔진 마운트, 브레이크 패드',
        notes: '주요 납품처',
      },
      {
        code: 'CLI002',
        name: '기아자동차',
        ceo: '송호성',
        businessNo: '234-56-78901',
        phone: '02-2345-6789',
        email: 'contact@kia.com',
        address: '서울시 서초구 양재동 231',
        manager: '이관리',
        managerPhone: '010-2345-6789',
        items: '트랜스미션 케이스',
        notes: '',
      },
    ];
  },

  // 데이터 저장
  saveData() {
    app.utils.storage.set('clientData', this.data);
  },

  // 납품처 추가
  addClient(client) {
    if (this.data.some((c) => c.code === client.code)) {
      app.ui.showNotification('이미 존재하는 업체코드입니다.', 'error');
      return false;
    }
    this.data.push(client);
    this.saveData();
    app.ui.showNotification('새 납품처가 추가되었습니다.', 'success');
    return true;
  },

  // 납품처 수정
  updateClient(client) {
    const index = this.data.findIndex((c) => c.code === client.code);
    if (index === -1) {
      app.ui.showNotification('납품처를 찾을 수 없습니다.', 'error');
      return false;
    }
    this.data[index] = client;
    this.saveData();
    app.ui.showNotification('납품처 정보가 업데이트되었습니다.', 'success');
    return true;
  },

  // 납품처 삭제
  deleteClient(code) {
    if (!confirm('이 납품처를 삭제하시겠습니까?')) return false;

    this.data = this.data.filter((c) => c.code !== code);
    this.saveData();
    app.ui.showNotification('납품처가 삭제되었습니다.', 'success');
    return true;
  },

  // 납품처 검색
  searchClients(term) {
    const searchTerm = term.toLowerCase();
    return this.data.filter(
      (client) =>
        client.code.toLowerCase().includes(searchTerm) ||
        client.name.toLowerCase().includes(searchTerm) ||
        client.ceo.toLowerCase().includes(searchTerm) ||
        client.businessNo.toLowerCase().includes(searchTerm) ||
        client.items.toLowerCase().includes(searchTerm)
    );
  },
};

// UI 관리
const clientUI = {
  table: null,

  // 테이블 초기화
  initTable() {
    this.table = app.ui.table.init('client-table');
    this.refreshTable();
  },

  // 테이블 새로고침
  refreshTable() {
    this.table.clear();
    clientManager.data.forEach((client) => {
      this.table.addRow(client, this.getRowTemplate());
    });
  },

  // 행 템플릿
  getRowTemplate() {
    return (client) => `
            <td>${client.code}</td>
            <td>${client.name}</td>
            <td>${client.ceo}</td>
            <td>${client.businessNo}</td>
            <td>${client.phone}</td>
            <td>${client.email}</td>
            <td>${client.address}</td>
            <td>${client.manager}</td>
            <td>${client.managerPhone}</td>
            <td>${client.items}</td>
            <td>${client.notes}</td>
            <td>
                <button class="edit-btn" data-code="${client.code}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-code="${client.code}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
  },

  // 모달 표시
  showModal(client = null) {
    const modal = document.getElementById('client-modal');
    const title = document.getElementById('client-modal-title');
    const form = document.getElementById('client-form');
    const codeInput = document.getElementById('client-code');

    title.textContent = client ? '납품처 정보 수정' : '신규 납품처 등록';
    codeInput.disabled = !!client;

    if (client) {
      clientManager.currentClient = client;
      this.fillForm(client);
    } else {
      clientManager.currentClient = null;
      form.reset();
    }

    app.ui.modal.show('client-modal');
  },

  // 폼 채우기
  fillForm(client) {
    Object.keys(client).forEach((key) => {
      const input = document.getElementById(`client-${key}`);
      if (input) input.value = client[key];
    });
  },

  // 폼 데이터 가져오기
  getFormData() {
    const form = document.getElementById('client-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  },
};

// 이벤트 핸들러
const clientEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 신규 등록 버튼
    app.events.registerButton('client-add', () => clientUI.showModal());

    // 엑셀 내보내기
    app.events.registerButton('client-excel-export', () => {
      app.utils.excel.export(
        clientManager.data,
        '납품처목록',
        '납품처목록.xlsx'
      );
    });

    // 엑셀 가져오기
    app.events.registerButton('client-excel-import', () => {
      document.getElementById('client-excel-file').click();
    });

    // 엑셀 파일 선택
    document
      .getElementById('client-excel-file')
      .addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          app.utils.excel
            .import(e.target.files[0])
            .then((data) => {
              clientManager.data = data;
              clientManager.saveData();
              clientUI.refreshTable();
              app.ui.showNotification(
                '납품처 데이터가 가져와졌습니다.',
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
    app.events.registerButton('client-search-btn', () => {
      const term = document.getElementById('client-search').value;
      const results = clientManager.searchClients(term);
      clientUI.table.clear();
      results.forEach((client) => {
        clientUI.table.addRow(client, clientUI.getRowTemplate());
      });
    });

    // 폼 제출
    app.events.registerForm('client-form', () => {
      const formData = clientUI.getFormData();
      if (clientManager.currentClient) {
        clientManager.updateClient(formData);
      } else {
        clientManager.addClient(formData);
      }
      clientUI.refreshTable();
      app.ui.modal.hide('client-modal');
    });

    // 테이블 이벤트 위임
    document.getElementById('client-table').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const code = row.querySelector('[data-code]')?.dataset.code;
      if (!code) return;

      if (e.target.closest('.edit-btn')) {
        const client = clientManager.data.find((c) => c.code === code);
        clientUI.showModal(client);
      } else if (e.target.closest('.delete-btn')) {
        if (clientManager.deleteClient(code)) {
          clientUI.refreshTable();
        }
      }
    });
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  clientManager.init();
  clientEvents.setup();
});
