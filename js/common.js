/**
 * 자동차 부품 재고 관리 시스템 - 공통 JavaScript 파일
 * 모든 페이지에서 공통으로 사용되는 함수들을 정의합니다.
 */

// 전역 상태 관리
const state = {
  currentUser: null,
  isAuthenticated: false,
};

// 유틸리티 함수들
const utils = {
  // 날짜 포맷팅
  formatDate(date) {
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  },

  // 숫자 포맷팅
  formatNumber(number) {
    return new Intl.NumberFormat('ko-KR').format(number);
  },

  // 입력값 검증
  validateInput(value, type) {
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'phone':
        return /^[0-9-]+$/.test(value);
      case 'businessNo':
        return /^[0-9-]+$/.test(value);
      default:
        return true;
    }
  },

  // 로컬 스토리지 관리
  storage: {
    get(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('로컬 스토리지 읽기 오류:', error);
        return null;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('로컬 스토리지 쓰기 오류:', error);
        return false;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('로컬 스토리지 삭제 오류:', error);
        return false;
      }
    },
  },

  // 엑셀 파일 처리
  excel: {
    export(data, sheetName, fileName) {
      try {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
        return true;
      } catch (error) {
        console.error('엑셀 내보내기 오류:', error);
        return false;
      }
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
};

// UI 컴포넌트
const ui = {
  // 알림 표시
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
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

    init() {
      window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
          event.target.style.display = 'none';
        }
      });
    },
  },

  // 테이블 관리
  table: {
    init(tableId) {
      const table = document.getElementById(tableId);
      if (!table) return null;

      return {
        body: table.querySelector('tbody'),
        addRow(data, template) {
          const row = document.createElement('tr');
          row.innerHTML = template(data);
          this.body.appendChild(row);
          return row;
        },
        clear() {
          this.body.innerHTML = '';
        },
        search(term, columns) {
          const rows = this.body.querySelectorAll('tr');
          rows.forEach((row) => {
            const text = Array.from(row.cells)
              .map((cell) => cell.textContent.toLowerCase())
              .join(' ');
            row.style.display = text.includes(term.toLowerCase()) ? '' : 'none';
          });
        },
      };
    },
  },
};

// 이벤트 핸들러
const events = {
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
        handler(e);
      });
    }
  },
};

// 페이지 초기화
document.addEventListener('DOMContentLoaded', () => {
  // 모달 초기화
  ui.modal.init();

  // 현재 페이지 메뉴 활성화
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-menu a').forEach((link) => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});

// 전역 객체로 내보내기
window.app = {
  state,
  utils,
  ui,
  events,
};
