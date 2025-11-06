// ==================== 전역 변수 ====================
let quizType = 'text'; // text 또는 speech
let quizMode = 'en-to-kr'; // en-to-kr, kr-to-en, random
let questions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let wrongCount = 0;
let wrongQuestions = []; // 틀린 문제 저장
let isRetryMode = false;
let quizStarted = false;

// TTS 관련
let speechSynthesis = window.speechSynthesis;
let currentVoice = null;
let preferredGender = 'female'; // 기본값: 여성

// STT 관련
let recognition = null;
let isRecording = false;

// ==================== DOM 요소 ====================
const hamburgerBtn = document.getElementById('hamburgerBtn');
const menuDropdown = document.getElementById('menuDropdown');
const resetBtn = document.getElementById('resetBtn');
const progressFill = document.getElementById('progressFill');
const correctCountEl = document.getElementById('correctCount');
const wrongCountEl = document.getElementById('wrongCount');
const remainingCountEl = document.getElementById('remainingCount');
const autoPlayToggle = document.getElementById('autoPlayToggle');
const quizNavigation = document.getElementById('quizNavigation');
const quizCard = document.getElementById('quizCard');
const prevBtn = document.getElementById('prevBtn');
const replayBtn = document.getElementById('replayBtn');
const nextBtnNav = document.getElementById('nextBtnNav');
const playBtn = document.getElementById('playBtn');
const meaningEl = document.getElementById('meaning');
const exampleEl = document.getElementById('example');
const textInputSection = document.getElementById('textInputSection');
const speechInputSection = document.getElementById('speechInputSection');
const textInput = document.getElementById('textInput');
const submitTextBtn = document.getElementById('submitTextBtn');
const speechTextInput = document.getElementById('speechTextInput');
const micBtn = document.getElementById('micBtn');
const submitSpeechBtn = document.getElementById('submitSpeechBtn');
const speechVisual = document.getElementById('speechVisual');
const speechText = document.getElementById('speechText');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('nextBtn');
const quizMain = document.getElementById('quizMain');
const resultScreen = document.getElementById('resultScreen');

// ==================== 초기화 ====================
document.addEventListener('DOMContentLoaded', () => {
    initializeMenu();
    initializeTTS();
    initializeSTT();
    initializeVoiceSelector(); // 음성 선택 초기화
    initializeNavigation();
    loadQuizData();
    initializeQuizSetup();
    setupQuizEventListeners(); // 이벤트 리스너 연결!
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
            alert('데이터가 초기화되었습니다.');
            window.location.href = 'index.html';
        }
    });
}

// ==================== 출제 방식 선택 화면으로 돌아가기 ====================
function goBackToQuizSetup() {
    quizStarted = false;
    quizSetup.style.display = 'block';
    quizNavigation.style.display = 'none';
    quizCard.style.display = 'none';
    resultScreen.style.display = 'none';
    
    // 진행 상태 초기화
    currentQuestionIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    wrongQuestions = [];
    updateStats();
}

// ==================== TTS 초기화 ====================
function initializeTTS() {
    // 음성 로드 대기 (모바일에서는 늦게 로드될 수 있음)
    const voices = speechSynthesis.getVoices();
    
    if (voices.length === 0) {
        console.log('⏳ 음성 로딩 중...');
        // voiceschanged 이벤트 리스너 등록
        speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('✅ 음성 로드 완료!');
            selectVoice();
        });
        
        // 모바일을 위한 추가 타이머 (일부 기기에서 이벤트가 안 올 수 있음)
        setTimeout(() => {
            const voicesRetry = speechSynthesis.getVoices();
            if (voicesRetry.length > 0 && !currentVoice) {
                console.log('⏰ 타이머로 음성 재시도');
                selectVoice();
            }
        }, 500);
    } else {
        console.log('✅ 음성 이미 로드됨');
        selectVoice();
    }
}

