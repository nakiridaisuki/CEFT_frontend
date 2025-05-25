// src/kmsService.js
import axios from 'axios';
import { GET_KMS_KEY_URL, GENERATE_CERTIFICATE_URL } from '@/config/apiConfig';

export async function requestPublicKeys(allowedUsers) {
  try {
    const formData = new FormData();
    formData.append('allowedUsers', allowedUsers);
    formData.append('certificate', localStorage.getItem('userCertificate'));
    formData.append('keyType', 'public');

    const response = await axios.post(GET_KMS_KEY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 確保使用 FormData 時設定正確的 Content-Type
      },
    });

    localStorage.setItem('userCertificate', response.data.data.certificate);
    return response.data.data; // 假設後端回傳包含 keyID 和 key 的資料
  } catch (error) {
    console.error('請求金鑰失敗:', error);
    throw error; // 將錯誤拋出，讓呼叫方處理
  }
}

export async function requestPrivateKeys(allowedUsers) {
  try {
    const formData = new FormData();
    formData.append('allowedUsers', allowedUsers);
    formData.append('certificate', localStorage.getItem('userCertificate'));
    formData.append('keyType', 'private');

    const response = await axios.post(GET_KMS_KEY_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // 確保使用 FormData 時設定正確的 Content-Type
      },
    });

    localStorage.setItem('userCertificate', response.data.data.certificate);
    return response.data.data; // 假設後端回傳包含 keyID 和 key 的資料
  } catch (error) {
    console.error('請求金鑰失敗:', error);
    throw error; // 將錯誤拋出，讓呼叫方處理
  }
}

export async function requestCertificate(csr) {
  const formData = new FormData();
  formData.append('timeStamp', Math.round(Date.now() / 1000));
  formData.append('userCSR', csr);
  const response = await axios.post(GENERATE_CERTIFICATE_URL, formData, {
    headers: {
      'Content-Type': 'application/form-data',
    },
  });
  return response.data.data.certificate;
}
