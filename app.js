/**
 * 애플리케이션 메인 모듈
 */

// 전역 앱 객체
window.app = {
  // 상태 관리
  state: {
    currentUser: null,
    isAuthenticated: false,
  },

  // 유틸리티 함수
  utils: {
    // 날짜 포맷팅
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 숫자 포맷팅
    formatNumber(number) {
      return new Intl.NumberFormat('ko-KR').format(number);
    },

    // 입력값 검증
    validateInput(value, type) {
      switch (type) {
        case 'number':
          return !isNaN(value) && value > 0;
        case 'date':
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        case 'email':
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        case 'phone':
          return /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/.test(value);
        default:
          return value.trim() !== '';
      }
    },

    // 로컬 스토리지 관리
    storage: {
      get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      },

      set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
      },

      remove(key) {
        localStorage.removeItem(key);
      },

      clear() {
        localStorage.clear();
      },
    },

    // 엑셀 파일 처리
    excel: {
      export(data, sheetName, fileName) {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
      },

      import(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const data = new Uint8Array(e.target.result);
              const workbook = XLSX.read(data, { type: 'array' });
              const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData = XLSX.utils.sheet_to_json(firstSheet);
              resolve(jsonData);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(file);
        });
      },
    },
  },

  // UI 컴포넌트
  ui: {
    // 알림 표시
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.textContent = message;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('show');
      }, 100);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 3000);
    },

    // 모달 관리
    modal: {
      show(id) {
        const modal = document.getElementById(id);
        if (modal) {
          modal.style.display = 'block';
        }
      },

      hide(id) {
        const modal = document.getElementById(id);
        if (modal) {
          modal.style.display = 'none';
        }
      },
    },

    // 테이블 관리
    table: {
      init(id) {
        const table = document.getElementById(id);
        if (!table) return null;

        return {
          clear() {
            const tbody = table.querySelector('tbody');
            if (tbody) {
              tbody.innerHTML = '';
            }
          },

          addRow(data, template) {
            const tbody = table.querySelector('tbody');
            if (!tbody) return;

            const row = document.createElement('tr');
            row.innerHTML = template(data);
            tbody.appendChild(row);
          },

          search(term, columns) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach((row) => {
              const text = columns
                .map((col) => row.cells[col].textContent.toLowerCase())
                .join(' ');
              row.style.display = text.includes(term.toLowerCase())
                ? ''
                : 'none';
            });
          },
        };
      },
    },
  },

  // 이벤트 핸들러
  events: {
    // 버튼 이벤트 등록
    registerButton(id, handler) {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener('click', handler);
      }
    },

    // 폼 제출 이벤트 등록
    registerForm(id, handler) {
      const form = document.getElementById(id);
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          handler();
        });
      }
    },
  },
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 현재 페이지 메뉴 활성화
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const menuLink = document.querySelector(`a[href="${currentPage}"]`);
  if (menuLink) {
    menuLink.classList.add('active');
  }

  // 모달 외부 클릭 시 닫기
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
});

// 전역 변수 선언
let inboundData = [];
let inboundTableBody;

document.addEventListener('DOMContentLoaded', () => {
  console.log('자동차 부품 재고 관리 시스템이 로드되었습니다.');

  // 테이블 요소 초기화
  inboundTableBody = document.querySelector('#inbound-table tbody');

  // 메뉴 탭 전환 기능
  const menuLinks = document.querySelectorAll('.main-menu a');
  const sections = document.querySelectorAll('.section');

  menuLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // 활성화된 메뉴 링크 업데이트
      menuLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');

      // 해당 섹션 표시
      const targetId = link.getAttribute('href').substring(1);
      sections.forEach((section) => {
        section.classList.remove('active');
        if (section.id === targetId) {
          section.classList.add('active');
        }
      });
    });
  });

  // 샘플 데이터 로드 (실제 애플리케이션에서는 API 또는 데이터베이스에서 가져옴)
  loadSampleData();

  // 버튼 이벤트 리스너 등록
  registerButtonListeners();

  // 검색 기능 등록
  setupSearchFunctionality();

  // 입고 테이블 초기화
  initInboundTable();

  // 입고 검색 기능 설정
  setupInboundSearch();

  // 모달 초기화
  initModals();
});

