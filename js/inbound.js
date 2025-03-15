/**
 * 자동차 부품 재고 관리 시스템 - 입고 관리 JavaScript 파일
 */

/**
 * 입고 관리 모듈
 */

// 입고 데이터 관리
const inboundManager = {
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
    this.data = app.utils.storage.get('inboundData') || this.getDefaultData();
  },

  // 기본 데이터
  getDefaultData() {
    return [
      {
        입고일: app.utils.formatDate(new Date()),
        PartNo: 'DB850-34010',
        ALC: '0',
        PLT수: '7',
        품목: 'INFLATOR',
        팔렛당수량: '864',
        입고수량: '864',
        입고팔렛: '1.00',
        열2: '14',
        저장위치: 'L3-1-01',
        구역: 'L3',
        블록: '1',
        열: '01',
        품번재고: '5,184',
        재고팔렛: '6.00',
        비고: '',
      },
      {
        입고일: app.utils.formatDate(new Date()),
        PartNo: 'G3845-93000',
        ALC: '0',
        PLT수: '20',
        품목: 'INFLATOR',
        팔렛당수량: '720',
        입고수량: '720',
        입고팔렛: '1.00',
        열2: '5',
        저장위치: 'L1-2-04',
        구역: 'L1',
        블록: '2',
        열: '04',
        품번재고: '2,160',
        재고팔렛: '3.00',
        비고: '',
      },
    ];
  },

  // 데이터 저장
  saveData() {
    app.utils.storage.set('inboundData', this.data);
  },

  // 입고 항목 추가
  addItem(item) {
    this.data.push(item);
    this.saveData();
    app.ui.showNotification('새 입고 항목이 추가되었습니다.', 'success');
    return true;
  },

  // 입고 항목 수정
  updateItem(item) {
    const index = this.data.findIndex((i) => i.PartNo === item.PartNo);
    if (index === -1) {
      app.ui.showNotification('입고 항목을 찾을 수 없습니다.', 'error');
      return false;
    }
    this.data[index] = item;
    this.saveData();
    app.ui.showNotification('입고 정보가 업데이트되었습니다.', 'success');
    return true;
  },

  // 입고 항목 삭제
  deleteItem(partNo) {
    if (!confirm('이 입고 항목을 삭제하시겠습니까?')) return false;

    this.data = this.data.filter((i) => i.PartNo !== partNo);
    this.saveData();
    app.ui.showNotification('입고 항목이 삭제되었습니다.', 'success');
    return true;
  },

  // 입고 검색
  searchItems(term) {
    const searchTerm = term.toLowerCase();
    return this.data.filter(
      (item) =>
        item.PartNo.toLowerCase().includes(searchTerm) ||
        item.품목.toLowerCase().includes(searchTerm) ||
        item.저장위치.toLowerCase().includes(searchTerm) ||
        item.구역.toLowerCase().includes(searchTerm) ||
        item.블록.toLowerCase().includes(searchTerm)
    );
  },

  // 엑셀 데이터 처리
  processExcelData(data) {
    return data.map((item) => ({
      입고일: item.입고일 || item['입고일'] || app.utils.formatDate(new Date()),
      PartNo: item.PartNo || item['Part No.'] || item['Part No'] || '',
      ALC: item.ALC || '',
      PLT수: item.PLT수 || item['PLT수'] || '',
      품목: item.품목 || '',
      팔렛당수량:
        item.팔렛당수량 || item['팔렛당 수량'] || item['팔렛트당 수량'] || '',
      입고수량: item.입고수량 || item['입고 수량'] || '',
      입고팔렛: item.입고팔렛 || item['입고 팔렛'] || '',
      열2: item.열2 || '',
      저장위치: item.저장위치 || item['저장 위치'] || '',
      구역: item.구역 || '',
      블록: item.블록 || '',
      열: item.열 || '',
      품번재고: item.품번재고 || item['품번 재고'] || '',
      재고팔렛: item.재고팔렛 || item['재고 팔렛'] || '',
      비고: item.비고 || '',
    }));
  },
};

