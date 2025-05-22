<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <h1 class="app-title sidebar-title">密碼碼密呀</h1>
      <FileUpload
        class="sidebar-fileUpload"
        @file-uploaded="fetchFiles"
      />

      <nav class="sidebar-nav">
        <a href="#" class="nav-item" :class="{ 'active': currentSidebarView === 'myFiles' }" @click.prevent="selectSidebarView('myFiles')">
          <i class="fas fa-folder"></i> 我的檔案
        </a>
        <a href="#" class="nav-item" :class="{ 'active': currentSidebarView === 'twoFactorAuth' }" @click.prevent="selectSidebarView('twoFactorAuth')">
          <i class="fas fa-shield-alt"></i> 兩階段驗證
        </a>
        <a href="#" class="nav-item" :class="{ 'active': currentSidebarView === 'requestCertificate' }" @click.prevent="selectSidebarView('requestCertificate')">
          <i class="fas fa-shield-alt"></i> 申請憑證
        </a>
      </nav>

      <div class="sidebar-footer" :class="{ 'shifted-up-footer': showCertificatePopover }">
        <div class="certificate-management-wrapper"
          ref="certificateButtonWrapper"
          @mouseenter="handleMouseEnterPopoverArea"
          @mouseleave="handleMouseLeavePopoverArea">
          <a href="#"
            class="nav-item small-button"
            :class="{ 'has-certificate': hasCertificate }" >
            <i class="fas fa-certificate"></i> 憑證狀態： {{ hasCertificate ? '已儲存' : '未儲存' }}
            <i v-if="hasCertificate" class="fas fa-check certificate-check-icon"></i>
          </a>

          <CertificateSetup
            @fileInputFocus="handleFileInputFocus"
            @fileSelected="handleFileSelectedInPopover"
            @certificateSaved="handleCertificateSaved"
            @close="handleCertificatePopoverClose"
            class='show'
          />
        </div>
      </div>
    </aside>

    <div class="main-content-wrapper">
      <header class="navbar">
        <div class="navbar-center">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input type="text" placeholder="搜尋您的檔案..." class="search-input" v-model="searchQuery">
          </div>
        </div>

        <div class="navbar-right">
          <div class="user-menu" @click="toggleUserDropdown">
            <span class="username">{{ username }}</span>
            <i class="fas fa-caret-down dropdown-arrow"></i>
          </div>
          <div v-if="isUserDropdownOpen" class="user-dropdown">
            <a href="#" @click.prevent="viewProfile">個人資料</a>
            <a href="#" @click.prevent="openSettings">設定</a>
            <a href="#" @click.prevent="handleLogout">登出</a>
          </div>
        </div>
      </header>

      <main class="content-area">
        <div class="file-list-header">
          <h1 v-if="currentSidebarView === 'myFiles'" class="navbar-title">{{ '我的檔案' }}</h1>
          <h1 v-else-if="currentSidebarView === 'twoFactorAuth'" class="navbar-title">{{ '兩階段驗證' }}</h1>
          <h1 v-else-if="currentSidebarView === 'requestCertificate'" class="navbar-title">{{ '申請憑證' }}</h1>
        </div>

        <FileListDisplay
          v-if="currentSidebarView === 'myFiles'"
          :files="fileList"
          :loading="loading"
          :search-query="searchQuery"
          @delete-file="deleteFile"
        />

        <TwoFactorAuthSetup
          v-else-if="currentSidebarView === 'twoFactorAuth'"
          :username="username"
          :hasExisting2FA="hasTwoFactorAuth"
          @twofa-change="checkUserTwoFactorAuthStatus"
        />

        <RequestCertificate
          v-else-if="currentSidebarView === 'requestCertificate'"
          :username="username"
          @certificateSaved="handleCertificateSaved"
        />

        </main>
    </div>
  </div>
</template>

<script>
import FileUpload from './FileUpload.vue';
import RequestCertificate from './RequestCertificate.vue';
import CertificateSetup from './CertificateSetup.vue';
import FileListDisplay from './FileListDisplay.vue';
import TwoFactorAuthSetup from './TwoFactorAuthSetup.vue';
import { deleteFile, fetchFiles, twofaCheck } from '@/services/diskService';