// 샘플 데이터 로드 함수
function loadSampleData() {
  // 대시보드 데이터 업데이트
  document.getElementById('today-inbound').textContent = '5';
  document.getElementById('today-outbound').textContent = '8';
  document.getElementById('low-stock').textContent = '3';
  document.getElementById('urgent-requests').textContent = '2';

  // 대시보드 카드의 숫자 업데이트
  const dashboardNumbers = document.querySelectorAll('.dashboard-number');
  dashboardNumbers[0].textContent = '5'; // 금일 입고 현황
  dashboardNumbers[1].textContent = '8'; // 금일 출고 현황
  dashboardNumbers[2].textContent = '1,245'; // 재고 현황
  dashboardNumbers[3].textContent = '2'; // 긴급 출고 요청

  // 입고 테이블 데이터
  inboundData = [
    {
      입고일: '2024-01-24',
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
      입고일: '2024-01-24',
      PartNo: 'DB850-34010',
      ALC: '0',
      PLT수: '7',
      품목: 'INFLATOR',
      팔렛당수량: '864',
      입고수량: '864',
      입고팔렛: '1.00',
      열2: '14',
      저장위치: 'L3-1-02',
      구역: 'L3',
      블록: '1',
      열: '02',
      품번재고: '5,184',
      재고팔렛: '6.00',
      비고: '',
    },
    {
      입고일: '2024-01-24',
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

  // 입고 테이블 초기화
  initInboundTable();

  // 재고 테이블 데이터
  const inventoryTableBody = document.querySelector('#inventory-table tbody');
  const inventoryData = [
    {
      품번: 'P001',
      단수: '1',
      출수: '2',
      품목1: '엔진 컨트롤 유닛',
      가로: '30',
      세로: '20',
      높이: '10',
      수량PLT: '100',
      LT: '3',
      납품처: '현대자동차 울산공장',
      재고: 120,
      PLT: '1.2',
      ERP: 120,
      출하1: 20,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
    {
      품번: 'P002',
      단수: '2',
      출수: '3',
      품목1: '변속기 어셈블리',
      가로: '40',
      세로: '30',
      높이: '15',
      수량PLT: '50',
      LT: '5',
      납품처: '현대자동차 울산공장',
      재고: 45,
      PLT: '0.9',
      ERP: 45,
      출하1: 15,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
    {
      품번: 'P003',
      단수: '3',
      출수: '4',
      품목1: '브레이크 패드',
      가로: '20',
      세로: '15',
      높이: '5',
      수량PLT: '200',
      LT: '2',
      납품처: '현대자동차 아산공장',
      재고: 200,
      PLT: '1.0',
      ERP: 200,
      출하1: 50,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
    {
      품번: 'P004',
      단수: '2',
      출수: '2',
      품목1: '에어백 모듈',
      가로: '25',
      세로: '25',
      높이: '10',
      수량PLT: '80',
      LT: '4',
      납품처: '현대자동차 울산공장',
      재고: 80,
      PLT: '1.0',
      ERP: 80,
      출하1: 25,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
    {
      품번: 'P005',
      단수: '1',
      출수: '1',
      품목1: '라디에이터',
      가로: '50',
      세로: '40',
      높이: '20',
      수량PLT: '40',
      LT: '6',
      납품처: '현대자동차 아산공장',
      재고: 35,
      PLT: '0.875',
      ERP: 40,
      출하1: 10,
      입고: 0,
      오차: 5,
      차이수량: -5,
    },
    {
      품번: 'P006',
      단수: '2',
      출수: '2',
      품목1: '헤드라이트 어셈블리',
      가로: '35',
      세로: '25',
      높이: '15',
      수량PLT: '60',
      LT: '3',
      납품처: '현대자동차 울산공장',
      재고: 60,
      PLT: '1.0',
      ERP: 60,
      출하1: 30,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
    {
      품번: 'P007',
      단수: '3',
      출수: '3',
      품목1: '배터리',
      가로: '30',
      세로: '20',
      높이: '25',
      수량PLT: '50',
      LT: '4',
      납품처: '현대자동차 울산공장',
      재고: 90,
      PLT: '1.8',
      ERP: 90,
      출하1: 0,
      입고: 0,
      오차: 0,
      차이수량: 0,
    },
  ];

  inventoryTableBody.innerHTML = '';
  inventoryData.forEach((item) => {
    const row = document.createElement('tr');
    // 재고가 ERP보다 적으면 강조 표시
    const stockClass = item.재고 < item.ERP ? 'class="low-stock"' : '';
    // 오차가 있으면 강조 표시
    const errorClass = item.오차 !== 0 ? 'class="low-stock"' : '';

    row.innerHTML = `
      <td>${item.품번}</td>
      <td>${item.단수}</td>
      <td>${item.출수}</td>
      <td>${item.품목1}</td>
      <td>${item.가로}</td>
      <td>${item.세로}</td>
      <td>${item.높이}</td>
      <td>${item.수량PLT}</td>
      <td>${item.LT}</td>
      <td>${item.납품처}</td>
      <td ${stockClass}>${item.재고}</td>
      <td>${item.PLT}</td>
      <td>${item.ERP}</td>
      <td>${item.출하1}</td>
      <td>${item.입고}</td>
      <td ${errorClass}>${item.오차}</td>
      <td ${errorClass}>${item.차이수량}</td>
      <td>
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </td>
    `;
    inventoryTableBody.appendChild(row);
  });

  // 출고 테이블 데이터
  const outboundTableBody = document.querySelector('#outbound-table tbody');
  const outboundData = [
    {
      id: 'OUT001',
      date: '2024-06-01',
      client: '현대자동차 울산공장',
      vehicle: '아반떼',
      partCode: 'P001',
      partName: '엔진 컨트롤 유닛',
      quantity: 20,
      status: '완료',
    },
    {
      id: 'OUT002',
      date: '2024-06-02',
      client: '현대자동차 울산공장',
      vehicle: '쏘나타',
      partCode: 'P002',
      partName: '변속기 어셈블리',
      quantity: 15,
      status: '진행 중',
    },
    {
      id: 'OUT003',
      date: '2024-06-03',
      client: '현대자동차 아산공장',
      vehicle: '그랜저',
      partCode: 'P003',
      partName: '브레이크 패드',
      quantity: 50,
      status: '예정',
    },
    {
      id: 'OUT004',
      date: '2024-06-03',
      client: '현대자동차 울산공장',
      vehicle: '아반떼',
      partCode: 'P004',
      partName: '에어백 모듈',
      quantity: 25,
      status: '예정',
    },
    {
      id: 'OUT005',
      date: '2024-06-04',
      client: '현대자동차 아산공장',
      vehicle: '쏘나타',
      partCode: 'P005',
      partName: '라디에이터',
      quantity: 10,
      status: '예정',
    },
    {
      id: 'OUT006',
      date: '2024-06-04',
      client: '현대자동차 울산공장',
      vehicle: '그랜저',
      partCode: 'P006',
      partName: '헤드라이트 어셈블리',
      quantity: 30,
      status: '예정',
    },
  ];

  outboundTableBody.innerHTML = '';
  outboundData.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.date}</td>
      <td>${item.client}</td>
      <td>${item.vehicle}</td>
      <td>${item.partCode}</td>
      <td>${item.partName}</td>
      <td>${item.quantity}</td>
      <td>${item.status}</td>
      <td>
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </td>
    `;
    outboundTableBody.appendChild(row);
  });
}

// 입고 테이블 초기화
function initInboundTable() {
  if (!inboundTableBody) {
    inboundTableBody = document.querySelector('#inbound-table tbody');
  }

  inboundTableBody.innerHTML = '';
  inboundData.forEach((item) => {
    addInboundRow(item);
  });
}

// 입고 행 추가 함수
function addInboundRow(item) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${item.입고일 || ''}</td>
    <td>${item.PartNo || ''}</td>
    <td>${item.ALC || ''}</td>
    <td>${item.PLT수 || ''}</td>
    <td>${item.품목 || ''}</td>
    <td>${item.팔렛당수량 || ''}</td>
    <td>${item.입고수량 || ''}</td>
    <td>${item.입고팔렛 || ''}</td>
    <td>${item.열2 || ''}</td>
    <td>${item.저장위치 || ''}</td>
    <td>${item.구역 || ''}</td>
    <td>${item.블록 || ''}</td>
    <td>${item.열 || ''}</td>
    <td>${item.품번재고 || ''}</td>
    <td>${item.재고팔렛 || ''}</td>
    <td>${item.비고 || ''}</td>
    <td>
      <button class="edit-btn">수정</button>
      <button class="delete-btn">삭제</button>
    </td>
  `;
  inboundTableBody.appendChild(row);
}

// 입고 데이터 엑셀 가져오기 함수
function importInboundExcel(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 데이터 처리 및 테이블에 추가
    processInboundExcelData(jsonData);
  };
  reader.readAsArrayBuffer(file);
}

// 입고 엑셀 데이터 처리 함수
function processInboundExcelData(data) {
  // 필드명 매핑 및 데이터 정리
  const processedData = data.map((item) => {
    return {
      입고일: item.입고일 || '',
      PartNo: item['Part No.'] || item.PartNo || '',
      ALC: item.ALC || '',
      PLT수: item.PLT수 || item['PLT수'] || '',
      품목: item.품목 || '',
      팔렛당수량:
        item.팔렛당수량 || item['팔렛당 수량'] || item['팔렛트당 수량'] || '',
      입고수량: item.입고수량 || item['입고 수량'] || '',
      입고팔렛: item.입고팔렛 || item['입고 팔렛'] || item['입고팔렛'] || '',
      열2: item.열2 || '',
      저장위치: item.저장위치 || item['저장 위치'] || '',
      구역: item.구역 || '',
      블록: item.블록 || '',
      열: item.열 || '',
      품번재고: item.품번재고 || item['품번 재고'] || '',
      재고팔렛: item.재고팔렛 || item['재고 팔렛'] || '',
      비고: item.비고 || '',
    };
  });

  // 기존 데이터에 새 데이터 추가
  processedData.forEach((item) => {
    inboundData.push(item);
    addInboundRow(item);
  });

  // 대시보드 업데이트
  updateDashboard();
}

// 입고 데이터 엑셀 내보내기 함수
function exportInboundExcel() {
  // 현재 테이블 데이터 가져오기
  const rows = Array.from(inboundTableBody.querySelectorAll('tr'));

  // 데이터 추출
  const data = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    return {
      입고일: cells[0].textContent,
      'Part No.': cells[1].textContent,
      ALC: cells[2].textContent,
      PLT수: cells[3].textContent,
      품목: cells[4].textContent,
      팔렛당수량: cells[5].textContent,
      입고수량: cells[6].textContent,
      입고팔렛: cells[7].textContent,
      열2: cells[8].textContent,
      저장위치: cells[9].textContent,
      구역: cells[10].textContent,
      블록: cells[11].textContent,
      열: cells[12].textContent,
      품번재고: cells[13].textContent,
      재고팔렛: cells[14].textContent,
      비고: cells[15].textContent,
    };
  });

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(data);

  // 워크북 생성 및 워크시트 추가
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '입고현황');

  // 파일 저장
  XLSX.writeFile(wb, '입고현황.xlsx');
}

// 모달 관련 변수
let inboundModal;
let inboundModalClose;
let inboundForm;
let inboundCancelBtn;

// 모달 초기화 함수
function initModals() {
  // 입고 모달 초기화
  inboundModal = document.getElementById('inbound-modal');
  inboundModalClose = inboundModal.querySelector('.close');
  inboundForm = document.getElementById('inbound-form');
  inboundCancelBtn = inboundForm.querySelector('.cancel-btn');

  // 닫기 버튼 이벤트
  inboundModalClose.addEventListener('click', () => {
    inboundModal.style.display = 'none';
  });

  // 취소 버튼 이벤트
  inboundCancelBtn.addEventListener('click', () => {
    inboundModal.style.display = 'none';
  });

  // 모달 외부 클릭 시 닫기
  window.addEventListener('click', (event) => {
    if (event.target === inboundModal) {
      inboundModal.style.display = 'none';
    }
  });

  // 폼 제출 이벤트
  inboundForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveInboundData();
  });
}

