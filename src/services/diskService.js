import axios from "axios";
import { FILE_INFO_URL, DELETE_FILE_URL, SIGNIN_URL, SIGNUP_URL } from "@/config/apiConfig";

export async function fetchFiles(token, router, loadingCallback) {
  loadingCallback(true);
  try {
    const response = await axios.get(FILE_INFO_URL, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });
    return response.data.data;
  } catch (error) {
    console.error('請求文件列表失敗:', error);
    if (error.response && error.response.status === 401) {
      router.push('/');
    }
    throw new Error('無法取得文件列表，請稍後再試。')
  } finally {
    loadingCallback(false);
  }
}

export async function deleteFile(fileId, token) {
  try {
    await axios.get(DELETE_FILE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        fileID: fileId,
      }
    })
  } catch (error) {
    console.error('刪除失敗:', error);
    throw new Error('刪除失敗，請稍後再試。');
  }
}

export async function signin(username, password) {
  try {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);
    const response = await axios.post(SIGNIN_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.accessToken;
  } catch (error) {
    if (error.response) {
      console.error('API 錯誤回應:', error.response.data);
      throw new Error('登入失敗，請檢查你的帳號或密碼。');
    } else if (error.request) {
      console.error('API 無回應:', error.request);
      throw new Error('無法連接到伺服器，請檢查你的網路連線。');
    } else {
      console.error('請求設定錯誤:', error.message);
      throw new Error('發生未知錯誤，請稍後再試。');
    } 
  }
}

export async function signup(username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  await axios.post(SIGNUP_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}