<template>
  <div class="dashboard-container">
    <aside class="sidebar">
      <h1 class="app-title sidebar-title">我的檔案</h1> <button class="upload-button large-button" @click="openUploadModal">
        <i class="fas fa-plus"></i> 上傳
      </button>

      <nav class="sidebar-nav">
        <a href="#" class="nav-item active">
          <i class="fas fa-folder"></i> 我的檔案
        </a>
        <a href="#" class="nav-item">
          <i class="fas fa-share-alt"></i> 共享檔案
        </a>
        <a href="#" class="nav-item">
          <i class="fas fa-star"></i> 已加星號
        </a>
        <a href="#" class="nav-item">
          <i class="fas fa-trash-alt"></i> 垃圾桶
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="certificate-management-wrapper" ref="certificateButtonWrapper">
          <a href="#" 
             @click.prevent="toggleCertificatePopover" 
             class="nav-item small-button"
             :class="{ 'has-certificate': hasCertificate }" >
            <i class="fas fa-certificate"></i> 憑證狀態： {{ hasCertificate ? '已儲存' : '未儲存' }}
            <i v-if="hasCertificate" class="fas fa-check certificate-check-icon"></i>
          </a>
          
          <CertificateSetup
            v-if="showCertificatePopover" 
            @close="showCertificatePopover = false"
            @certificateSaved="handleCertificateSaved"
            @clickOutside="handleClickOutsideCertificatePopover"
            :class="{ 'show': showCertificatePopover }"
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
          <h2>我的文件</h2>
        </div>

        <div v-if="fileList.length === 0 && !loading" class="no-files-message">
          您還沒有上傳任何檔案。點擊左側的「上傳」按鈕開始吧！
        </div>

        <div v-else-if="loading" class="loading-message">
          <i class="fas fa-spinner fa-spin"></i> 載入檔案中...
        </div>

        <div v-else class="file-grid">
          <div v-for="file in filteredFiles" :key="file.id" class="file-card">
            <div class="file-icon">
              <i :class="getFileIcon(file.name)"></i>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.time) }}</span>
            </div>
            <div class="file-actions">
              <button @click="downloadFile(file.id, file.name)" class="action-button download-button" title="下載">
                <i class="fas fa-download"></i>
              </button>
              <button @click="deleteFile(file.id)" class="action-button delete-button" title="刪除">
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <FileUpload
      v-if="showUploadModal" 
      @close="showUploadModal = false"
      @file-uploaded="fetchFiles"
    />

    </div>
</template>

<script>
import FileUpload from './FileUpload.vue';
import RequestCertificate from './RequestCertificate.vue';
import FileDownloader from './FileDownload.vue'; // 匯入 FileDownloader component
import { formatFileSize, formatDate } from '@/utils/utile';
import { deleteFile, fetchFiles } from '@/services/diskService';
import CertificateSetup from './CertificateSetup.vue';

export default {
  name: 'UserDashboard',
  components: {
    CertificateSetup,
    FileUpload,
    RequestCertificate,
    FileDownloader,
  },
  data() {
    return {
      username: '',
      token: '',
      fileList: [],
      searchQuery: '',
      isUserDropdownOpen: false,
      loading: false,
      showUploadModal: false,
      showCertificatePopover: false,
      hasCertificate: false,
    };
  },
  computed: {
    filteredFiles() {
      if (!this.searchQuery) {
        return this.fileList;
      }
      const query = this.searchQuery.toLowerCase();
      return this.files.filter(file =>
        file.name.toLowerCase().includes(query)
      );
    }
  },
  async mounted() {
    this.username = localStorage.getItem('username');
    this.token = localStorage.getItem('accessToken');
    await this.fetchFiles();
    document.addEventListener('click', this.handleClickOutsideCertificatePopover);
    this.checkCertificate();
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutsideCertificatePopover);
  },
  methods: {
    toggleUserDropdown() {
      this.isUserDropdownOpen = !this.isUserDropdownOpen;
    },
    viewProfile() {
      alert('查看個人資料功能待開發！');
      this.isUserDropdownOpen = false;
      // 實際應用中，會導向到個人資料頁面
      // this.$router.push('/profile');
    },
    openSettings() {
      alert('設定功能待開發！');
      this.isUserDropdownOpen = false;
      // 實際應用中，會導向到設定頁面
      // this.$router.push('/settings');
    },
    handleLogout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userCertificate');
      localStorage.removeItem('username');
      this.isUserDropdownOpen = false;
      this.$router.push('/');
    },
    openUploadModal() {
      this.showUploadModal = true;
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
    formatDate,
    formatFileSize,
    checkCertificate() {
      if(localStorage.getItem('userCertificate'))
        this.hasCertificate = true;
    },
    getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
      switch (ext) {
        case 'pdf': return 'fas fa-file-pdf';
        case 'doc':
        case 'docx': return 'fas fa-file-word';
        case 'xls':
        case 'xlsx': return 'fas fa-file-excel';
        case 'ppt':
        case 'pptx': return 'fas fa-file-powerpoint';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'fas fa-file-image';
        case 'zip':
        case 'rar': return 'fas fa-file-archive';
        case 'txt': return 'fas fa-file-alt';
        case 'mp3':
        case 'wav': return 'fas fa-file-audio';
        case 'mp4':
        case 'avi':
        case 'mov': return 'fas fa-file-video';
        case 'cpp':
        case 'c':
        case 'h':
        case 'py':
        case 'js':
        case 'html':
        case 'css': return 'fas fa-file-code';
        default: return 'fas fa-file';
      }
    },
    toggleCertificatePopover() {
      this.showCertificatePopover = !this.showCertificatePopover;
    },
    handleCertificateSaved() {
      this.checkCertificate();
      this.showCertificatePopover = false; // 上傳成功後關閉 Popover
    },
    handleClickOutsideCertificatePopover() {
      // 判斷是否是點擊了「憑證管理」按鈕本身
      // 如果點擊的目標不是「憑證管理」按鈕及其子元素，也不是 Popover 本身及其子元素，就關閉 Popover
      // 我們需要獲取點擊事件的目標
      const clickedElement = event.target;
      const certificateButton = this.$refs.certificateButtonWrapper;
      const popoverElement = this.$refs.certificateButtonWrapper.querySelector('.certificate-popover'); // 獲取實際渲染的 popover 元素

      if (certificateButton && !certificateButton.contains(clickedElement) && 
          popoverElement && !popoverElement.contains(clickedElement)) {
        this.showCertificatePopover = false;
      }
    }
  },
};
</script>