// ==================== 음성 선택 초기화 ====================
function initializeVoiceSelector() {
    const voiceRadios = document.querySelectorAll('input[name="voiceGender"]');
    
    voiceRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            preferredGender = e.target.value;
            console.log('🎙️ 음성 성별 변경:', preferredGender);
            
            // 음성 다시 선택
            selectVoice();
            
            // 변경된 음성으로 테스트 발음 (선택 사항)
            // setTimeout(() => {
            //     speakText('Hello', 'en-US');
            // }, 100);
        });
    });
}

// ==================== 출제 방식 선택 초기화 ====================
function initializeQuizSetup() {
    console.log('=== initializeQuizSetup 디버깅 ===');
    console.log('questions:', questions);
    console.log('questions.length:', questions ? questions.length : 'undefined');
    
    // questions가 로드된 후에만 문제 시작
    if (questions && questions.length > 0) {
        console.log('✅ 문제 시작!');
        quizStarted = true;
        displayQuestion();
    } else {
        console.log('❌ questions가 비어있거나 없음!');
    }
}

// ==================== 퀴즈 이벤트 리스너 재연결 ====================
function setupQuizEventListeners() {
    const newPlayBtn = document.getElementById('playBtn');
    const newTextInput = document.getElementById('textInput');
    const newSubmitTextBtn = document.getElementById('submitTextBtn');
    const newSpeechTextInput = document.getElementById('speechTextInput');
    const newMicBtn = document.getElementById('micBtn');
    const newSubmitSpeechBtn = document.getElementById('submitSpeechBtn');
    
    // 발음 듣기
    newPlayBtn.addEventListener('click', () => {
        const currentQ = getCurrentQuestionData();
        const language = currentQ.mode === 'en-to-kr' ? 'en-US' : 'ko-KR';
        speakText(currentQ.textToSpeak, language);
    });
    
    // 텍스트 입력 제출
    newSubmitTextBtn.addEventListener('click', () => {
        const answer = newTextInput.value.trim().toLowerCase();
        if (answer) {
            checkAnswer(answer);
        }
    });
    
    // Enter 키로 제출
    newTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const answer = newTextInput.value.trim().toLowerCase();
            if (answer) {
                checkAnswer(answer);
            }
        }
    });
    
    // 음성 입력 - 텍스트 입력
    newSpeechTextInput.addEventListener('input', () => {
        if (newSpeechTextInput.value.trim()) {
            newSubmitSpeechBtn.style.display = 'block';
        }
    });
    
    newSpeechTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const answer = newSpeechTextInput.value.trim().toLowerCase();
            if (answer) {
                checkAnswer(answer);
            }
        }
    });
    
    // 음성 입력 제출
    newSubmitSpeechBtn.addEventListener('click', () => {
        const speechTextEl = document.getElementById('speechText');
        const textInputVal = newSpeechTextInput.value.trim().toLowerCase();
        
        // 텍스트 입력 우선
        if (textInputVal) {
            checkAnswer(textInputVal);
        } else if (speechTextEl.textContent.trim() && 
                   speechTextEl.textContent !== '마이크 버튼을 눌러 말해보세요' &&
                   speechTextEl.textContent !== '말씀해주세요...') {
            checkAnswer(speechTextEl.textContent.trim().toLowerCase());
        }
    });
    
    // 마이크 버튼
    newMicBtn.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            // STT 언어 설정
            const currentQ = getCurrentQuestionData();
            if (currentQ.answerLanguage === 'korean') {
                recognition.lang = 'ko-KR';
            } else {
                recognition.lang = 'en-US';
            }
            recognition.start();
        }
    });
}

// ==================== 네비게이션 초기화 ====================
function initializeNavigation() {
    // 이전 버튼
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            displayQuestion();
        } else {
            // 첫 문제에서 이전을 누르면 출제 방식 선택 화면으로
            if (confirm('출제 방식 선택 화면으로 돌아가시겠습니까?')) {
                goBackToQuizSetup();
            }
        }
    });

    // 다시듣기 버튼
    replayBtn.addEventListener('click', () => {
        const currentQ = getCurrentQuestionData();
        const language = currentQ.mode === 'en-to-kr' ? 'en-US' : 'ko-KR';
        speakText(currentQ.textToSpeak, language);
    });

    // 다음 버튼 (상단 네비게이션)
    nextBtnNav.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            showResults();
        }
    });
}