// 입고 데이터 저장 함수
function saveInboundData() {
  // 폼 데이터 가져오기
  const newInbound = {
    입고일: document.getElementById('inbound-date').value,
    PartNo: document.getElementById('inbound-part-no').value,
    ALC: document.getElementById('inbound-alc').value,
    PLT수: document.getElementById('inbound-plt-count').value,
    품목: document.getElementById('inbound-item').value,
    팔렛당수량: document.getElementById('inbound-qty-per-plt').value,
    입고수량: document.getElementById('inbound-qty').value,
    입고팔렛: document.getElementById('inbound-plt').value,
    열2: document.getElementById('inbound-col2').value,
    저장위치: document.getElementById('inbound-location').value,
    구역: document.getElementById('inbound-area').value,
    블록: document.getElementById('inbound-block').value,
    열: document.getElementById('inbound-col').value,
    품번재고: document.getElementById('inbound-part-stock').value,
    재고팔렛: document.getElementById('inbound-stock-plt').value,
    비고: document.getElementById('inbound-note').value,
  };

  // 데이터 배열에 추가
  inboundData.push(newInbound);

  // 테이블에 행 추가
  addInboundRow(newInbound);

  // 모달 닫기 및 폼 초기화
  inboundModal.style.display = 'none';
  inboundForm.reset();

  // 대시보드 업데이트
  updateDashboard();
}

