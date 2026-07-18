const views = document.querySelectorAll('.view');
const root = document.documentElement;
const body = document.body;

const state = {
  fontScale: Number(localStorage.getItem('fontScale')) || 1,
  highContrast: localStorage.getItem('highContrast') === 'true',
  voiceEnabled: localStorage.getItem('voiceEnabled') === 'true',
  kiosk: { step: 0, mistakes: 0, help: 0, startTime: null, answers: {} },
  quiz: { index: 0, correct: 0, answered: false }
};

const kioskSteps = [
  {
    title: '어디에서 드시겠어요?',
    speech: '매장에서 드실지, 포장하실지 선택해 주세요.',
    options: ['매장에서 먹기', '포장하기'],
    correct: '포장하기',
    key: 'place'
  },
  {
    title: '주문할 메뉴를 선택해 주세요.',
    speech: '불고기 버거를 선택해 주세요.',
    options: ['불고기 버거', '새우 버거', '치킨 버거', '주문 취소'],
    correct: '불고기 버거',
    key: 'menu'
  },
  {
    title: '음료를 선택해 주세요.',
    speech: '콜라를 선택해 주세요.',
    options: ['콜라', '사이다', '물', '음료 없음'],
    correct: '콜라',
    key: 'drink'
  },
  {
    title: '주문 내용을 확인해 주세요.',
    speech: '포장, 불고기 버거, 콜라가 맞으면 주문 확인을 눌러 주세요.',
    options: ['주문 확인', '처음부터 다시'],
    correct: '주문 확인',
    key: 'confirm'
  },
  {
    title: '결제 방법을 선택해 주세요.',
    speech: '연습용 카드 결제를 선택해 주세요. 실제 결제는 되지 않습니다.',
    options: ['연습용 카드 결제', '실제 계좌 입력', '주민등록번호 입력'],
    correct: '연습용 카드 결제',
    key: 'payment'
  }
];

const quizQuestions = [
  {
    message: '[택배 안내]\n주소가 정확하지 않아 배송이 중단되었습니다. 아래 링크에서 다시 입력하세요.\nhttp://delivery-check.example',
    suspicious: true,
    reason: '출처가 불분명한 링크를 누르게 하고 개인정보 입력을 유도합니다.'
  },
  {
    message: '[가족 문자]\n엄마, 휴대폰이 고장 났어. 급하게 돈이 필요하니 이 계좌로 보내줘.',
    suspicious: true,
    reason: '가족을 사칭해 급하게 송금을 요구하는 전형적인 수법입니다. 반드시 기존 번호로 직접 전화해 확인해야 합니다.'
  },
  {
    message: '[도서관]\n예약한 도서가 도착했습니다. 회원증을 가지고 안내 데스크를 방문해 주세요.',
    suspicious: false,
    reason: '링크나 개인정보 입력, 송금 요구가 없고 일반적인 안내 내용입니다.'
  },
  {
    message: '[카드 결제]\n해외에서 980,000원이 결제되었습니다. 취소하려면 앱을 설치하세요.',
    suspicious: true,
    reason: '불안감을 조성하고 앱 설치를 유도합니다. 카드사 공식 앱이나 대표번호로 직접 확인해야 합니다.'
  },
  {
    message: '[병원 안내]\n내일 오전 10시 진료 예약이 있습니다. 변경이 필요하면 병원 대표번호로 연락해 주세요.',
    suspicious: false,
    reason: '금전이나 개인정보를 요구하지 않고 공식 연락 방법을 안내합니다.'
  }
];

function showView(name) {
  views.forEach(view => view.classList.remove('active'));
  document.getElementById(`${name}View`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (name === 'results') renderResults();
  if (state.voiceEnabled) speak(getViewIntro(name));
}

function getViewIntro(name) {
  const intros = {
    home: '디지털 동행 첫 화면입니다. 연습할 항목을 선택해 주세요.',
    kiosk: '음식 주문 연습입니다. 천천히 한 단계씩 진행해 주세요.',
    smishing: '수상한 문자 구별 연습입니다.',
    guide: '스마트폰 화면을 편하게 바꾸는 방법입니다.',
    results: '나의 연습 결과 화면입니다.'
  };
  return intros[name] || '';
}

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.82;
  speechSynthesis.speak(utterance);
}