// ==================== 여성 영어 음성 선택 ====================
function selectVoice() {
    // 음성 리스트 새로고침 (모바일에서 중요!)
    const voices = speechSynthesis.getVoices();
    
    console.log('=== 음성 선택 시작 ===');
    console.log('사용 가능한 음성 개수:', voices.length);
    console.log('선호 성별:', preferredGender);
    
    if (voices.length === 0) {
        console.warn('음성 리스트가 비어있습니다. 나중에 다시 시도합니다.');
        return;
    }
    
    // 영어 음성만 필터링
    const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
    console.log('영어 음성 개수:', englishVoices.length);
    
    if (preferredGender === 'female') {
        // 여성 음성 찾기
        // 1순위: 이름에 'Female' 포함
        let femaleVoice = englishVoices.find(voice => 
            voice.name.toLowerCase().includes('female')
        );
        
        // 2순위: Google 음성 (보통 여성)
        if (!femaleVoice) {
            femaleVoice = englishVoices.find(voice => 
                voice.name.toLowerCase().includes('google') &&
                !voice.name.toLowerCase().includes('male')
            );
        }
        
        // 3순위: Samantha, Victoria, Karen 등 여성 이름
        if (!femaleVoice) {
            const femaleNames = ['samantha', 'victoria', 'karen', 'susan', 'fiona'];
            femaleVoice = englishVoices.find(voice => 
                femaleNames.some(name => voice.name.toLowerCase().includes(name))
            );
        }
        
        currentVoice = femaleVoice || englishVoices[0];
    } else {
        // 남성 음성 찾기
        // 1순위: 이름에 'Male' 포함
        let maleVoice = englishVoices.find(voice => 
            voice.name.toLowerCase().includes('male') &&
            !voice.name.toLowerCase().includes('female')
        );
        
        // 2순위: Daniel, Alex, Fred 등 남성 이름
        if (!maleVoice) {
            const maleNames = ['daniel', 'alex', 'fred', 'tom', 'james'];
            maleVoice = englishVoices.find(voice => 
                maleNames.some(name => voice.name.toLowerCase().includes(name))
            );
        }
        
        currentVoice = maleVoice || englishVoices[0];
    }

    console.log('✅ 선택된 음성:', currentVoice?.name);
    console.log('음성 언어:', currentVoice?.lang);
}

// ==================== TTS 음성 출력 ====================
function speakText(text, language = 'en-US') {
    // 기존 음성 중지
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 언어에 따라 음성 선택
    if (language === 'ko-KR') {
        // 한국어 음성
        const voices = speechSynthesis.getVoices();
        const koreanVoice = voices.find(voice => voice.lang.startsWith('ko'));
        utterance.voice = koreanVoice || currentVoice;
        utterance.lang = 'ko-KR';
    } else {
        // 영어 음성 - 매번 최신 음성 리스트에서 선택
        const voices = speechSynthesis.getVoices();
        
        if (voices.length > 0 && (!currentVoice || voices.indexOf(currentVoice) === -1)) {
            // currentVoice가 없거나 목록에 없으면 다시 선택
            selectVoice();
        }
        
        utterance.voice = currentVoice;
        utterance.lang = 'en-US';
        
        console.log('🔊 발음:', text, '| 음성:', currentVoice?.name);
    }
    
    utterance.rate = 0.85; // 속도 (15% 느리게)
    utterance.pitch = 1.0; // 음높이 (자연스럽게)
    utterance.volume = 1; // 볼륨

    speechSynthesis.speak(utterance);
}

