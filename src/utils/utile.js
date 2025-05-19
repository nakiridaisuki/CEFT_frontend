import { format } from 'date-fns';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} 位元組`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

function hexStringToUint8Array(hexString) {
  if (!hexString) {
    return new Uint8Array(0);
  }
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return bytes;
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export { formatFileSize, formatDate, hexStringToUint8Array, base64ToArrayBuffer };