<style scoped>
.dashboard-container {
  display: grid; /* 使用 Grid 佈局 */
  grid-template-columns: 250px 1fr; /* 左側邊欄和主內容區 */
  grid-template-rows: 1fr; /* 只有一行，高度由內容決定或由其父級撐開 */
  
  height: 100vh; /* 讓 dashboard-container 佔滿整個視窗高度 */

  background-color: #202124; /* 深灰色背景 */
  color: #e8eaed; /* 淺色文字 */
  font-family: 'Roboto', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

  /* 移除這個容器的 overflow 屬性，讓內部元素自行管理滾動 */
  overflow: hidden; 
}

/* 左側邊欄樣式 */
.sidebar {
  grid-column: 1; /* 位於第一列 */
  background-color: #2f3032; /* 側邊欄背景 */
  padding: 20px;
  border-right: 1px solid #3c4043;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 內容左對齊 */
  gap: 20px; /* 元素間距 */
  overflow-y: auto; /* 如果側邊欄內容過多，則側邊欄可以自己滾動 */
  overflow-x: hidden;
}

.sidebar-title {
  font-size: 1.8em;
  font-weight: 500;
  color: #f0f0f0;
  margin-top: 0;
  margin-bottom: 30px; 
  width: 100%; 
  text-align: center; 
}

.sidebar .upload-button { 
  width: calc(100% - 20px); 
  text-align: left; 
  padding: 12px 15px; 
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3); 
}

.sidebar-nav {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px; 
  margin-top: 20px;
  border-top: 1px solid #3c4043; 
  padding-top: 20px;
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
  color: #8ab4f8; 
  font-weight: 500;
}

.nav-item.active i {
  color: #8ab4f8; 
}

.sidebar-footer {
  margin-top: auto; /* 推到底部 */
  width: 100%;
  padding-top: 20px;
  border-top: 1px solid #3c4043;
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
  grid-column: 2; /* 位於第二列 */
  display: flex;
  flex-direction: column; /* 讓 navbar 和 content-area 垂直堆疊 */
  flex-grow: 1; /* 讓它填滿剩餘高度 */
  overflow: hidden; /* 防止 main-content-wrapper 滾動 */
}

/* 頂部導航欄 */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #2f3032; 
  border-bottom: 1px solid #3c4043;
  /* position: sticky; top: 0; z-index: 1000;  這些可以保留，但現在 navbar 本身就是 flex-direction: column; 中的一個固定部分 */
  flex-shrink: 0; /* 防止 navbar 在空間不足時收縮 */
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

.certificate-management-wrapper {
  position: relative; /* **關鍵！** 讓 Popover 相對於此容器定位 */
  width: 100%; /* 讓它佔滿父級寬度 */
}

/* 憑證管理按鈕的基礎樣式 */
.nav-item.small-button {
  width: 100%;
  text-align: center;
  padding: 10px 15px;
  background-color: #4a4a4a; /* 預設背景色 */
  color: #e8eaed; /* 預設文字顏色 */
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative; /* **確保按鈕本身是相對定位，以便小打勾可以絕對定位在其中** */
  display: flex; /* **使用 Flexbox 讓圖標和文字居中對齊** */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  gap: 8px; /* 圖標和文字之間的間距 */
}

