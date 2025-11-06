// ==================== 전역 변수 ====================
let selectedQuizType = 'text'; // 기본값: 텍스트 입력
let selectedQuizMode = 'en-to-kr'; // 기본값: 영어 → 한글
let selectedProblemType = 'A'; // 기본값: A타입 (단어+뜻)
let uploadedQuestions = {
    typeA: [], // 단어 + 뜻
    typeB: []  // 예문 (영어 + 한글)
};
let isEditMode = false;

// ==================== DOM 요소 ====================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuDropdown = document.getElementById('menuDropdown');
const resetBtn = document.getElementById('resetBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const typeBtns = document.querySelectorAll('.type-btn');
const uploadArea = document.getElementById('uploadArea');
const uploadLabel = document.getElementById('uploadLabel');
const imageInput = document.getElementById('imageInput');
const uploadedPreview = document.getElementById('uploadedPreview');
const manualInputABtn = document.getElementById('manualInputABtn');
const manualInputBBtn = document.getElementById('manualInputBBtn');
const viewQuestionsBtn = document.getElementById('viewQuestionsBtn');
const clearQuestionsBtn = document.getElementById('clearQuestionsBtn');
const questionsModal = document.getElementById('questionsModal');
const questionsList = document.getElementById('questionsList');
const closeModalBtn = document.getElementById('closeModalBtn');
const editModalBtn = document.getElementById('editModalBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveEditBtn = document.getElementById('saveEditBtn');
const modalButtons = document.getElementById('modalButtons');
const modalEditButtons = document.getElementById('modalEditButtons');
const problemTypeSection = document.getElementById('problemTypeSection');
const problemTypeBtns = document.querySelectorAll('.problem-type-btn');
const startBtn = document.getElementById('startBtn');
const sampleBtn = document.getElementById('sampleBtn');

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    initializeQuizMode();
    initializeQuizType();
    initializeUpload();
    initializeModal();
    initializeProblemType();
    initializeButtons();
    initializeManualInput();
    loadSavedQuestions(); // 저장된 문제 불러오기
});

// ==================== 햄버거 메뉴 ====================
function initializeMenu() {
    hamburgerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!hamburgerBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            menuDropdown.classList.remove('active');
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('모든 데이터를 초기화하시겠습니까?')) {
            localStorage.clear();
            uploadedQuestions = { typeA: [], typeB: [] };
            alert('데이터가 초기화되었습니다.');
            location.reload();
        }
    });
}

// ==================== 저장된 문제 불러오기 ====================
function loadSavedQuestions() {
    const savedQuestions = localStorage.getItem('savedQuestions');
    if (savedQuestions) {
        uploadedQuestions = JSON.parse(savedQuestions);
        if (uploadedQuestions.typeA.length > 0 || uploadedQuestions.typeB.length > 0) {
            updateUploadedInfo();
            viewQuestionsBtn.style.display = 'block';
            clearQuestionsBtn.style.display = 'block';
            problemTypeSection.style.display = 'block';
        }
    }
}

// ==================== 문제 저장 ====================
function saveQuestions() {
    localStorage.setItem('savedQuestions', JSON.stringify(uploadedQuestions));
}

// ==================== 업로드 정보 업데이트 ====================
function updateUploadedInfo() {
    uploadedPreview.innerHTML = `
        <div class="preview-info">
            ✅ 문제 준비 완료!<br>
            A타입 (단어+뜻): ${uploadedQuestions.typeA.length}개<br>
            B타입 (예문): ${uploadedQuestions.typeB.length}개
        </div>
    `;
}

// ==================== 수동 입력 초기화 ====================
function initializeManualInput() {
    // A타입 수동 입력
    manualInputABtn.addEventListener('click', () => {
        showMarkdownModal('A');
    });
    
    // B타입 수동 입력
    manualInputBBtn.addEventListener('click', () => {
        showMarkdownModal('B');
    });
    
    // 문제 지우기
    clearQuestionsBtn.addEventListener('click', () => {
        if (confirm('인식된 모든 문제를 삭제하시겠습니까?')) {
            uploadedQuestions = { typeA: [], typeB: [] };
            localStorage.removeItem('savedQuestions');
            uploadedPreview.innerHTML = '';
            viewQuestionsBtn.style.display = 'none';
            clearQuestionsBtn.style.display = 'none';
            // problemTypeSection은 항상 보이게 유지
            alert('문제가 삭제되었습니다.');
        }
    });
}

