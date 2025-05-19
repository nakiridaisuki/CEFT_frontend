<template>
  <div class="dashboard-container">
    <h2>歡迎回來！{{ username }}</h2>

    <div class="certificate-upload-area">
      <h3>上傳我的數位憑證 (PEM 格式)</h3>
      <input type="file" accept=".pem" @change="handleCertificateUpload">
      <button @click="saveCertificateToLocal" :disabled="!uploadedCertificate">
        儲存憑證到本地
      </button>
      <div v-if="certificateUploadMessage" class="message">{{ certificateUploadMessage }}</div>
    </div>

    <div class="navigation">
      <button :class="{ active: activeTab === 'files' }" @click="activeTab = 'files'">文件列表</button>
      <button :class="{ active: activeTab === 'certificate' }" @click="activeTab = 'certificate'">請求憑證</button>
    </div>

    <div v-if="activeTab === 'files'">
      <FileUpload @file-uploaded="fetchFiles" />
      <div v-if="loading">載入中，請稍候...</div>
      <div v-else-if="error">{{ error }}</div>
      <div v-else-if="fileList.length > 0">
        <h3>你的文件列表：</h3>
        <ul>
          <li v-for="file in fileList" :key="file.id" class="file-item">
            名稱：{{ file.name }} | 大小：{{ formatFileSize(file.size) }} | 上傳時間：{{ formatDate(file.time) }}
            <FileDownloader :fileId="file.id" :filename="file.name" />
            <button @click="deleteFile(file.id)">刪除</button>
          </li>
        </ul>
      </div>
      <div v-else>
        目前沒有任何文件。
      </div>
    </div>

    <RequestCertificate v-if="activeTab === 'certificate'" />

    <button @click="logout">登出</button>
  </div>
</template>

<script>
import axios from 'axios';
import FileUpload from './FileUpload.vue';
import RequestCertificate from './RequestCertificate.vue';
import FileDownloader from './FileDownload.vue'; // 匯入 FileDownloader component
import { DELETE_FILE_URL, FILE_INFO_URL } from '../config/apiConfig';
import { formatFileSize, formatDate } from '@/utils/utile';

export default {
  name: 'UserDashboard',
  components: {
    FileUpload,
    RequestCertificate,
    FileDownloader, // 註冊 FileDownloader component
  },
  data() {
    return {
      username: localStorage.getItem('username') || '使用者',
      token: localStorage.getItem('accessToken'),
      fileList: [],
      loading: false,
      error: null,
      activeTab: 'files',
      uploadedCertificate: null,
      certificateUploadMessage: '',
    };
  },
  async mounted() {
    this.fetchFiles();
  },
  methods: {
    async deleteFile(fileid) {
      try {
        await axios.get(DELETE_FILE_URL, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          params: {
            fileID: fileid,
          }
        })
      } catch (error) {
        console.error('刪除失敗:', error);
        this.error = '刪除失敗，請稍後再試。';
      } finally {
        this.fetchFiles()
      }
    },
    async fetchFiles() {
      this.loading = true;
      this.error = null;
      try {
        if (!this.token) {
          this.error = '未找到登入憑證，請重新登入。';
          return;
        }

        const response = await axios.get(FILE_INFO_URL, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        this.fileList = response.data.data;

      } catch (error) {
        console.error('請求文件列表失敗:', error);
        this.error = '無法取得文件列表，請稍後再試。';
        if (error.response && error.response.status === 401) {
          this.$router.push('/');
        }
      } finally {
        this.loading = false;
      }
    },
    handleCertificateUpload(event) {
      const file = event.target.files[0];
      if (file && file.type === 'application/x-pem-file' || file.name.endsWith('.pem')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.uploadedCertificate = e.target.result;
          this.certificateUploadMessage = '憑證已選擇，您可以儲存到本地。';
        };
        reader.onerror = () => {
          this.uploadedCertificate = null;
          this.certificateUploadMessage = '讀取憑證檔案失敗。';
        };
        reader.readAsText(file);
      } else if (file) {
        this.uploadedCertificate = null;
        this.certificateUploadMessage = '請上傳 .pem 格式的憑證檔案。';
      } else {
        this.uploadedCertificate = null;
        this.certificateUploadMessage = '';
      }
    },
    saveCertificateToLocal() {
      if (this.uploadedCertificate) {
        localStorage.setItem('userCertificate', this.uploadedCertificate);
        this.certificateUploadMessage = '憑證已成功儲存到本地。';
      } else {
        this.certificateUploadMessage = '請先上傳憑證檔案。';
      }
    },
    logout() {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('username');
      this.$router.push('/');
    },
    formatDate,
    formatFileSize,
  },
};
</script>

<style scoped>
/* ... 之前的樣式 ... */
.certificate-upload-area {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.certificate-upload-area h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #555;
}

.certificate-upload-area input[type="file"] {
  margin-bottom: 10px;
}

.certificate-upload-area button {
  padding: 8px 15px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.certificate-upload-area button:hover:enabled {
  background-color: #1e7e34;
}

.certificate-upload-area button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.certificate-upload-area .message {
  margin-top: 10px;
  font-size: 0.9em;
  color: green;
}
</style>