function applySettings() {
  root.style.setProperty('--font-scale', state.fontScale.toFixed(1));
  body.classList.toggle('high-contrast', state.highContrast);
  document.getElementById('contrastToggle').textContent = state.highContrast ? '기본 화면' : '고대비';
  const voiceButton = document.getElementById('voiceToggle');
  voiceButton.textContent = state.voiceEnabled ? '음성 안내 끄기' : '음성 안내 켜기';
  voiceButton.setAttribute('aria-pressed', String(state.voiceEnabled));
}

function saveSettings() {
  localStorage.setItem('fontScale', String(state.fontScale));
  localStorage.setItem('highContrast', String(state.highContrast));
  localStorage.setItem('voiceEnabled', String(state.voiceEnabled));
}

function resetKiosk() {
  state.kiosk = { step: 0, mistakes: 0, help: 0, startTime: Date.now(), answers: {} };
  renderKiosk();
}

function renderKiosk() {
  const panel = document.getElementById('kioskPanel');
  const step = kioskSteps[state.kiosk.step];
  const percent = ((state.kiosk.step) / kioskSteps.length) * 100;
  document.getElementById('kioskProgress').style.setProperty('--progress', `${percent}%`);
  document.getElementById('kioskStepText').textContent = `${state.kiosk.step + 1}단계 / ${kioskSteps.length}단계`;

  const summary = state.kiosk.step >= 3 ? `
    <div class="order-summary">
      <strong>현재 주문</strong><br>
      ${state.kiosk.answers.place || '선택 전'} · ${state.kiosk.answers.menu || '선택 전'} · ${state.kiosk.answers.drink || '선택 전'}
    </div>` : '';

  panel.innerHTML = `
    ${summary}
    <p class="practice-question">${step.title}</p>
    <div class="choice-grid">
      ${step.options.map(option => `<button type="button" class="choice-button" data-kiosk-choice="${option}">${option}</button>`).join('')}
    </div>
    <div id="kioskFeedback" class="feedback-box" style="display:none"></div>
  `;

  panel.querySelectorAll('[data-kiosk-choice]').forEach(button => {
    button.addEventListener('click', () => handleKioskChoice(button.dataset.kioskChoice));
  });
}

function handleKioskChoice(choice) {
  const step = kioskSteps[state.kiosk.step];
  const feedback = document.getElementById('kioskFeedback');

  if (choice === '처음부터 다시') {
    resetKiosk();
    return;
  }

  if (choice !== step.correct) {
    state.kiosk.mistakes += 1;
    feedback.style.display = 'block';
    feedback.className = 'feedback-box warning';
    feedback.innerHTML = `<strong>괜찮습니다.</strong><br>이 연습에서는 <strong>${step.correct}</strong>를 선택해 보세요.`;
    if (state.voiceEnabled) speak(`괜찮습니다. ${step.correct}를 선택해 보세요.`);
    return;
  }

  state.kiosk.answers[step.key] = choice;
  state.kiosk.step += 1;

  if (state.kiosk.step >= kioskSteps.length) {
    finishKiosk();
  } else {
    renderKiosk();
    if (state.voiceEnabled) speak(kioskSteps[state.kiosk.step].speech);
  }
}