// ==================== 문제 타입 선택 ====================
// ==================== 문제 출제 방식 선택 ====================
function initializeQuizMode() {
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuizMode = btn.dataset.mode;
            console.log('선택된 문제 출제 방식:', selectedQuizMode);
        });
    });
}

// ==================== 문제 타입 선택 ====================
function initializeQuizType() {
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedQuizType = btn.dataset.type;
            console.log('선택된 문제 타입:', selectedQuizType);
        });
    });
}

// ==================== 이미지 업로드 ====================
function initializeUpload() {
    // 클릭으로 파일 선택 (label 대신 div 클릭)
    uploadLabel.addEventListener('click', () => {
        imageInput.click();
    });

    // 드래그 앤 드롭
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    });

    // 파일 선택 (이슈 수정: change 이벤트 한 번만 발생하도록)
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageUpload(file);
            // 파일 입력 초기화 (같은 파일 재선택 가능하도록)
            imageInput.value = '';
        }
    });
}

// ==================== 이미지 처리 ====================
async function handleImageUpload(file) {
    try {
        // 이미지 미리보기
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedPreview.innerHTML = `
                <img src="${e.target.result}" alt="업로드된 이미지" class="preview-image">
                <div class="preview-info">✅ 이미지가 업로드되었습니다. OCR 처리 중...</div>
            `;
        };
        reader.readAsDataURL(file);

        // OCR 처리
        const questions = await performOCR(file);
        
        uploadedQuestions = questions;
        
        uploadedPreview.innerHTML += `
            <div class="preview-info">
                ✅ 문제 인식 완료!<br>
                A타입 (단어+뜻): ${questions.typeA.length}개<br>
                B타입 (예문): ${questions.typeB.length}개
            </div>
        `;
        
        // 인식된 문제가 있으면 확인 버튼 표시
        if (questions.typeA.length > 0 || questions.typeB.length > 0) {
            viewQuestionsBtn.style.display = 'block';
            clearQuestionsBtn.style.display = 'block';
            problemTypeSection.style.display = 'block';
            saveQuestions(); // 문제 저장
        } else {
            uploadedPreview.innerHTML += `
                <div class="preview-info" style="background: #fef3c7; color: #f59e0b;">
                    ⚠️ 문제를 자동으로 인식하지 못했습니다.<br>
                    수동 입력 버튼을 눌러 직접 입력해주세요.
                </div>
            `;
            viewQuestionsBtn.style.display = 'block';
            viewQuestionsBtn.textContent = '📝 문제 직접 입력하기';
            problemTypeSection.style.display = 'block';
        }
        
        // 시작 버튼 활성화
        startBtn.disabled = false;
        
    } catch (error) {
        console.error('이미지 업로드 오류:', error);
        uploadedPreview.innerHTML = `
            <div class="preview-info" style="background: #fef2f2; color: #ef4444;">
                ❌ 이미지 처리 중 오류가 발생했습니다.
            </div>
        `;
    }
}

// ==================== OCR 처리 (개선된 로직) ====================
async function performOCR(file) {
    // Tesseract.js CDN 로드
    if (!window.Tesseract) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
            script.onload = resolve;
        });
    }

    try {
        uploadedPreview.innerHTML += `
            <div class="preview-info">🔄 OCR 처리 중... (최대 30초 소요)</div>
        `;

        const { data: { text } } = await Tesseract.recognize(
            file,
            'eng+kor',
            {
                logger: m => console.log(m)
            }
        );

        console.log('OCR 결과:', text);

        // 개선된 파싱 로직
        const questions = parseOCRTextImproved(text);
        return questions;
    } catch (error) {
        console.error('OCR 오류:', error);
        return { typeA: [], typeB: [] };
    }
}