// 버튼 이벤트 리스너 등록 함수 수정
function registerButtonListeners() {
  // 입고 관리 버튼
  document.getElementById('inbound-add').addEventListener('click', () => {
    // 현재 날짜를 기본값으로 설정
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('inbound-date').value = today;

    // 모달 표시
    inboundModal.style.display = 'block';
  });

  document
    .getElementById('inbound-excel-import')
    .addEventListener('click', () => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.xlsx, .xls';
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          importInboundExcel(file);
        }
      };
      fileInput.click();
    });

  document
    .getElementById('inbound-excel-export')
    .addEventListener('click', () => {
      exportInboundExcel();
    });

  // 재고 관리 버튼
  document.getElementById('inventory-adjust').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.xlsx, .xls';
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        handleExcelFile(file);
      }
    };
    fileInput.click();
  });

  document.getElementById('inventory-count').addEventListener('click', () => {
    exportToExcel();
  });

  // 출고 관리 버튼
  document.getElementById('new-outbound').addEventListener('click', () => {
    alert('신규 출고 등록 기능은 개발 중입니다.');
  });

  document
    .getElementById('production-schedule')
    .addEventListener('click', () => {
      alert('생산 계획 연동 기능은 개발 중입니다.');
    });

  // 공급업체 관리 버튼
  document.getElementById('new-supplier').addEventListener('click', () => {
    alert('신규 공급업체 등록 기능은 개발 중입니다.');
  });

  // 납품처 관리 버튼
  document.getElementById('new-client').addEventListener('click', () => {
    alert('신규 납품처 등록 기능은 개발 중입니다.');
  });

  // 보고서 생성 버튼
  const reportButtons = document.querySelectorAll('.generate-report');
  reportButtons.forEach((button) => {
    button.addEventListener('click', () => {
      alert('보고서 생성 기능은 개발 중입니다.');
    });
  });

  // 수정 및 삭제 버튼
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      const row = e.target.closest('tr');
      const id = row.cells[0].textContent;
      alert(`${id} 항목 수정 기능은 개발 중입니다.`);
    }

    if (e.target.classList.contains('delete-btn')) {
      const row = e.target.closest('tr');
      const id = row.cells[0].textContent;
      if (confirm(`${id} 항목을 삭제하시겠습니까?`)) {
        alert('삭제 기능은 개발 중입니다.');
      }
    }
  });
}

