<template>
  <div>
    <button @click="openUserSelectionModal" class="download-action-button" :disabled="!isOwner">共用</button>

    <UserSelectionModal
      :isVisible="isModalVisible"
      :fileUsers="fileUsers"
      @close="isModalVisible = false"
      @confirm="handleUserSelectionConfirm"
    />
  </div>
</template>

<script>
import { updateFileKey } from '@/services/diskService';
import { fetchFileKeyData } from '@/services/fileDownload';
import { requestPrivateKeys, requestPublicKeys } from '@/services/kmsService';
import { importPrivateKey, importPublicKey, unwrapKey, wrapKey } from '@/utils/crypto';
import UserSelectionModal from './UserSelectionModal.vue'; // 確保路徑正確

export default {
  name: 'UpdateFileKey',
  components: {
    UserSelectionModal, // 註冊新的彈出視窗組件
  },
  props: {
    fileId: {
      type: Number,
      required: true,
    },
    fileUsers: {
      type: Object,
      required: true,
    },
    isOwner: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      message: '',
      token: localStorage.getItem('accessToken'),
      isModalVisible: false, // 控制彈出視窗的顯示狀態
    };
  },
  methods: {
    openUserSelectionModal() {
      this.isModalVisible = true; // 打開彈出視窗
      console.log(this.fileUsers);
    },
    async handleUserSelectionConfirm(selectedUserIds) {
      // 彈出視窗確定後，會將選擇的使用者 ID 列表傳遞過來
      if (selectedUserIds.length === 0) {
        this.message = '請至少選擇一個使用者。';
        return;
      }

      try {
        // 1. 從後端得到金鑰資訊，解密金鑰
        const fileKeyData = await fetchFileKeyData(this.fileId);
        const oldPrivateKeyPEM = await requestPrivateKeys(fileKeyData.kmsKeyId);
        const oldPrivateKey = await importPrivateKey(oldPrivateKeyPEM.key);
        const unwrapedKey = await unwrapKey(fileKeyData.encryptedKey, oldPrivateKey);

        // 2. 從後端獲得新的金鑰，利用新金鑰加密金鑰資訊
        // 這裡只傳遞第一個選中的使用者 ID
        const newPublicKeyPEM = await requestPublicKeys(selectedUserIds);
        const newPublicKey = await importPublicKey(newPublicKeyPEM.key);
        const newWrapedKey = await wrapKey(unwrapedKey, newPublicKey);

        // 3. 上傳新的金鑰資訊
        await updateFileKey(this.token, this.fileId, newPublicKeyPEM.keyID, newWrapedKey, selectedUserIds);

        this.$emit('updated');
        this.message = '金鑰資訊處理完成！';
      } catch (error) {
        console.error('金鑰處理過程中發生錯誤:', error);
        this.message = `金鑰處理失敗: ${error.message}`;
      }
    },
  },
};
</script>

<style scoped>
/* 引用下載按鈕的風格 */
.download-action-button {
  padding: 8px; /* 調整 padding 以適應 FileListDisplay 中的 action-button */
  background-color: transparent; /* 預設為透明 */
  border: none;
  color: #dadada; /* 預設文字顏色 */
  font-size: 1.1em;
  cursor: pointer;
  border-radius: 40%;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.download-action-button:hover:enabled {
  background-color: #4a4a4a; /* hover 時背景變色 */
  color: #a1eca1; /* hover 時顏色變為藍色 */
}

.download-action-button:disabled {
  cursor: not-allowed;
  color: #888888; /* 禁用時文字顏色 */
}

.error-message {
  color: red;
  font-size: 0.8em;
  margin-top: 5px;
  text-align: center; /* 讓錯誤訊息居中 */
}

/* 原始的 p 標籤樣式可以保留 */
p {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}
</style>