function finishKiosk() {
  const elapsed = Math.max(1, Math.round((Date.now() - state.kiosk.startTime) / 1000));
  const record = {
    date: new Date().toLocaleString('ko-KR'),
    seconds: elapsed,
    mistakes: state.kiosk.mistakes,
    help: state.kiosk.help
  };
  localStorage.setItem('kioskResult', JSON.stringify(record));
  document.getElementById('kioskProgress').style.setProperty('--progress', '100%');
  document.getElementById('kioskStepText').textContent = '연습 완료';
  document.getElementById('kioskPanel').innerHTML = `
    <div class="feedback-box success">
      <h3>주문 연습을 완료했습니다!</h3>
      <p>실제 돈은 결제되지 않았습니다.</p>
    </div>
    <div class="results-grid">
      <article class="result-card"><h3>걸린 시간</h3><p class="result-number">${elapsed}초</p></article>
      <article class="result-card"><h3>잘못 누른 횟수</h3><p class="result-number">${record.mistakes}회</p></article>
      <article class="result-card"><h3>도움 사용</h3><p class="result-number">${record.help}회</p></article>
      <article class="result-card"><h3>최종 결과</h3><p class="result-number">성공</p></article>
    </div>
    <button type="button" id="retryKiosk" class="primary-button">다시 연습하기</button>
  `;
  document.getElementById('retryKiosk').addEventListener('click', resetKiosk);
  if (state.voiceEnabled) speak('축하합니다. 음식 주문 연습을 완료했습니다.');
}

function renderQuiz() {
  const question = quizQuestions[state.quiz.index];
  const panel = document.getElementById('quizPanel');
  const percent = (state.quiz.index / quizQuestions.length) * 100;
  document.getElementById('quizProgress').style.setProperty('--progress', `${percent}%`);
  document.getElementById('quizStepText').textContent = `${state.quiz.index + 1}번 문제 / ${quizQuestions.length}번 문제`;

  panel.innerHTML = `
    <p class="practice-question">이 문자는 수상한 문자일까요?</p>
    <div class="message-box">${question.message}</div>
    <div class="choice-grid">
      <button type="button" class="choice-button" data-quiz-answer="true">수상한 문자 같아요</button>
      <button type="button" class="choice-button" data-quiz-answer="false">안전한 문자 같아요</button>
    </div>
    <div id="quizFeedback" class="feedback-box" style="display:none"></div>
  `;

  panel.querySelectorAll('[data-quiz-answer]').forEach(button => {
    button.addEventListener('click', () => answerQuiz(button.dataset.quizAnswer === 'true'));
  });

  if (state.voiceEnabled) speak('문자 내용을 읽고 수상한 문자인지 선택해 주세요.');
}

function answerQuiz(answer) {
  if (state.quiz.answered) return;
  state.quiz.answered = true;
  const question = quizQuestions[state.quiz.index];
  const isCorrect = answer === question.suspicious;
  if (isCorrect) state.quiz.correct += 1;

  const feedback = document.getElementById('quizFeedback');
  feedback.style.display = 'block';
  feedback.className = `feedback-box ${isCorrect ? 'success' : 'warning'}`;
  feedback.innerHTML = `
    <h3>${isCorrect ? '잘 판단했습니다!' : '다시 확인해 볼까요?'}</h3>
    <p>${question.reason}</p>
    <button type="button" id="nextQuiz" class="primary-button">다음 문제</button>
  `;
  document.getElementById('nextQuiz').addEventListener('click', nextQuiz);
  if (state.voiceEnabled) speak(`${isCorrect ? '정답입니다.' : '아쉽습니다.'} ${question.reason}`);
}

function nextQuiz() {
  state.quiz.index += 1;
  state.quiz.answered = false;
  if (state.quiz.index >= quizQuestions.length) finishQuiz();
  else renderQuiz();
}

function finishQuiz() {
  const record = {
    date: new Date().toLocaleString('ko-KR'),
    correct: state.quiz.correct,
    total: quizQuestions.length
  };
  localStorage.setItem('quizResult', JSON.stringify(record));
  document.getElementById('quizProgress').style.setProperty('--progress', '100%');
  document.getElementById('quizStepText').textContent = '연습 완료';
  document.getElementById('quizPanel').innerHTML = `
    <div class="feedback-box success">
      <h3>문자 구별 연습을 마쳤습니다.</h3>
      <p>모르는 링크는 누르지 말고, 공식 대표번호로 직접 확인하세요.</p>
    </div>
    <div class="result-card">
      <h3>정답 수</h3>
      <p class="result-number">${record.correct} / ${record.total}</p>
    </div>
    <button type="button" id="retryQuiz" class="primary-button">다시 풀기</button>
  `;
  document.getElementById('retryQuiz').addEventListener('click', () => {
    state.quiz = { index: 0, correct: 0, answered: false };
    renderQuiz();
  });
  if (state.voiceEnabled) speak(`문자 구별 연습을 마쳤습니다. ${record.total}문제 중 ${record.correct}문제를 맞혔습니다.`);
}

