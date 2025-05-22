<template>
  <div class="file-list-container">
    <div v-if="files.length === 0 && !loading" class="no-files-message">
      您還沒有上傳任何檔案。點擊左側的「新增檔案」按鈕開始吧！
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
          <FileDownload
            :file-id="file.id"
            :filename="file.name"
            @download-error="handleDownloadError"
          />
          <button @click="deleteFile(file.id)" class="action-button delete-button" title="刪除">刪除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatFileSize, formatDate } from '@/utils/utile';
import FileDownload from './FileDownload.vue';
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export default {
  name: 'FileListDisplay',
  components: {
    FileDownload, // 註冊 EncryptedFileDownloader 元件
  },
  props: {
    files: {
      type: Array,
      required: true,
      default: () => [],
    },
    loading: {
      type: Boolean,
      required: true,
      default: false,
    },
    searchQuery: {
      type: String,
      default: '',
    },
  },
  computed: {
    filteredFiles() {
      if (!this.searchQuery) {
        return this.files;
      }
      const query = this.searchQuery.toLowerCase();
      return this.files.filter(file =>
        file.name.toLowerCase().includes(query)
      );
    }
  },
  methods: {
    formatFileSize,
    formatDate,
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
    // 移除 downloadFile 方法，因為它現在由 EncryptedFileDownloader 內部處理
    // downloadFile(fileId, fileName) {
    //   this.$emit('download-file', fileId, fileName);
    // },
    deleteFile(fileId) {
      // 仍然發出刪除事件給父元件 UserDashboard
      this.$emit('delete-file', fileId);
    },
    handleDownloadError(error) {
      if(error.status == 401) {
        toast(`下載失敗：${error.message}`, {
          "theme": "dark",
          "type": "error",
          "position": "bottom-right",
          "transition": "slide",
          "dangerouslyHTMLString": true,
        })
      }
    }
  },
};
</script>

<style scoped>

.file-list-container {
  width: 100%;
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
  gap: 30px;
  width: 100%;
  padding-top: 15px;
  border-top: 1px solid #3c4043;
}

/* 這是 FileListDisplay 中通用按鈕的樣式 */
.action-button {
  background-color: transparent;
  border: none;
  color: #dadada;
  font-size: 1.1em;
  cursor: pointer;
  padding: 8px;
  border-radius: 40%;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.action-button:hover {
  background-color: #4a4a4a;
  color: #f0f0f0;
}

/* 刪除按鈕的特殊 hover 顏色 */
.delete-button:hover {
  color: #fc657e;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .file-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 480px) {
  .file-grid {
    grid-template-columns: 1fr;
  }
}
</style>