// 검색 기능 설정
function setupSearchFunctionality() {
  // 입고 검색
  document
    .getElementById('inbound-search-btn')
    .addEventListener('click', () => {
      const searchTerm = document
        .getElementById('inbound-search')
        .value.toLowerCase();
      searchTable('#inbound-table', searchTerm);
    });

  // 재고 검색
  document
    .getElementById('inventory-search-btn')
    .addEventListener('click', () => {
      const searchTerm = document
        .getElementById('inventory-search')
        .value.toLowerCase();
      searchTable('#inventory-table', searchTerm);
    });

  // 출고 검색
  document
    .getElementById('outbound-search-btn')
    .addEventListener('click', () => {
      const searchTerm = document
        .getElementById('outbound-search')
        .value.toLowerCase();
      searchTable('#outbound-table', searchTerm);
    });

  // 공급업체 검색
  document
    .getElementById('supplier-search-btn')
    .addEventListener('click', () => {
      const searchTerm = document
        .getElementById('supplier-search')
        .value.toLowerCase();
      searchTable('#supplier-table', searchTerm);
    });

  // 납품처 검색
  document.getElementById('client-search-btn').addEventListener('click', () => {
    const searchTerm = document
      .getElementById('client-search')
      .value.toLowerCase();
    searchTable('#client-table', searchTerm);
  });
}

