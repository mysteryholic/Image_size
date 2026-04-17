const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const formatInput = document.getElementById('format');
const selectedFile = document.getElementById('selected-file');
const convertBtn = document.getElementById('convert');
const statusNode = document.getElementById('status');

let currentFile = null;

function setStatus(text, isError = false) {
  statusNode.textContent = text;
  statusNode.classList.toggle('error', isError);
}

function setFile(file) {
  if (!file) {
    currentFile = null;
    selectedFile.textContent = '없음';
    return;
  }

  currentFile = file;
  selectedFile.textContent = file.path || file.name;

  if (!widthInput.value || !heightInput.value) {
    const probe = new Image();
    probe.onload = () => {
      widthInput.value = String(probe.naturalWidth);
      heightInput.value = String(probe.naturalHeight);
    };
    probe.src = URL.createObjectURL(file);
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, preventDefaults);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => dropZone.classList.add('active'));
});

['dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'));
});

dropZone.addEventListener('drop', (e) => {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    setFile(files[0]);
    setStatus('이미지가 선택되었습니다.');
  }
});

dropZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  const files = e.target.files;
  if (files && files.length > 0) {
    setFile(files[0]);
    setStatus('이미지가 선택되었습니다.');
  }
});

convertBtn.addEventListener('click', async () => {
  if (!currentFile) {
    setStatus('먼저 이미지를 넣어주세요.', true);
    return;
  }

  const width = Number.parseInt(widthInput.value, 10);
  const height = Number.parseInt(heightInput.value, 10);
  const format = formatInput.value;

  if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
    setStatus('너비와 높이는 1 이상의 숫자로 입력해주세요.', true);
    return;
  }

  setStatus('변환 중입니다...');
  convertBtn.disabled = true;

  try {
    const result = await window.imageApp.resizeImage({
      inputPath: currentFile.path,
      width,
      height,
      format
    });

    if (result.canceled) {
      setStatus('저장이 취소되었습니다.');
      return;
    }

    const kb = (result.size / 1024).toFixed(1);
    setStatus(`완료: ${result.outputPath} (${kb}KB)`);
  } catch (error) {
    setStatus(`오류: ${error.message}`, true);
  } finally {
    convertBtn.disabled = false;
  }
});