// ==================== 현재 문제 데이터 가져오기 (출제 방식 적용) ====================
function getCurrentQuestionData() {
    const originalQuestion = questions[currentQuestionIndex];
    let currentMode = quizMode;
    
    // 랜덤 모드면 매번 랜덤 선택
    if (quizMode === 'random') {
        currentMode = Math.random() < 0.5 ? 'en-to-kr' : 'kr-to-en';
    }
    
    if (currentMode === 'en-to-kr') {
        // 영어 → 한글: 영어를 보여주고, 영어를 읽고, 한글로 답변
        return {
            displayText: originalQuestion.word, // 화면에 영어 표시
            textToSpeak: originalQuestion.word, // 영어 읽기
            correctAnswer: originalQuestion.meaning.toLowerCase(), // 한글이 정답
            answerLanguage: 'korean', // 답변 언어
            mode: 'en-to-kr'
        };
    } else {
        // 한글 → 영어: 한글을 보여주고, 한글을 읽고, 영어로 답변
        return {
            displayText: originalQuestion.meaning, // 화면에 한글 표시
            textToSpeak: originalQuestion.meaning, // 한글 읽기 (TTS)
            correctAnswer: originalQuestion.word.toLowerCase(), // 영어가 정답
            answerLanguage: 'english', // 답변 언어
            mode: 'kr-to-en'
        };
    }
}

// ==================== STT 초기화 ====================
function initializeSTT() {
    // Web Speech API 지원 확인
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('이 브라우저는 음성 인식을 지원하지 않습니다.');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // 음성 인식 시작
    recognition.onstart = () => {
        isRecording = true;
        const micBtn = document.getElementById('micBtn');
        const speechVisual = document.getElementById('speechVisual');
        const speechText = document.getElementById('speechText');
        
        if (micBtn) {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<span class="mic-btn-icon">🔴</span><span>녹음 중...</span>';
        }
        if (speechVisual) speechVisual.classList.add('recording');
        if (speechText) speechText.textContent = '말씀해주세요...';
    };

    // 음성 인식 결과
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('인식된 음성:', transcript);
        
        const speechText = document.getElementById('speechText');
        const submitSpeechBtn = document.getElementById('submitSpeechBtn');
        
        if (speechText) speechText.textContent = transcript;
        if (submitSpeechBtn) submitSpeechBtn.style.display = 'block';
    };

    // 음성 인식 종료
    recognition.onend = () => {
        isRecording = false;
        const micBtn = document.getElementById('micBtn');
        const speechVisual = document.getElementById('speechVisual');
        
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '<span class="mic-btn-icon">🎤</span><span>다시 녹음</span>';
        }
        if (speechVisual) speechVisual.classList.remove('recording');
    };

    // 음성 인식 오류
    recognition.onerror = (event) => {
        console.error('음성 인식 오류:', event.error);
        isRecording = false;
        
        const micBtn = document.getElementById('micBtn');
        const speechVisual = document.getElementById('speechVisual');
        const speechText = document.getElementById('speechText');
        
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '<span class="mic-btn-icon">🎤</span><span>녹음 시작</span>';
        }
        if (speechVisual) speechVisual.classList.remove('recording');
        
        if (event.error === 'no-speech') {
            if (speechText) speechText.textContent = '음성이 감지되지 않았습니다. 다시 시도해주세요.';
        } else if (event.error === 'not-allowed') {
            if (speechText) {
                speechText.innerHTML = `
                    <div style="color: #ef4444; font-size: 14px; line-height: 1.6;">
                        <strong>마이크 권한이 거부되었습니다.</strong><br>
                        <br>
                        <strong>Chrome 설정 방법:</strong><br>
                        1. 주소창 왼쪽의 🔒 자물쇠 아이콘 클릭<br>
                        2. "마이크" 항목에서 "허용" 선택<br>
                        3. 페이지 새로고침<br>
                        <br>
                        <strong>또는</strong><br>
                        Chrome 설정 → 개인정보 및 보안 → 사이트 설정 → 마이크<br>
                        → 이 사이트 "허용"으로 변경
                    </div>
                `;
            }
        } else {
            if (speechText) speechText.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
        }
    };
}