// 테이블 검색 함수
function searchTable(tableId, searchTerm) {
  const table = document.querySelector(tableId);
  const rows = table.querySelectorAll('tbody tr');

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  if (searchTerm === '') {
    rows.forEach((row) => {
      row.style.display = '';
    });
  }
}

// 엑셀 파일 처리 함수들
function handleExcelFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // 데이터 처리 및 계산
    const processedData = processExcelData(jsonData);

    // 재고 테이블 업데이트
    updateInventoryTable(processedData);
  };
  reader.readAsArrayBuffer(file);
}

// 엑셀 데이터 처리 및 계산
function processExcelData(data) {
  return data.map((item) => {
    // 필드명이 다를 경우 매핑
    const processedItem = {
      품번: item.품번 || item.품목코드 || '',
      단수: item.단수 || '',
      출수: item.출수 || '',
      품목1: item.품목1 || item.품목명 || item.품명 || '',
      가로: item.가로 || '',
      세로: item.세로 || '',
      높이: item.높이 || '',
      수량PLT: item.수량PLT || item['수량/PLT'] || '',
      LT: item.LT || '',
      납품처: item.납품처 || '',
      재고: parseInt(item.재고 || 0),
      PLT: item.PLT || '',
      ERP: parseInt(item.ERP || 0),
      출하1: parseInt(item.출하1 || 0),
      입고: parseInt(item.입고 || 0),
      오차: 0,
      차이수량: 0,
    };

    // 오차 계산: ERP - 재고
    processedItem.오차 = processedItem.ERP - processedItem.재고;

    // 차이수량 계산: 오차에 따른 차이
    processedItem.차이수량 = -processedItem.오차;

    return processedItem;
  });
}