function renderResults() {
  const panel = document.getElementById('resultsPanel');
  const kiosk = JSON.parse(localStorage.getItem('kioskResult') || 'null');
  const quiz = JSON.parse(localStorage.getItem('quizResult') || 'null');

  if (!kiosk && !quiz) {
    panel.innerHTML = '<div class="empty-state"><h3>아직 저장된 기록이 없습니다.</h3><p>연습을 완료하면 결과가 이곳에 표시됩니다.</p></div>';
    return;
  }

  panel.innerHTML = `
    ${kiosk ? `<article class="result-card"><h3>음식 주문 연습</h3><p class="result-number">완료</p><p>시간 ${kiosk.seconds}초 · 실수 ${kiosk.mistakes}회 · 도움 ${kiosk.help}회</p><small>${kiosk.date}</small></article>` : ''}
    ${quiz ? `<article class="result-card"><h3>수상한 문자 구별</h3><p class="result-number">${quiz.correct}/${quiz.total}</p><p>정답률 ${Math.round((quiz.correct / quiz.total) * 100)}%</p><small>${quiz.date}</small></article>` : ''}
  `;
}

document.querySelectorAll('[data-open]').forEach(button => {
  button.addEventListener('click', () => {
    const target = button.dataset.open;
    if (target === 'kiosk') resetKiosk();
    if (target === 'smishing') {
      state.quiz = { index: 0, correct: 0, answered: false };
      renderQuiz();
    }
    showView(target);
  });
});

document.querySelectorAll('[data-home]').forEach(button => button.addEventListener('click', () => showView('home')));

document.getElementById('fontUp').addEventListener('click', () => {
  state.fontScale = Math.min(1.4, +(state.fontScale + 0.1).toFixed(1));
  saveSettings(); applySettings();
  if (state.voiceEnabled) speak('글자를 크게 했습니다.');
});

document.getElementById('fontDown').addEventListener('click', () => {
  state.fontScale = Math.max(0.9, +(state.fontScale - 0.1).toFixed(1));
  saveSettings(); applySettings();
  if (state.voiceEnabled) speak('글자를 작게 했습니다.');
});

document.getElementById('contrastToggle').addEventListener('click', () => {
  state.highContrast = !state.highContrast;
  saveSettings(); applySettings();
  if (state.voiceEnabled) speak(state.highContrast ? '고대비 화면을 켰습니다.' : '기본 화면으로 돌아왔습니다.');
});

document.getElementById('voiceToggle').addEventListener('click', () => {
  state.voiceEnabled = !state.voiceEnabled;
  saveSettings(); applySettings();
  if (state.voiceEnabled) speak('음성 안내를 켰습니다.');
  else if ('speechSynthesis' in window) speechSynthesis.cancel();
});

document.getElementById('kioskHelp').addEventListener('click', () => {
  state.kiosk.help += 1;
  const step = kioskSteps[state.kiosk.step];
  alert(`도움말\n\n${step.speech}\n\n정답 버튼: ${step.correct}`);
  speak(`${step.speech} 정답은 ${step.correct}입니다.`);
});

document.getElementById('kioskSpeak').addEventListener('click', () => {
  const step = kioskSteps[state.kiosk.step];
  if (step) speak(step.speech);
});

document.getElementById('resetResults').addEventListener('click', () => {
  const confirmed = confirm('저장된 연습 기록을 모두 지울까요?');
  if (!confirmed) return;
  localStorage.removeItem('kioskResult');
  localStorage.removeItem('quizResult');
  renderResults();
});

applySettings();
showView('home');