// ==================== 퀴즈 데이터 로드 ====================
function loadQuizData() {
    // localStorage에서 데이터 가져오기
    quizType = localStorage.getItem('quizType') || 'text';
    quizMode = localStorage.getItem('quizMode') || 'en-to-kr';
    const questionsData = localStorage.getItem('questions');
    isRetryMode = localStorage.getItem('isRetry') === 'true';

    console.log('=== loadQuizData 디버깅 ===');
    console.log('questionsData:', questionsData);

    if (!questionsData) {
        alert('문제 데이터가 없습니다. 처음부터 다시 시작해주세요.');
        window.location.href = 'index.html';
        return;
    }

    questions = JSON.parse(questionsData);
    console.log('questions 배열:', questions);
    console.log('questions.length:', questions.length);
    
    // 재시도 모드인 경우
    if (isRetryMode) {
        currentQuestionIndex = 0;
        correctCount = 0;
        wrongCount = 0;
        wrongQuestions = [];
    }

    // 통계 업데이트
    updateStats();
}

// ==================== 문제 표시 ====================
function displayQuestion() {
    console.log('=== displayQuestion 디버깅 ===');
    console.log('currentQuestionIndex:', currentQuestionIndex);
    console.log('questions.length:', questions.length);
    console.log('조건 체크:', currentQuestionIndex >= questions.length);
    
    if (currentQuestionIndex >= questions.length) {
        console.log('❌ 결과 화면으로 이동!');
        showResults();
        return;
    }

    console.log('✅ 문제 표시!');
    const currentQ = getCurrentQuestionData();
    const meaningEl = document.getElementById('meaning');
    const exampleEl = document.getElementById('example');
    const textInput = document.getElementById('textInput');
    const speechTextInput = document.getElementById('speechTextInput');
    const speechText = document.getElementById('speechText');
    const feedbackEl = document.getElementById('feedback');
    const nextBtn = document.getElementById('nextBtn');
    const submitTextBtn = document.getElementById('submitTextBtn');
    const submitSpeechBtn = document.getElementById('submitSpeechBtn');
    const textInputSection = document.getElementById('textInputSection');
    const speechInputSection = document.getElementById('speechInputSection');

    // UI 초기화
    if (meaningEl) meaningEl.textContent = currentQ.displayText;
    if (exampleEl) exampleEl.textContent = questions[currentQuestionIndex].example || '';
    
    // 플레이스홀더 변경
    const placeholder = currentQ.answerLanguage === 'korean' ? '한글 뜻을 입력하세요' : '영어 철자를 입력하세요';
    if (textInput) {
        textInput.value = '';
        textInput.placeholder = placeholder;
    }
    if (speechTextInput) {
        speechTextInput.value = '';
        speechTextInput.placeholder = placeholder;
    }
    
    if (speechText) speechText.textContent = '마이크 버튼을 눌러 말해보세요';
    if (feedbackEl) {
        feedbackEl.className = 'feedback';
        feedbackEl.style.display = 'none';
    }
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitTextBtn) submitTextBtn.style.display = 'block';
    if (submitSpeechBtn) submitSpeechBtn.style.display = 'none';

    // 문제 타입에 따라 UI 변경
    if (quizType === 'text') {
        if (textInputSection) textInputSection.style.display = 'block';
        if (speechInputSection) speechInputSection.style.display = 'none';
    } else {
        if (textInputSection) textInputSection.style.display = 'none';
        if (speechInputSection) speechInputSection.style.display = 'block';
    }

    // 네비게이션 버튼 상태 업데이트
    // 이전 버튼은 항상 활성화 (첫 문제에서는 출제 방식 선택으로 이동)
    prevBtn.disabled = false;
    nextBtnNav.disabled = false;

    // 진행률 업데이트
    updateStats();

    // 자동 재생이 켜져 있으면 음성 출력
    if (autoPlayToggle.checked) {
        setTimeout(() => {
            const language = currentQ.mode === 'en-to-kr' ? 'en-US' : 'ko-KR';
            speakText(currentQ.textToSpeak, language);
        }, 500);
    }
}