// ==================== 개선된 OCR 텍스트 파싱 ====================
function parseOCRTextImproved(text) {
    const typeA = []; // 단어 + 뜻
    const typeB = []; // 예문 (영어 + 한글)
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log('=== OCR 시작 ===');
    console.log('전체 라인 수:', lines.length);
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        
        // 헤더나 구분선 스킵
        if (line.includes('No') || line.includes('Word') || line.includes('Meaning') || 
            line.includes('Example Sentence') || line.match(/^[-|]+$/)) {
            i++;
            continue;
        }
        
        // 숫자로 시작하는 줄 찾기
        const lineMatch = line.match(/^(\d+)/);
        if (lineMatch) {
            const num = lineMatch[1];
            console.log(`\n[라인 ${num}] 처리 시작:`, line);
            
            // | 로 구분된 데이터 추출
            const parts = line.split('|').map(p => p.trim()).filter(p => p && p !== num);
            
            console.log('분리된 파트:', parts);
            
            // A타입 판단: 짧은 단어 + 한글 (예문이 아님)
            if (parts.length >= 2) {
                const firstPart = parts[0].replace(/^\d+\s*/, '').trim();
                const secondPart = parts[1];
                
                // 첫 번째 파트가 단어 (공백 포함 단어구 가능, 30자 이하)
                // 두 번째 파트가 한글
                // 마침표가 없으면 단어
                if (firstPart.length > 0 && firstPart.length < 50 && 
                    /[가-힣]/.test(secondPart) && 
                    !firstPart.includes('.') && !firstPart.includes('!') && !firstPart.includes('?')) {
                    
                    typeA.push({
                        word: firstPart,
                        meaning: secondPart,
                        example: ''
                    });
                    console.log('✅ A타입 추가:', { word: firstPart, meaning: secondPart });
                    i++;
                    continue;
                }
                
                // B타입 판단: 영어 문장 + 한글 해석
                // 마침표/느낌표/물음표로 끝나는 영어 문장
                if (parts.length >= 2 && 
                    /[.!?]/.test(firstPart) && 
                    /[가-힣]/.test(secondPart)) {
                    
                    typeB.push({
                        word: firstPart,
                        meaning: secondPart,
                        example: ''
                    });
                    console.log('✅ B타입 추가:', { english: firstPart, korean: secondPart });
                    i++;
                    continue;
                }
            }
            
            // 다음 줄과 결합 시도
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                const combinedLine = line + ' ' + nextLine;
                const combinedParts = combinedLine.split('|').map(p => p.trim()).filter(p => p && p !== num);
                
                if (combinedParts.length >= 2) {
                    const firstPart = combinedParts[0].replace(/^\d+\s*/, '').trim();
                    const secondPart = combinedParts[1];
                    
                    // A타입 체크
                    if (firstPart.length > 0 && firstPart.length < 50 && 
                        /[가-힣]/.test(secondPart) && 
                        !firstPart.includes('.') && !firstPart.includes('!') && !firstPart.includes('?')) {
                        
                        typeA.push({
                            word: firstPart,
                            meaning: secondPart,
                            example: ''
                        });
                        console.log('✅ A타입 추가 (다음줄 결합):', { word: firstPart, meaning: secondPart });
                        i += 2;
                        continue;
                    }
                    
                    // B타입 체크
                    if (/[.!?]/.test(firstPart) && /[가-힣]/.test(secondPart)) {
                        typeB.push({
                            word: firstPart,
                            meaning: secondPart,
                            example: ''
                        });
                        console.log('✅ B타입 추가 (다음줄 결합):', { english: firstPart, korean: secondPart });
                        i += 2;
                        continue;
                    }
                }
            }
        }
        
        i++;
    }
    
    console.log('\n=== OCR 완료 ===');
    console.log(`A타입: ${typeA.length}개`);
    console.log(`B타입: ${typeB.length}개`);
    
    return { typeA, typeB };
}