// UI 관리
const inboundUI = {
  table: null,

  // 테이블 초기화
  initTable() {
    this.table = app.ui.table.init('inbound-table');
    this.refreshTable();
  },

  // 테이블 새로고침
  refreshTable() {
    this.table.clear();
    inboundManager.data.forEach((item) => {
      this.table.addRow(item, this.getRowTemplate());
    });
  },

  // 행 템플릿
  getRowTemplate() {
    return (item) => `
            <td>${item.입고일}</td>
            <td>${item.PartNo}</td>
            <td>${item.ALC}</td>
            <td>${item.PLT수}</td>
            <td>${item.품목}</td>
            <td>${item.팔렛당수량}</td>
            <td>${item.입고수량}</td>
            <td>${item.입고팔렛}</td>
            <td>${item.열2}</td>
            <td>${item.저장위치}</td>
            <td>${item.구역}</td>
            <td>${item.블록}</td>
            <td>${item.열}</td>
            <td>${item.품번재고}</td>
            <td>${item.재고팔렛}</td>
            <td>${item.비고}</td>
            <td>
                <button class="edit-btn" data-partno="${item.PartNo}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-partno="${item.PartNo}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
  },

  // 모달 표시
  showModal(item = null) {
    const modal = document.getElementById('inbound-modal');
    const title = document.getElementById('inbound-modal-title');
    const form = document.getElementById('inbound-form');

    title.textContent = item ? '입고 정보 수정' : '신규 입고 등록';

    if (item) {
      inboundManager.currentItem = item;
      this.fillForm(item);
    } else {
      inboundManager.currentItem = null;
      form.reset();
      document.getElementById('inbound-date').value = app.utils.formatDate(
        new Date()
      );
    }

    app.ui.modal.show('inbound-modal');
  },

  // 폼 채우기
  fillForm(item) {
    Object.keys(item).forEach((key) => {
      const input = document.getElementById(`inbound-${key}`);
      if (input) input.value = item[key];
    });
  },

  // 폼 데이터 가져오기
  getFormData() {
    const form = document.getElementById('inbound-form');
    const formData = new FormData(form);
    return Object.fromEntries(formData.entries());
  },
};

// 이벤트 핸들러
const inboundEvents = {
  // 이벤트 리스너 등록
  setup() {
    // 신규 등록 버튼
    app.events.registerButton('inbound-add', () => inboundUI.showModal());

    // 엑셀 내보내기
    app.events.registerButton('inbound-excel-export', () => {
      app.utils.excel.export(inboundManager.data, '입고목록', '입고목록.xlsx');
    });

    // 엑셀 가져오기
    app.events.registerButton('inbound-excel-import', () => {
      document.getElementById('inbound-excel-file').click();
    });

    // 엑셀 파일 선택
    document
      .getElementById('inbound-excel-file')
      .addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          app.utils.excel
            .import(e.target.files[0])
            .then((data) => {
              const processedData = inboundManager.processExcelData(data);
              inboundManager.data = processedData;
              inboundManager.saveData();
              inboundUI.refreshTable();
              app.ui.showNotification(
                '입고 데이터가 가져와졌습니다.',
                'success'
              );
            })
            .catch((error) => {
              console.error('엑셀 파일 처리 오류:', error);
              app.ui.showNotification(
                '엑셀 파일 처리 중 오류가 발생했습니다.',
                'error'
              );
            });
          e.target.value = '';
        }
      });

    // 검색
    app.events.registerButton('inbound-search-btn', () => {
      const term = document.getElementById('inbound-search').value;
      const results = inboundManager.searchItems(term);
      inboundUI.table.clear();
      results.forEach((item) => {
        inboundUI.table.addRow(item, inboundUI.getRowTemplate());
      });
    });

    // 폼 제출
    app.events.registerForm('inbound-form', () => {
      const formData = inboundUI.getFormData();
      if (inboundManager.currentItem) {
        inboundManager.updateItem(formData);
      } else {
        inboundManager.addItem(formData);
      }
      inboundUI.refreshTable();
      app.ui.modal.hide('inbound-modal');
    });

    // 테이블 이벤트 위임
    document.getElementById('inbound-table').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const partNo = row.querySelector('[data-partno]')?.dataset.partno;
      if (!partNo) return;

      if (e.target.closest('.edit-btn')) {
        const item = inboundManager.data.find((i) => i.PartNo === partNo);
        inboundUI.showModal(item);
      } else if (e.target.closest('.delete-btn')) {
        if (inboundManager.deleteItem(partNo)) {
          inboundUI.refreshTable();
        }
      }
    });
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  inboundManager.init();
  inboundEvents.setup();
});