.nav-item.small-button i {
  /* 憑證圖標的預設顏色 */
  color: #a0a0a0; 
}

.nav-item.small-button:hover {
  background-color: #555;
}

/* 憑證啟用時的樣式 (綠色背景) */
.nav-item.small-button.has-certificate {
  background-color: #4CAF50; /* 綠色背景 */
  color: #202124; /* 深色文字以便閱讀 */
  font-weight: bold; /* 加粗文字 */
}

.nav-item.small-button.has-certificate i {
  color: #202124; /* 圖標也變為深色 */
}

.nav-item.small-button.has-certificate:hover {
  background-color: #45a049; /* hover 時稍微變暗 */
}

/* **小打勾圖標的樣式** */
.certificate-check-icon {
  font-size: 0.9em; /* 小打勾的大小 */
  color: #202124; /* 綠色背景下的深色勾 */
  /* 如果不需要與憑證圖標錯位，直接放在文字旁邊即可，無需絕對定位 */
  /* 如果想要它在憑證圖標的右上角，則需要如下設置 */
  /* position: absolute;
  top: 5px; 
  right: 5px; 
  background-color: #202124; 
  border-radius: 50%;
  padding: 2px;
  border: 1px solid #4CAF50; */
}

/* 在 has-certificate 狀態下，確保憑證圖標和打勾圖標顏色一致 */
.nav-item.small-button.has-certificate .fa-certificate,
.nav-item.small-button.has-certificate .certificate-check-icon {
    color: #202124; /* 統一為綠色背景下的深色 */
}

/* 內容區域 - 現在它會自動佔滿 main-content-wrapper 的剩餘空間 */
.content-area {
  flex-grow: 1; /* 讓它填滿 main-content-wrapper 的剩餘高度 */
  padding: 30px;
  width: 100%; 
  /* 關鍵！讓 content-area 在內容溢出時才滾動 */
  overflow-y: auto; 
  overflow-x: hidden; /* 防止水平滾動 */
  position: relative; /* 確保內容相對於此元素定位 */
}

/* 以下是文件列表的樣式，基本保持不變 */
.file-list-header h2 {
  font-size: 1.6em;
  font-weight: 500;
  color: #f0f0f0;
  margin-bottom: 25px;
  border-bottom: 1px solid #3c4043;
  padding-bottom: 10px;
}

.no-files-message, .loading-message {
  text-align: center;
  color: #a0a0a0;
  font-size: 1.1em;
  padding: 50px 20px;
  background-color: #2f3032;
  border-radius: 8px;
  margin-top: 20px;
}

.loading-message i {
  margin-right: 10px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.file-card {
  background-color: #2f3032;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
}

.file-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
}

.file-icon {
  font-size: 3em;
  color: #8ab4f8;
  margin-bottom: 15px;
}

.file-icon i {
  width: 1em;
  text-align: center;
}

.file-info {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 100%;
  margin-bottom: 15px;
}

.file-name {
  font-size: 1.1em;
  font-weight: 500;
  color: #f0f0f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.file-size, .file-date {
  font-size: 0.85em;
  color: #a0a0a0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding-top: 15px;
  border-top: 1px solid #3c4043;
}

.action-button {
  background-color: transparent;
  border: none;
  color: #a0a0a0;
  font-size: 1.1em;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.action-button:hover {
  background-color: #4a4a4a;
  color: #f0f0f0;
}

.download-button:hover {
  color: #8ab4f8;
}

.delete-button:hover {
  color: #ff4d4f;
}


/* 響應式調整 */
@media (max-width: 768px) {
  .dashboard-container {
    grid-template-columns: 1fr; /* 在小螢幕上變為單列 */
    height: auto; /* 在小螢幕上高度自適應，允許整個頁面滾動 */
    overflow-y: auto; /* 允許整個頁面滾動 */
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid #3c4043; 
    padding: 15px;
    flex-direction: row; 
    justify-content: space-around; 
    gap: 10px;
    position: sticky; /* 讓側邊欄固定在頂部 */
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
    /* 在小螢幕上，main-content-wrapper 不再需要 flex-grow: 1; 
       因為 dashboard-container 本身可以滾動 */
    flex-grow: 0; 
  }
  /* 在小螢幕上，content-area 的滾動行為可能與大螢幕不同，
     因為整個頁面已經可以滾動了。 */
  .content-area {
    overflow-y: visible; /* 允許內容溢出，讓父級容器滾動 */
    height: auto; /* 高度自動 */
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
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); 
  }
  .content-area {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .file-grid {
    grid-template-columns: 1fr; 
  }
}
</style>