function updateInventoryTable(data) {
  const inventoryTableBody = document.querySelector('#inventory-table tbody');
  inventoryTableBody.innerHTML = '';

  data.forEach((item) => {
    const row = document.createElement('tr');

    // 재고가 ERP보다 적으면 강조 표시
    const stockClass = item.재고 < item.ERP ? 'class="low-stock"' : '';

    // 오차나 차이수량이 0이 아니면 강조 표시
    const errorClass =
      item.오차 !== 0 || item.차이수량 !== 0 ? 'class="low-stock"' : '';

    row.innerHTML = `
      <td>${item.품번 || ''}</td>
      <td>${item.단수 || ''}</td>
      <td>${item.출수 || ''}</td>
      <td>${item.품목1 || ''}</td>
      <td>${item.가로 || ''}</td>
      <td>${item.세로 || ''}</td>
      <td>${item.높이 || ''}</td>
      <td>${item.수량PLT || ''}</td>
      <td>${item.LT || ''}</td>
      <td>${item.납품처 || ''}</td>
      <td ${stockClass}>${item.재고 || 0}</td>
      <td>${item.PLT || ''}</td>
      <td>${item.ERP || 0}</td>
      <td>${item.출하1 || ''}</td>
      <td>${item.입고 || 0}</td>
      <td ${errorClass}>${item.오차 || 0}</td>
      <td ${errorClass}>${item.차이수량 || 0}</td>
      <td>
        <button class="edit-btn">수정</button>
        <button class="delete-btn">삭제</button>
      </td>
    `;
    inventoryTableBody.appendChild(row);
  });

  // 대시보드 업데이트
  updateDashboard(data);
}

// 대시보드 업데이트 함수
function updateDashboard(data) {
  // 재고 부족 항목 계산
  const lowStockItems = data.filter((item) => item.재고 < item.ERP).length;
  document.getElementById('low-stock').textContent = lowStockItems;

  // 총 재고 수량 계산
  const totalStock = data.reduce((sum, item) => sum + (item.재고 || 0), 0);
  const dashboardNumbers = document.querySelectorAll('.dashboard-number');
  dashboardNumbers[2].textContent = totalStock.toLocaleString();
}

function exportToExcel() {
  // 현재 테이블 데이터 가져오기
  const table = document.getElementById('inventory-table');
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  // 데이터 추출
  const data = rows.map((row) => {
    const cells = Array.from(row.querySelectorAll('td'));
    return {
      품번: cells[0].textContent,
      단수: cells[1].textContent,
      출수: cells[2].textContent,
      품목1: cells[3].textContent,
      가로: cells[4].textContent,
      세로: cells[5].textContent,
      높이: cells[6].textContent,
      수량PLT: cells[7].textContent,
      LT: cells[8].textContent,
      납품처: cells[9].textContent,
      재고: cells[10].textContent,
      PLT: cells[11].textContent,
      ERP: cells[12].textContent,
      출하1: cells[13].textContent,
      입고: cells[14].textContent,
      오차: cells[15].textContent,
      차이수량: cells[16].textContent,
    };
  });

  // 워크시트 생성
  const ws = XLSX.utils.json_to_sheet(data);

  // 워크북 생성 및 워크시트 추가
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '재고현황');

  // 파일 저장
  XLSX.writeFile(wb, '재고현황.xlsx');
}

// 입고 검색 기능
function setupInboundSearch() {
  document
    .getElementById('inbound-search-btn')
    .addEventListener('click', () => {
      searchInboundTable();
    });

  // 엔터 키 검색 지원
  document
    .getElementById('inbound-search')
    .addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchInboundTable();
      }
    });
}

// 입고 테이블 검색 실행
function searchInboundTable() {
  const searchTerm = document
    .getElementById('inbound-search')
    .value.toLowerCase();
  const rows = inboundTableBody.querySelectorAll('tr');

  rows.forEach((row) => {
    const partNo = row.querySelectorAll('td')[1].textContent.toLowerCase();
    const item = row.querySelectorAll('td')[4].textContent.toLowerCase();
    const location = row.querySelectorAll('td')[9].textContent.toLowerCase();

    if (
      partNo.includes(searchTerm) ||
      item.includes(searchTerm) ||
      location.includes(searchTerm)
    ) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}