export default {
  name: 'UserDashboard',
  components: {
    CertificateSetup,
    FileUpload,
    RequestCertificate,
    TwoFactorAuthSetup,
    FileListDisplay,
  },
  data() {
    return {
      username: '',
      token: '',
      fileList: [],
      searchQuery: '',
      isUserDropdownOpen: false,
      loading: false,
      showCertificatePopover: false,
      hasCertificate: false,
      closePopoverTimeout: null,
      isFileInputActive: false,
      hasFileSelectedInPopover: false,

      currentSidebarView: 'myFiles',
      hasTwoFactorAuth: false,
    };
  },
  async mounted() {
    this.username = localStorage.getItem('username');
    this.token = localStorage.getItem('accessToken');
    await this.fetchFiles();
    this.checkCertificate();
  },
  beforeUnmount() {
    if (this.closePopoverTimeout) {
      clearTimeout(this.closePopoverTimeout);
    }
  },
  methods: {
    toggleUserDropdown() {
      this.isUserDropdownOpen = !this.isUserDropdownOpen;
    },
    viewProfile() {
      // alert('查看個人資料功能待開發！');
      this.isUserDropdownOpen = false;
    },
    openSettings() {
      // alert('設定功能待開發！');
      this.isUserDropdownOpen = false;
    },
    handleLogout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userCertificate');
      localStorage.removeItem('username');
      this.isUserDropdownOpen = false;
      this.$router.push('/');
    },
    loadingCallback(loading) {
      this.loading = loading;
    },
    async fetchFiles() {
      this.fileList = await fetchFiles(this.token, this.$router, this.loadingCallback);
    },
    async deleteFile(fileId) {
      await deleteFile(fileId, this.token);
      this.fetchFiles();
    },
    checkCertificate() {
      if(localStorage.getItem('userCertificate'))
        this.hasCertificate = true;
      else
        this.hasCertificate = false;
    },
    handleMouseEnterPopoverArea() {
      if (this.closePopoverTimeout) {
        clearTimeout(this.closePopoverTimeout);
        this.closePopoverTimeout = null;
      }
      this.showCertificatePopover = true;
    },
    handleMouseLeavePopoverArea() {
      if (!this.isFileInputActive && !this.hasFileSelectedInPopover) {
        this.closePopoverTimeout = setTimeout(() => {
          this.showCertificatePopover = false;
        }, 300);
      }
    },
    handleCertificateSaved() {
      this.checkCertificate();
      this.isFileInputActive = false;
      this.hasFileSelectedInPopover = false;
    },
    handleFileInputFocus() {
      this.isFileInputActive = true;
      if (this.closePopoverTimeout) {
        clearTimeout(this.closePopoverTimeout);
        this.closePopoverTimeout = null;
      }
    },
    handleFileSelectedInPopover() {
      this.hasFileSelectedInPopover = true;
      if (this.closePopoverTimeout) {
        clearTimeout(this.closePopoverTimeout);
        this.closePopoverTimeout = null;
      }
    },
    handleCertificatePopoverClose() {
      this.showCertificatePopover = false;
      this.isFileInputActive = false;
      this.hasFileSelectedInPopover = false;
      if (this.closePopoverTimeout) {
          clearTimeout(this.closePopoverTimeout);
          this.closePopoverTimeout = null;
      }
    },
    selectSidebarView(viewName) {
      this.currentSidebarView = viewName;
      if (viewName === 'myFiles') {
        this.searchQuery = ''; // 清空搜尋
      }
      if (viewName === 'twoFactorAuth') {
        this.checkUserTwoFactorAuthStatus();
      }
    },
    async checkUserTwoFactorAuthStatus() {
      // 這是一個假想的實現，你可能需要根據你的後端 API 來調整
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          this.hasTwoFactorAuth = await twofaCheck(token);
        }
      } catch (error) {
        console.error('檢查 2FA 狀態失敗:', error);
        this.hasTwoFactorAuth = false; // 預設為未啟用
      }
    },
  },
};
</script>

<style scoped>
/* 此處樣式保持不變，因為它們與檔案列表無關 */
.dashboard-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 1fr;

  height: 100vh;

  background-color: #202124;
  color: #e8eaed;
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  overflow: hidden;
}

.sidebar {
  grid-column: 1;
  background-color: #2f3032;
  padding: 20px;
  border-right: 1px solid #3c4043;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 20px;
  overflow-y: hidden;
  overflow-x: hidden;
}

.sidebar-title {
  font-size: 1.8em;
  font-weight: 500;
  color: #f0f0f0;
  margin-top: 0;
  margin-bottom: 10px;
  width: 100%;
  text-align: center;
}

.sidebar-nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid #3c4043;
  padding-top: 20px;
}

.sidebar-fileUpload{
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  color: #e8eaed;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-size: 1.05em;
  font-weight: 400;
}

.nav-item i {
  font-size: 1.1em;
  color: #a0a0a0;
}

.nav-item:hover {
  background-color: #3c4043;
  color: #f0f0f0;
}