// ==================== 모달 초기화 ====================
function initializeModal() {
    // 인식된 문제 확인 버튼
    viewQuestionsBtn.addEventListener('click', () => {
        displayQuestions();
        questionsModal.style.display = 'flex';
    });

    // 닫기 버튼
    closeModalBtn.addEventListener('click', () => {
        questionsModal.style.display = 'none';
        isEditMode = false;
        modalButtons.style.display = 'flex';
        modalEditButtons.style.display = 'none';
    });

    // 편집하기 버튼
    editModalBtn.addEventListener('click', () => {
        enableEditMode();
    });

    // 취소 버튼
    cancelEditBtn.addEventListener('click', () => {
        questionsModal.style.display = 'none';
        isEditMode = false;
        modalButtons.style.display = 'flex';
        modalEditButtons.style.display = 'none';
    });

    // 완료 버튼
    saveEditBtn.addEventListener('click', () => {
        saveEdits();
        questionsModal.style.display = 'none';
        isEditMode = false;
        modalButtons.style.display = 'flex';
        modalEditButtons.style.display = 'none';
        
        // 문제 타입 선택 섹션 표시 및 시작 버튼 활성화
        if (uploadedQuestions.typeA.length > 0 || uploadedQuestions.typeB.length > 0) {
            problemTypeSection.style.display = 'block';
            startBtn.disabled = false;
        }
    });

    // 모달 외부 클릭시 닫기
    questionsModal.addEventListener('click', (e) => {
        if (e.target === questionsModal) {
            questionsModal.style.display = 'none';
            isEditMode = false;
            modalButtons.style.display = 'flex';
            modalEditButtons.style.display = 'none';
        }
    });
}

// ==================== 문제 표시 ====================
function displayQuestions() {
    questionsList.innerHTML = '';
    
    // A타입 문제 표시
    if (uploadedQuestions.typeA.length > 0) {
        uploadedQuestions.typeA.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'question-item type-a';
            item.dataset.type = 'A';
            item.dataset.index = index;
            item.innerHTML = `
                <span class="question-badge">A타입</span>
                <div class="question-word">${q.word}</div>
                <div class="question-meaning">${q.meaning}</div>
            `;
            questionsList.appendChild(item);
        });
    }
    
    // B타입 문제 표시
    if (uploadedQuestions.typeB.length > 0) {
        uploadedQuestions.typeB.forEach((q, index) => {
            const item = document.createElement('div');
            item.className = 'question-item type-b';
            item.dataset.type = 'B';
            item.dataset.index = index;
            item.innerHTML = `
                <span class="question-badge">B타입</span>
                <div class="question-word">${q.word}</div>
                <div class="question-meaning">${q.meaning}</div>
            `;
            questionsList.appendChild(item);
        });
    }
    
    // 문제가 없으면 안내 메시지
    if (uploadedQuestions.typeA.length === 0 && uploadedQuestions.typeB.length === 0) {
        questionsList.innerHTML = `
            <div class="question-item" style="text-align: center; border-color: #f59e0b;">
                <p style="margin-bottom: 15px;">인식된 문제가 없습니다.</p>
                <p style="font-size: 14px; color: #6b7280;">편집하기 버튼을 눌러 직접 입력해주세요.</p>
            </div>
        `;
    }
}

