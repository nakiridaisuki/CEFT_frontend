<template>
  <teleport to="body">
    <div class="modal-overlay" v-if="isVisible">
      <div class="modal-content">
        <h2>選擇使用者</h2>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜尋使用者名稱..."
          @input="filterUsers"
        />

        <h3>匹配結果：</h3>
        <div class="user-list">
          <p v-if="filteredUsers.length === 0 && searchQuery !== ''" class="no-match-message">沒有找到匹配的使用者。</p>
          <div v-for="user in filteredUsers" :key="user" class="user-item">
            <span class="user-id-text">{{ user }}</span>
            <button
              @click="addToSelected(user)"
              :disabled="isSelected(user)"
              class="action-button add-button"
            >
              {{ isSelected(user) ? '已加入' : '加入' }}
            </button>
          </div>
        </div>

        <h3>已選擇使用者：</h3>
        <div class="selected-users">
          <p v-if="selectedUserIds.length === 0" class="no-selection-message">尚未選擇任何使用者。</p>
          <ul>
            <li v-for="userId in selectedUserIds" :key="userId" class="selected-user-item">
              <span class="user-id-text">{{ userId }}</span>
              <button class="action-button remove-button" @click="removeSelected(userId)">移除</button>
            </li>
          </ul>
        </div>

        <div class="modal-actions">
          <button @click="confirmSelection" class="action-button confirm-button">確定</button>
          <button @click="closeModal" class="action-button cancel-button">取消</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import { getUserList } from '@/services/diskService';

export default {
  name: 'UserSelectionModal',
  props: {
    isVisible: {
      type: Boolean,
      required: true,
    },
    fileUsers: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      searchQuery: '',
      allUsers: [], // 從後端獲取的所有使用者 ID 列表
      filteredUsers: [], // 根據搜尋關鍵字篩選後的列表
      selectedUserIds: [], // 暫存區，存放已選擇的使用者 ID
      token: localStorage.getItem('accessToken'),
      userId: localStorage.getItem('username'),
    };
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        this.fetchUsers(); // 彈出視窗顯示時，獲取所有使用者
        this.selectedUserIds = []; // 每次開啟時清空已選擇的列表
        this.searchQuery = ''; // 清空搜尋欄
        this.filteredUsers = []; // 清空過濾結果
      }
    }
  },
  methods: {
    async fetchUsers() {
      try {
        this.allUsers = await getUserList(this.token);
        this.allUsers = this.allUsers.filter((item) => item != this.userId);
        this.selectedUserIds = this.fileUsers.filter((item) => item != this.userId)
        this.filteredUsers = this.allUsers;
      } catch (error) {
        console.error('獲取所有使用者 ID 失敗:', error);
      }
    },
    filterUsers() {
      if (!this.searchQuery) {
        this.filteredUsers = this.allUsers;
        return;
      }
      const query = this.searchQuery.toLowerCase();
      this.filteredUsers = this.allUsers.filter(user =>
        user.toLowerCase().includes(query)
      );
    },
    addToSelected(userId) {
      if (!this.isSelected(userId)) {
        this.selectedUserIds.push(userId);
      }
    },
    removeSelected(userId) {
      this.selectedUserIds = this.selectedUserIds.filter(id => id !== userId);
    },
    isSelected(userId) {
      return this.selectedUserIds.includes(userId);
    },
    confirmSelection() {
      this.selectedUserIds.push(this.userId);
      this.$emit('confirm', this.selectedUserIds);
      this.closeModal();
    },
    closeModal() {
      this.$emit('close');
    },
  },
};
</script>

<style scoped>

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4); /* 直接使用 rgba 值 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000; /* 確保它在最頂層 */
}

.modal-content {
  background: #2f3032; /* 直接使用顏色值 */
  color: #f0f0f0; /* 直接使用顏色值 */
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

h2 {
  color: #f0f0f0; /* 直接使用顏色值 */
  margin-bottom: 10px;
  text-align: center;
  font-size: 1.5em;
  font-weight: 600;
}

h3 {
  color: #a0a0a0; /* 直接使用顏色值 */
  margin-top: 15px;
  margin-bottom: 8px;
  font-size: 1.1em;
  font-weight: 500;
}

input[type="text"] {
  width: calc(100% - 20px);
  padding: 10px;
  border: 1px solid #3c4043; /* 直接使用顏色值 */
  border-radius: 4px;
  font-size: 1em;
  background-color: #242526;
  color: #f0f0f0; /* 直接使用顏色值 */
  outline: none;
  transition: border-color 0.2s ease;
}

input[type="text"]::placeholder {
  color: #a0a0a0; /* 直接使用顏色值 */
}

input[type="text"]:focus {
  border-color: #8ab4f8;
}

.user-list {
  padding: 0 5px;
  max-height: 100px;
  height: 100px;
  overflow-y: auto;
  background-color: #2f3032;
}

.selected-users {
  padding: 0 5px;
  max-height: 100px;
  overflow-y: auto;
  background-color: #2f3032;
}

/* 滾動條樣式 */
.user-list::-webkit-scrollbar,
.selected-users::-webkit-scrollbar {
  width: 8px;
}

.user-list::-webkit-scrollbar-thumb,
.selected-users::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 4px;
}

.user-list::-webkit-scrollbar-track,
.selected-users::-webkit-scrollbar-track {
  background-color: #333;
}


.no-match-message, .no-selection-message {
  color: #a0a0a0; /* 直接使用顏色值 */
  font-size: 0.9em;
  text-align: center;
  padding: 10px 0;
}

.user-item, .selected-user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px dashed #3c4043; /* 直接使用顏色值 */
  font-size: 1em;
}

.user-item:last-child, .selected-user-item:last-child {
  border-bottom: none;
}

.user-id-text {
  color: #f0f0f0; /* 直接使用顏色值 */
  font-weight: 500;
}

/* 通用動作按鈕樣式 */
.action-button {
  background-color: transparent;
  border: none;
  color: #f0f0f0; /* 直接使用顏色值 */
  font-size: 0.9em;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease;
  min-width: 60px;
  text-align: center;
}

.action-button:hover {
  background-color: #4a4a4a; /* 直接使用顏色值 */
  color: #f0f0f0; /* 直接使用顏色值 */
}

.add-button {
  color: #8ab4f8;
}

.add-button:hover {
  background-color: #4a4a4a;
  color: #8ab4f8;
}

.add-button:disabled {
  background-color: #333;
  color: #666;
  cursor: not-allowed;
}

.selected-users ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.remove-button {
  color: #fc657e;
}

.remove-button:hover {
  background-color: #4a4a4a;
  color: #fc657e;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 25px;
}

.confirm-button {
  background-color: #4CAF50; /* 直接使用顏色值 */
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1em;
}

.confirm-button:hover {
  background-color: #45a049; /* 直接使用顏色值 */
}

.cancel-button {
  background-color: #6c757d;
  color: white;
  font-weight: 500;
  padding: 10px 20px;
  border-radius: 5px;
  font-size: 1em;
}

.cancel-button:hover {
  background-color: #5a6268;
}

/* 響應式調整 */
@media (max-width: 600px) {
  .modal-content {
    padding: 20px;
  }
  .modal-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .modal-actions button {
    width: 100%;
  }
}
</style>