// ==================== 통계 업데이트 ====================
function updateStats() {
    const total = questions.length;
    const remaining = total - currentQuestionIndex;
    const progress = (currentQuestionIndex / total) * 100;

    correctCountEl.textContent = correctCount;
    wrongCountEl.textContent = wrongCount;
    remainingCountEl.textContent = remaining;
    progressFill.style.width = `${progress}%`;
}

// ==================== 정답 확인 ====================
function checkAnswer(userAnswer) {
    const currentQ = getCurrentQuestionData();
    const correctAnswer = currentQ.correctAnswer;
    
    // 정답 판정 (유연한 검사)
    const isCorrect = checkAnswerFlexible(userAnswer, correctAnswer);

    const submitTextBtn = document.getElementById('submitTextBtn');
    const submitSpeechBtn = document.getElementById('submitSpeechBtn');
    const feedbackEl = document.getElementById('feedback');
    const nextBtn = document.getElementById('nextBtn');

    // 버튼 숨기기
    if (submitTextBtn) submitTextBtn.style.display = 'none';
    if (submitSpeechBtn) submitSpeechBtn.style.display = 'none';

    // 피드백 표시
    if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.classList.add('show');

        if (isCorrect) {
            correctCount++;
            feedbackEl.className = 'feedback show correct';
            feedbackEl.innerHTML = `
                <div class="feedback-title">✅ 정답입니다!</div>
                <div class="correct-answer"><strong>${correctAnswer}</strong></div>
            `;
        } else {
            wrongCount++;
            wrongQuestions.push({
                ...questions[currentQuestionIndex],
                userAnswer: userAnswer
            });
            feedbackEl.className = 'feedback show wrong';
            feedbackEl.innerHTML = `
                <div class="feedback-title">❌ 틀렸습니다</div>
                <div class="correct-answer">정답: <strong>${correctAnswer}</strong></div>
                <div class="correct-answer">입력: <strong>${userAnswer}</strong></div>
            `;
            
            // 정답 음성 출력
            const language = currentQ.mode === 'en-to-kr' ? 'ko-KR' : 'en-US';
            speakText(correctAnswer, language);
        }
    }

    // 다음 문제 버튼 표시
    if (nextBtn) nextBtn.style.display = 'block';
    
    // 다음 문제 버튼 이벤트 (재연결)
    const newNextBtn = document.getElementById('nextBtn');
    if (newNextBtn) {
        newNextBtn.onclick = nextQuestion;
    }
    
    updateStats();
}