// ==================== 편집 모드 활성화 ====================
function enableEditMode() {
    isEditMode = true;
    modalButtons.style.display = 'none';
    modalEditButtons.style.display = 'flex';
    
    questionsList.innerHTML = '';
    
    // A타입 문제 편집
    if (uploadedQuestions.typeA.length > 0) {
        uploadedQuestions.typeA.forEach((question, index) => {
            const item = createEditableItem('A', index, question);
            questionsList.appendChild(item);
        });
    }
    
    // B타입 문제 편집
    if (uploadedQuestions.typeB.length > 0) {
        uploadedQuestions.typeB.forEach((question, index) => {
            const item = createEditableItem('B', index, question);
            questionsList.appendChild(item);
        });
    }
    
    // 문제 관리 버튼들
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px; margin-top: 20px;';
    
    // 삭제 버튼들
    const deleteButtonsRow = document.createElement('div');
    deleteButtonsRow.style.cssText = 'display: flex; gap: 10px;';
    deleteButtonsRow.innerHTML = `
        <button class="delete-all-btn" data-type="A" style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px;">
            🗑️ A타입 전체 삭제
        </button>
        <button class="delete-all-btn" data-type="B" style="flex: 1; padding: 12px; background: #ef4444; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px;">
            🗑️ B타입 전체 삭제
        </button>
    `;
    
    // 개별 추가 버튼들
    const addButtonsRow = document.createElement('div');
    addButtonsRow.style.cssText = 'display: flex; gap: 10px;';
    addButtonsRow.innerHTML = `
        <button class="add-question-btn" data-type="A" style="flex: 1; padding: 15px; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
            ➕ A타입 문제 추가
        </button>
        <button class="add-question-btn" data-type="B" style="flex: 1; padding: 15px; background: #8b5cf6; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
            ➕ B타입 문제 추가
        </button>
    `;
    
    // 마크다운 일괄 추가 버튼들
    const markdownButtonsRow = document.createElement('div');
    markdownButtonsRow.style.cssText = 'display: flex; gap: 10px;';
    markdownButtonsRow.innerHTML = `
        <button class="add-markdown-btn" data-type="A" style="flex: 1; padding: 15px; background: #059669; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
            📝 A타입 마크다운 추가
        </button>
        <button class="add-markdown-btn" data-type="B" style="flex: 1; padding: 15px; background: #7c3aed; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">
            📝 B타입 마크다운 추가
        </button>
    `;
    
    buttonsContainer.appendChild(deleteButtonsRow);
    buttonsContainer.appendChild(addButtonsRow);
    buttonsContainer.appendChild(markdownButtonsRow);
    questionsList.appendChild(buttonsContainer);
    
    // 전체 삭제 버튼 이벤트
    deleteButtonsRow.querySelectorAll('.delete-all-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const typeName = type === 'A' ? 'A타입 (단어+뜻)' : 'B타입 (예문)';
            const count = type === 'A' ? uploadedQuestions.typeA.length : uploadedQuestions.typeB.length;
            
            if (count === 0) {
                alert(`삭제할 ${typeName} 문제가 없습니다.`);
                return;
            }
            
            if (confirm(`${typeName} 문제 ${count}개를 모두 삭제하시겠습니까?`)) {
                if (type === 'A') {
                    uploadedQuestions.typeA = [];
                } else {
                    uploadedQuestions.typeB = [];
                }
                enableEditMode(); // 다시 렌더링
            }
        });
    });
    
    // 개별 추가 버튼 이벤트
    addButtonsRow.querySelectorAll('.add-question-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            if (type === 'A') {
                uploadedQuestions.typeA.push({ word: '', meaning: '', example: '' });
                const newIndex = uploadedQuestions.typeA.length - 1;
                const newItem = createEditableItem('A', newIndex, uploadedQuestions.typeA[newIndex]);
                questionsList.insertBefore(newItem, buttonsContainer);
            } else {
                uploadedQuestions.typeB.push({ word: '', meaning: '', example: '' });
                const newIndex = uploadedQuestions.typeB.length - 1;
                const newItem = createEditableItem('B', newIndex, uploadedQuestions.typeB[newIndex]);
                questionsList.insertBefore(newItem, buttonsContainer);
            }
        });
    });
    
    // 마크다운 추가 버튼 이벤트
    markdownButtonsRow.querySelectorAll('.add-markdown-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            showMarkdownModal(type);
        });
    });
}

