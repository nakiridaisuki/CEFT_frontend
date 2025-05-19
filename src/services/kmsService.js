// src/kmsService.js
import axios from 'axios';
import { GET_KMS_KEY_URL } from '@/config/apiConfig';

const certificate = localStorage.getItem('userCertificate');

async function requestKeys(allowedUsers, type) {
  try {
    const formData = new FormData();
    formData.append('allowedUsers', allowedUsers);
    formData.append('certificate', certificate);
    formData.append('keyType', type);

    const response = await axios.post(GET_KMS_KEY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 確保使用 FormData 時設定正確的 Content-Type
      },
    });
    return response.data.data; // 假設後端回傳包含 keyID 和 key 的資料
  } catch (error) {
    console.error('請求金鑰失敗:', error);
    throw error; // 將錯誤拋出，讓呼叫方處理
  }
}

export { requestKeys };