.nav-item.active {
  background-color: #4a4a4a;
  color: #afaefc;
  font-weight: 500;
}

.nav-item.active i {
  color: #afaefc;
}

.sidebar-footer {
  margin-top: auto;
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid #3c4043;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: transform 0.5s ease-out;
  transform: translateY(0);
}

.sidebar-footer.shifted-up-footer {
  transform: translateY(-250px);
}

.sidebar-footer .small-button {
  width: 100%;
  text-align: center;
  padding: 10px 15px;
  background-color: #4a4a4a;
  color: #e8eaed;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.sidebar-footer .small-button:hover {
  background-color: #555;
}


/* 主內容區域的容器 */
.main-content-wrapper {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: hidden;
}

/* 頂部導航欄 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background-color: #2f3032;
  border-bottom: 1px solid #3c4043;
  flex-shrink: 0;
}

.navbar-title {
  font-size: 1.8em;
  font-weight: 500;
  color: #f0f0f0;
  margin-top: 0;
  margin-bottom: 20px;
  padding: 10px;
  width: 100%;
  text-align: left;
  border-bottom: 1px solid #3c4043;
}

.navbar-center {
  flex-grow: 1;
  display: flex;
  justify-content: flex-start;
  margin-left: 20px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.navbar-right {
  position: relative; /* 確保下拉選單相對於此定位 */
  display: flex;
  align-items: center;
}

.user-menu {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 50px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.user-menu:hover {
  background-color: #3c4043;
}

.username {
  font-weight: 500;
  font-size: 1.5em;
  color: #e8eaed;
}

.dropdown-arrow {
  color: #a0a0a0;
  transition: transform 0.2s ease;
}

.user-menu.active .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: 100%; /* 位於使用者選單下方 */
  right: 0;
  background-color: #2f3032;
  border: 1px solid #3c4043;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  min-width: 150px;
  z-index: 1000; /* 確保在其他內容之上 */
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  margin-top: 5px; /* 與使用者選單之間的間距 */
}

.user-dropdown a {
  padding: 10px 15px;
  color: #e8eaed;
  text-decoration: none;
  display: block;
  transition: background-color 0.2s ease;
}

.user-dropdown a:hover {
  background-color: #3c4043;
}

.certificate-management-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: padding-bottom 0.5s ease-out;
}

.certificate-management-wrapper:hover {
  border-color: #8ab4f8;
}

.certificate-popover {
  position: absolute;
  top: auto;
  left: 50%;

  transform: translateX(-50%) translateY(50px);

  background-color: #2f3032;
  border-radius: 8px;
  padding: 20px;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 15px;
  color: #e8eaed;
  opacity: 0;
  transition: opacity 0.1s ease-out, transform 0.5s ease;
}


.certificate-popover.show {
  opacity: 1;
  transform: translateX(-50%) translateY(50px);
}

.nav-item.small-button {
  width: 100%;
  text-align: center;
  padding: 10px 15px;
  background-color: #4a4a4a;
  color: #e8eaed;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  pointer-events: none;

  transform: translateY(0);
  z-index: 2;
}

.nav-item.small-button i {
  color: #a0a0a0;
}

.nav-item.small-button.has-certificate {
  background-color: #57bd5a;
  color: #202124;
  font-weight: bold;
}

.nav-item.small-button.has-certificate i {
  color: #202124;
}

.nav-item.small-button.has-certificate:hover {
  background-color: #45a049;
}

.certificate-check-icon {
  font-size: 0.9em;
  color: #202124;
}

.nav-item.small-button.has-certificate .fa-certificate,
.nav-item.small-button.has-certificate .certificate-check-icon {
    color: #202124;
}

.content-area {
  flex-grow: 1;
  padding: 30px;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr;
    height: auto;
    overflow-y: auto;
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid #3c4043;
    padding: 15px;
    flex-direction: row;
    justify-content: space-around;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 999;
  }
  .sidebar-title {
    display: none;
  }
  .sidebar .upload-button {
    width: auto;
    padding: 8px 15px;
  }
  .sidebar-nav {
    display: none;
  }
  .sidebar-footer {
    display: none;
  }

  .main-content-wrapper {
    grid-column: 1;
    flex-grow: 0;
  }
  .content-area {
    overflow-y: visible;
    height: auto;
  }
  .navbar {
    flex-direction: column;
    gap: 15px;
    padding: 15px 20px;
  }
  .navbar-left, .navbar-right, .navbar-center {
    width: 100%;
    justify-content: center;
  }
  .search-box {
    max-width: 100%;
  }
  .content-area {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  /* 沒有針對檔案網格的媒體查詢 */
}
</style>