// ==================== 마크다운 모달 표시 ====================
function showMarkdownModal(type) {
    const typeName = type === 'A' ? 'A타입 (단어+뜻)' : 'B타입 (예문)';
    const placeholder = type === 'A' ? 
`예시:
| No | Word       | Meaning(뜻)      |
|----|------------|------------------|
| 1  | laboratory | 실험실           |
| 2  | germ       | 세균             |
| 3  | grumpy     | 기분이 언짢은    |` :
`예시:
| No | Example Sentence (영문) | Example Sentence (해석) |
|----|--------------------------|--------------------------|
| 1  | I'm away from my laboratory at the moment. | 나는 지금 실험실에 없어. |
| 2  | It's made by bacteria, which some people call germs. | 이것은 몇몇 사람들이 세균이라고 부르는 박테리아로 만들어졌다. |`;
    
    const modalHtml = `
        <div class="markdown-modal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 3000; padding: 20px;">
            <div style="background: white; border-radius: 20px; padding: 30px; max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">${typeName} 마크다운 추가</h3>
                <textarea id="markdownInput" style="width: 100%; min-height: 300px; padding: 15px; border: 2px solid #e5e7eb; border-radius: 12px; font-family: monospace; font-size: 14px; resize: vertical;" placeholder="${placeholder}"></textarea>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="markdownCancelBtn" style="flex: 1; padding: 15px; background: white; color: #1f2937; border: 2px solid #e5e7eb; border-radius: 12px; font-weight: 600; cursor: pointer;">취소</button>
                    <button id="markdownAddBtn" style="flex: 1; padding: 15px; background: #10b981; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;">추가</button>
                </div>
            </div>
        </div>
    `;
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHtml;
    document.body.appendChild(modalDiv);
    
    const markdownInput = document.getElementById('markdownInput');
    const cancelBtn = document.getElementById('markdownCancelBtn');
    const addBtn = document.getElementById('markdownAddBtn');
    
    // 취소 버튼
    cancelBtn.addEventListener('click', () => {
        modalDiv.remove();
    });
    
    // 추가 버튼
    addBtn.addEventListener('click', () => {
        const markdown = markdownInput.value.trim();
        if (!markdown) {
            alert('마크다운 표를 입력해주세요.');
            return;
        }
        
        const parsed = parseMarkdown(markdown, type);
        if (parsed.length === 0) {
            alert('올바른 형식의 마크다운 표를 입력해주세요.');
            return;
        }
        
        // 기존 데이터에 추가
        if (type === 'A') {
            uploadedQuestions.typeA.push(...parsed);
        } else {
            uploadedQuestions.typeB.push(...parsed);
        }
        
        // 업데이트된 정보 표시
        updateUploadedInfo();
        viewQuestionsBtn.style.display = 'block';
        clearQuestionsBtn.style.display = 'block';
        problemTypeSection.style.display = 'block';
        
        // 문제 저장
        saveQuestions();
        
        alert(`${parsed.length}개의 문제가 추가되었습니다.`);
        modalDiv.remove();
    });
}

// ==================== 마크다운 파싱 ====================
function parseMarkdown(markdown, type) {
    const result = [];
    const lines = markdown.split('\n').map(l => l.trim()).filter(l => l);
    
    for (const line of lines) {
        // 헤더나 구분선 스킵
        if (line.includes('No') || line.includes('Word') || line.includes('Meaning') || 
            line.includes('Example Sentence') || line.match(/^[-|]+$/)) {
            continue;
        }
        
        // | 로 구분
        const parts = line.split('|').map(p => p.trim()).filter(p => p);
        
        if (parts.length >= 3) {
            const num = parts[0];
            const first = parts[1];
            const second = parts[2];
            
            if (type === 'A') {
                // A타입: 단어 + 뜻
                if (first && second) {
                    result.push({
                        word: first,
                        meaning: second,
                        example: ''
                    });
                }
            } else {
                // B타입: 영어 예문 + 한글 해석
                // 한글 해석이 없으면 추가하지 않음
                if (first && second && /[가-힣]/.test(second)) {
                    result.push({
                        word: first,
                        meaning: second,
                        example: ''
                    });
                }
            }
        }
    }
    
    return result;
}

// ==================== 편집 가능한 아이템 생성 ====================
function createEditableItem(type, index, question) {
    const item = document.createElement('div');
    item.className = `question-item type-${type.toLowerCase()}`;
    item.dataset.type = type;
    item.dataset.index = index;
    
    if (type === 'A') {
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span class="question-badge">A타입</span>
                <button class="delete-btn" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;">삭제</button>
            </div>
            <div>
                <label style="font-size: 14px; color: #6b7280; margin-bottom: 5px; display: block;">단어:</label>
                <textarea class="edit-word" rows="1" placeholder="영어 단어 입력">${question.word}</textarea>
            </div>
            <div>
                <label style="font-size: 14px; color: #6b7280; margin-bottom: 5px; display: block;">뜻:</label>
                <textarea class="edit-meaning" rows="1" placeholder="한글 뜻 입력">${question.meaning}</textarea>
            </div>
        `;
    } else {
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span class="question-badge">B타입</span>
                <button class="delete-btn" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer;">삭제</button>
            </div>
            <div>
                <label style="font-size: 14px; color: #6b7280; margin-bottom: 5px; display: block;">영어 예문:</label>
                <textarea class="edit-word" rows="2" placeholder="영어 예문 입력">${question.word}</textarea>
            </div>
            <div>
                <label style="font-size: 14px; color: #6b7280; margin-bottom: 5px; display: block;">한글 해석:</label>
                <textarea class="edit-meaning" rows="2" placeholder="한글 해석 입력">${question.meaning}</textarea>
            </div>
        `;
    }
    
    // 삭제 버튼 이벤트
    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
        if (confirm('이 문제를 삭제하시겠습니까?')) {
            if (type === 'A') {
                uploadedQuestions.typeA.splice(index, 1);
            } else {
                uploadedQuestions.typeB.splice(index, 1);
            }
            enableEditMode(); // 다시 렌더링
        }
    });
    
    return item;
}

