// src/config/apiConfig.js
const DISK_API_BASE_URL = 'http://127.0.0.1:5000/';
const KMS_API_BASE_URL = 'http://127.0.0.2:5000/';

const SIGNIN_URL = DISK_API_BASE_URL + '/api/auth/signin';
const SIGNUP_URL = DISK_API_BASE_URL + '/api/auth/signup';
const TWOFA_SETUP_URL = DISK_API_BASE_URL + '/api/auth/twofa/setup';
const TWOFA_CHECK_URL = DISK_API_BASE_URL + '/api/auth/twofa/check';
const TWOFA_CANCEL_URL = DISK_API_BASE_URL + '/api/auth/twofa/cancel';
const TWOFA_VERIFY_URL = DISK_API_BASE_URL + '/api/auth/twofa/verify';
const DOWNLOAD_URL = DISK_API_BASE_URL + '/api/file/download';
const FILE_INFO_URL = DISK_API_BASE_URL + '/api/file/fileinfo';
const GET_FILEKEY_URL = DISK_API_BASE_URL + '/api/file/getkeys';
const UPDATE_KEY_URL = DISK_API_BASE_URL + '/api/file/updatekeys';
const UPLOAD_URL = DISK_API_BASE_URL + '/api/file/upload';
const DELETE_FILE_URL = DISK_API_BASE_URL + '/api/file/delete'

const GENERATE_CERTIFICATE_URL = KMS_API_BASE_URL + '/api/cert/gencert';
const GET_KMS_KEY_URL = KMS_API_BASE_URL + '/api/key/distributeKey';

const API_HEADERS = {
  'Content-Type': 'application/json',
  // 其他預設 header
};

const FILE_UPLOAD_HEADERS = {
  'Content-Type': 'multipart/form-data',
};

export {
  SIGNIN_URL,
  SIGNUP_URL,
  TWOFA_SETUP_URL,
  TWOFA_VERIFY_URL,
  TWOFA_CHECK_URL,
  TWOFA_CANCEL_URL,
  DOWNLOAD_URL,
  FILE_INFO_URL,
  GET_FILEKEY_URL,
  UPDATE_KEY_URL,
  UPLOAD_URL,
  GENERATE_CERTIFICATE_URL,
  GET_KMS_KEY_URL,
  API_HEADERS,
  FILE_UPLOAD_HEADERS,
  DELETE_FILE_URL,
};