// ==================== 유연한 정답 확인 ====================
function checkAnswerFlexible(userAnswer, correctAnswer) {
    // 소문자로 변환 및 공백 제거
    const cleanUser = userAnswer.toLowerCase().trim();
    const cleanCorrect = correctAnswer.toLowerCase().trim();
    
    // 1. 완전 일치
    if (cleanUser === cleanCorrect) {
        return true;
    }
    
    // 2. 한글 정답인 경우 - 유사도 체크 강화
    if (/[가-힣]/.test(cleanCorrect)) {
        // 2-1. 사용자가 여러 단어를 입력한 경우 (쉼표, 슬래시, 세미콜론으로 구분)
        const userWords = cleanUser.split(/[,/;]/).map(w => w.trim()).filter(w => w.length > 0);
        
        // 사용자 입력 중 하나라도 정답과 일치하면 정답
        for (const word of userWords) {
            // 완전 일치
            if (word === cleanCorrect) {
                return true;
            }
            
            // 정답이 사용자가 입력한 단어에 포함되어 있으면 정답
            if (cleanCorrect.includes(word) && word.length >= 2) {
                return true;
            }
            
            // 마지막 글자 제거 후 비교 (조사 차이 무시)
            if (word.length >= 2 && cleanCorrect.length >= 2) {
                const wordWithoutLast = word.slice(0, -1);
                const correctWithoutLast = cleanCorrect.slice(0, -1);
                if (wordWithoutLast === correctWithoutLast) {
                    return true;
                }
            }
        }
        
        // 2-2. 정답에 구분자가 있는 경우 (예: "기분이 언짢은/짜증난")
        if (cleanCorrect.includes('/') || cleanCorrect.includes(',') || cleanCorrect.includes(';')) {
            const correctWords = cleanCorrect.split(/[,/;]/).map(w => w.trim());
            
            // 사용자 입력이 정답 단어 중 하나와 일치
            for (const correctWord of correctWords) {
                if (cleanUser === correctWord) {
                    return true;
                }
                // 사용자가 입력한 여러 단어 중 하나가 정답 단어와 일치
                for (const userWord of userWords) {
                    if (userWord === correctWord) {
                        return true;
                    }
                }
            }
        }
    }
    
    // 3. 영어 정답인 경우 - 기존 엄격한 검사 유지
    if (/^[a-z\s]+$/.test(cleanCorrect)) {
        // 영어는 완전 일치만 인정
        if (cleanUser === cleanCorrect) {
            return true;
        }
        
        // 복수형, 과거형 등 유사 형태만 인정
        const userRoot = cleanUser.replace(/(s|ed|ing)$/g, '');
        const correctRoot = cleanCorrect.replace(/(s|ed|ing)$/g, '');
        if (userRoot === correctRoot) {
            return true;
        }
    }
    
    return false;
}

// ==================== 다음 문제 ====================
function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
}

// ==================== 결과 화면 ====================
function showResults() {
    quizMain.style.display = 'none';
    resultScreen.style.display = 'block';

    const total = questions.length;
    const scorePercentage = Math.round((correctCount / total) * 100);

    // 결과 통계
    document.getElementById('finalCorrect').textContent = correctCount;
    document.getElementById('finalWrong').textContent = wrongCount;
    document.getElementById('finalScore').textContent = `${scorePercentage}%`;

    // 틀린 문제 목록
    const wrongListEl = document.getElementById('wrongList');
    if (wrongQuestions.length > 0) {
        wrongListEl.innerHTML = `
            <h3>❌ 틀린 문제 (${wrongQuestions.length}개)</h3>
            ${wrongQuestions.map(q => `
                <div class="wrong-item">
                    <div class="wrong-word">${q.word}</div>
                    <div class="wrong-meaning">${q.meaning}</div>
                    ${q.userAnswer ? `<div class="wrong-meaning">입력: ${q.userAnswer}</div>` : ''}
                </div>
            `).join('')}
        `;

        // 틀린 문제 다시 풀기 버튼 표시
        const retryWrongBtn = document.getElementById('retryWrongBtn');
        retryWrongBtn.style.display = 'block';
        retryWrongBtn.addEventListener('click', retryWrongQuestions);
    } else {
        wrongListEl.innerHTML = '<div class="wrong-item" style="background: #ecfdf5; border-color: #10b981;">🎉 모든 문제를 맞혔습니다!</div>';
    }

    // 다시 시작하기 버튼 (같은 문제를 처음부터)
    document.getElementById('goHomeBtn').addEventListener('click', () => {
        // 현재 문제를 유지하면서 리셋
        currentQuestionIndex = 0;
        correctCount = 0;
        wrongCount = 0;
        wrongQuestions = [];
        localStorage.removeItem('isRetry');
        
        // 페이지 새로고침
        location.reload();
    });
}

// ==================== 틀린 문제 다시 풀기 ====================
function retryWrongQuestions() {
    // 틀린 문제만 저장
    localStorage.setItem('questions', JSON.stringify(wrongQuestions));
    localStorage.setItem('isRetry', 'true');
    
    // 페이지 새로고침
    location.reload();
}
