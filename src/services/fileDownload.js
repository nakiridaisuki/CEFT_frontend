// src/services/fileDownloadService.js
import axios from 'axios';
import { GET_FILEKEY_URL, DOWNLOAD_URL } from '@/config/apiConfig';
import { base64ToArrayBuffer, hexStringToUint8Array } from '@/utils/utile';

async function fetchFileKeyData(fileID) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('未找到登入憑證。');
  }
  const response = await axios.get(GET_FILEKEY_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      fileID: fileID,
    },
  });
  return {
    kmsKeyId: response.data.data.kmsKeyID,
    iv: hexStringToUint8Array(response.data.data.iv), // 將 hex 字串轉換為 Uint8Array
    encryptedKey: base64ToArrayBuffer(response.data.data.encryptedKey),
  };
}

async function fetchEncryptedFile(fileID) {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('未找到登入憑證。');
  }
  const response = await axios.get(DOWNLOAD_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      fileID: fileID,
    },
    responseType: 'blob',
  });
  return response.data;
}

export { fetchFileKeyData, fetchEncryptedFile };