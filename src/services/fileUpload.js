import { generateAesKeyAndIv, encryptFile, wrapKey, importPublicKey } from "@/utils/crypto";
import { UPLOAD_URL } from "@/config/apiConfig";
import { requestPublicKeys } from "./kmsService";
import axios from "axios";

async function encryptFileAndUpload(file, onProgressCallback, router) {
  try{
    const { aesKey, iv } = await generateAesKeyAndIv();
    const publicKeyInfo = await requestPublicKeys(localStorage.getItem('username'));
    const kmsKeyId = publicKeyInfo.keyID;
    const publicKey = await importPublicKey(publicKeyInfo.key);

    const encryptedFile = await encryptFile(file, aesKey, iv);
    const wrappedKey = await wrapKey(aesKey, publicKey);

    const formData = new FormData();
    formData.append('username', localStorage.getItem('username'));
    formData.append('filename', file.name);
    formData.append('kmsKeyID', kmsKeyId);
    formData.append('iv', new Blob([iv]));
    formData.append('encryptedKey', new Blob([wrappedKey]));
    formData.append('encryptedFile', encryptedFile);

    const token = localStorage.getItem('accessToken');

    const response = await axios.post(UPLOAD_URL, formData, { // 替換為你的上傳加密檔案的 API 端點
        headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
        },
        onUploadProgress: (progressEvent) => {
          const uploadProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if(onProgressCallback){
            onProgressCallback(uploadProgress)
          }
        },
    });
    return response;
  } catch (error) {
    console.error('檔案加密上傳失敗:', error);
    throw error; // 將錯誤拋出，讓 component 處理
  }
}

export { encryptFileAndUpload }