// ==================== 편집 내용 저장 ====================
function saveEdits() {
    const items = questionsList.querySelectorAll('.question-item');
    items.forEach(item => {
        const type = item.dataset.type;
        const index = parseInt(item.dataset.index);
        const wordTextarea = item.querySelector('.edit-word');
        const meaningTextarea = item.querySelector('.edit-meaning');
        
        if (type === 'A') {
            uploadedQuestions.typeA[index].word = wordTextarea.value.trim();
            uploadedQuestions.typeA[index].meaning = meaningTextarea.value.trim();
        } else {
            uploadedQuestions.typeB[index].word = wordTextarea.value.trim();
            uploadedQuestions.typeB[index].meaning = meaningTextarea.value.trim();
        }
    });
    
    // 업데이트된 정보 표시
    updateUploadedInfo();
    viewQuestionsBtn.style.display = 'block';
    clearQuestionsBtn.style.display = 'block';
    
    // 문제 저장
    saveQuestions();
}

// ==================== 문제 유형 선택 ====================
function initializeProblemType() {
    problemTypeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            problemTypeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedProblemType = btn.dataset.problemType;
            console.log('선택된 문제 유형:', selectedProblemType);
            
            // 샘플 버튼 텍스트 업데이트
            updateSampleButtonText();
            
            // 시작 버튼은 항상 활성화
            startBtn.disabled = false;
        });
    });
    
    // 초기 샘플 버튼 텍스트 설정
    updateSampleButtonText();
}

// ==================== 샘플 버튼 텍스트 업데이트 ====================
function updateSampleButtonText() {
    const sampleBtnText = selectedProblemType === 'A' 
        ? '샘플 테스트 - 단어 (5문제)' 
        : '샘플 테스트 - 예문 (5문제)';
    sampleBtn.querySelector('span').textContent = sampleBtnText;
}

// ==================== 시작 버튼 업데이트 ====================
function updateStartButton() {
    // 시작 버튼은 항상 활성화
    startBtn.disabled = false;
}

// ==================== 버튼 이벤트 ====================
function initializeButtons() {
    // 시작 버튼
    startBtn.addEventListener('click', () => {
        const selectedQuestions = selectedProblemType === 'A' ? uploadedQuestions.typeA : uploadedQuestions.typeB;
        
        if (selectedQuestions.length > 0) {
            // 데이터를 localStorage에 저장
            localStorage.setItem('quizType', selectedQuizType);
            localStorage.setItem('quizMode', selectedQuizMode);
            localStorage.setItem('questions', JSON.stringify(selectedQuestions));
            localStorage.setItem('problemType', selectedProblemType);
            localStorage.setItem('isRetry', 'false');
            
            // 문제 풀이 페이지로 이동
            window.location.href = 'quiz.html';
        }
    });

    // 샘플 테스트 버튼
    sampleBtn.addEventListener('click', async () => {
        try {
            // 선택된 문제 타입에 따라 샘플 데이터 파일 선택
            const sampleFile = selectedProblemType === 'A' ? 'sample-data-typeA.json' : 'sample-data-typeB.json';
            
            // 샘플 데이터 로드
            const response = await fetch(sampleFile);
            const sampleQuestions = await response.json();
            
            // 데이터를 localStorage에 저장
            localStorage.setItem('quizType', selectedQuizType);
            localStorage.setItem('quizMode', selectedQuizMode);
            localStorage.setItem('questions', JSON.stringify(sampleQuestions));
            localStorage.setItem('problemType', selectedProblemType);
            localStorage.setItem('isRetry', 'false');
            
            // 문제 풀이 페이지로 이동
            window.location.href = 'quiz.html';
        } catch (error) {
            console.error('샘플 데이터 로드 오류:', error);
            alert('샘플 데이터를 불러오는데 실패했습니다.');
        }
    });
}
