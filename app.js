function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

(() => {
"use strict";
const modules = [
  {
    id: "ktx",
    cat: "transport",
    icon: "🚄",
    title: "KTX 기차표 예매",
    desc: "앱 찾기부터 열차 조회, 호차·좌석 선택, 승차권 확인까지",
    goal: "서울역→부산역, 오전 열차, 창가 좌석 예매",
    entry: "rail",
    steps: [
      "앱 찾기",
      "여정 입력",
      "열차 선택",
      "좌석 선택",
      "예약 확인",
      "승차권 보기",
    ],
  },
  {
    id: "metro",
    cat: "transport",
    icon: "🚇",
    title: "지하철 1회용 카드",
    desc: "역 발매기에서 목적지 선택, 요금 투입, 카드 수령까지",
    goal: "서울역에서 잠실역 가는 1회용 교통카드 발급",
    entry: "kiosk",
    steps: [
      "기기 시작",
      "1회용 카드",
      "목적지",
      "인원·운임",
      "결제",
      "카드 수령",
    ],
  },
  {
    id: "gtx",
    cat: "transport",
    icon: "🚆",
    title: "GTX-A 이용",
    desc: "노선 찾기, 1회용 카드 발급, 개찰구 태그와 환급",
    goal: "운정중앙역에서 서울역까지 GTX-A 이용",
    entry: "kiosk",
    steps: ["노선 확인", "목적지", "운임 확인", "카드 발급", "개찰구", "환급"],
  },
  {
    id: "air",
    cat: "transport",
    icon: "✈️",
    title: "비행기표 예매",
    desc: "인터넷 또는 앱에서 항공편 검색, 시간·좌석 선택, 예약 확인",
    goal: "인천→제주 왕복 항공권과 통로 좌석 예약",
    entry: "air",
    steps: ["앱 찾기", "여정 검색", "가는 편 선택", "가는 편 운임", "오는 편 선택", "오는 편 운임", "탑승객 정보", "수하물·추가 서비스", "가는 편 좌석", "오는 편 좌석", "결제·예약 확인"],
  },
  {
    id: "hotel",
    cat: "transport",
    icon: "🏨",
    title: "호텔 예약",
    desc: "지역과 날짜를 검색하고 객실·취소 조건을 확인해 예약",
    goal: "부산 1박, 성인 2명, 무료 취소 객실 예약",
    entry: "browser",
    steps: [
      "인터넷 열기",
      "검색",
      "날짜·인원",
      "객실 선택",
      "조건 확인",
      "예약",
    ],
  },
  {
    id: "bank",
    cat: "money",
    icon: "🏦",
    title: "은행 계좌 송금",
    desc: "은행 앱 찾기, 이체 메뉴, 계좌·금액·받는 분 확인",
    goal: "김민수에게 30,000원 송금하고 이름 재확인",
    entry: "bank",
    steps: [
      "은행 앱 찾기",
      "이체 선택",
      "계좌 입력",
      "금액 입력",
      "받는 분 확인",
      "완료",
    ],
  },
  {
    id: "atm",
    cat: "money",
    icon: "💳",
    title: "ATM 현금 출금",
    desc: "카드 넣기, 비밀번호, 금액 선택, 카드·현금 회수",
    goal: "ATM에서 50,000원을 출금하고 카드 먼저 받기",
    entry: "kiosk",
    steps: ["카드 투입", "출금 선택", "비밀번호", "금액", "확인", "회수"],
  },
  {
    id: "gov",
    cat: "money",
    icon: "📄",
    title: "정부 민원서류 발급",
    desc: "인터넷 검색부터 로그인, 주민등록등본 신청·출력까지",
    goal: "정부 민원 사이트에서 주민등록등본 1부 발급",
    entry: "browser",
    steps: [
      "인터넷 열기",
      "공식 사이트 찾기",
      "민원 검색",
      "본인 확인",
      "내용 선택",
      "발급",
    ],
  },
  {
    id: "hospital",
    cat: "life",
    icon: "🏥",
    title: "병원 예약·무인접수",
    desc: "병원 검색, 진료과·시간 예약 후 현장 접수기 이용",
    goal: "내과 오전 진료를 예약하고 현장 접수표 받기",
    entry: "browser",
    steps: [
      "병원 찾기",
      "진료 내용",
      "날짜·시간",
      "신청 정보 확인",
      "예약 완료",
      "접수기",
      "접수표",
    ],
  },
  {
    id: "chat",
    cat: "communication",
    icon: "💬",
    title: "메신저 연락하기",
    desc: "메신저 앱을 찾아 대화방 열기, 문자와 사진 보내기",
    goal: "딸에게 “잘 도착했다”고 보내고 사진 1장 전송",
    entry: "chat",
    steps: ["앱 찾기", "딸 대화방", "메시지 입력", "사진 메뉴", "사진 전송", "전송 확인"],
  },
  {
    id: "video",
    cat: "communication",
    icon: "📹",
    title: "영상통화",
    desc: "대화방에서 영상통화를 걸고 카메라·마이크 조절",
    goal: "가족에게 영상통화를 걸고 카메라를 한 번 전환",
    entry: "chat",
    steps: ["앱 찾기", "딸 대화방", "영상통화 선택", "통화 연결", "카메라 전환", "통화 종료"],
  },
  {
    id: "sms",
    cat: "communication",
    icon: "🛡️",
    title: "수상한 문자 판별",
    desc: "문자 앱을 열어 택배·금융 사칭 링크의 위험을 확인",
    goal: "문자 5개 중 수상한 문자를 골라 링크를 누르지 않기",
    entry: "message",
    steps: ["문자 앱", "메시지 확인", "위험 표시", "판단", "신고·삭제", "완료"],
  },
  {
    id: "food",
    cat: "life",
    icon: "🍔",
    title: "음식점 키오스크",
    desc: "매장·포장, 메뉴·옵션, 주문 확인, 카드 결제까지",
    goal: "불고기버거 세트를 포장 주문하고 카드 결제",
    entry: "kiosk",
    steps: ["시작", "매장·포장", "메뉴", "옵션", "주문 확인", "결제"],
  },
  {
    id: "delivery",
    cat: "life",
    icon: "🛵",
    title: "배달 음식 주문",
    desc: "배달 앱 찾기, 가게·메뉴·주소·결제방법 확인",
    goal: "집 주소로 김밥 2줄을 주문하고 요청사항 입력",
    entry: "delivery",
    steps: ["앱 찾기", "음식 찾기", "가게 비교", "메뉴 선택", "옵션·사이드", "장바구니", "배달 방식", "주소·요청", "쿠폰·결제", "최종 확인", "주문 현황"],
  },
  {
    id: "shopping",
    cat: "life",
    icon: "📦",
    title: "온라인 물건 주문",
    desc: "인터넷 쇼핑 앱에서 검색, 옵션·배송지·최종금액 확인",
    goal: "생수 2L 6개를 검색해 배송지 확인 후 주문",
    entry: "shopping",
    steps: ["앱 찾기", "상품 검색", "옵션", "장바구니", "배송지", "결제 확인"],
  },
  {
    id: "taxi",
    cat: "transport",
    icon: "🚕",
    title: "택시 호출",
    desc: "지도에서 현재 위치와 목적지를 확인하고 차량 호출",
    goal: "현재 위치에서 서울역까지 일반 택시 호출",
    entry: "taxi",
    steps: ["앱 찾기", "현재 위치", "목적지", "차종·요금", "호출", "차량 확인"],
  },
];

const searchAliases = {
  ktx: ["기차", "열차", "고속철도", "케이티엑스", "코레일", "부산", "서울역", "좌석", "표", "승차권", "예매", "예약"],
  metro: ["지하철", "전철", "표", "승차권", "교통카드", "일회용", "1회용", "발매기", "키오스크", "역", "잠실"],
  gtx: ["gtx", "지티엑스", "광역급행", "운정", "킨텍스", "대곡", "서울역", "교통카드", "개찰구"],
  air: ["비행기", "항공", "항공권", "공항", "제주", "인천", "좌석", "탑승권", "여행"],
  hotel: ["호텔", "숙소", "숙박", "방", "객실", "체크인", "여행", "부산"],
  bank: ["은행", "송금", "이체", "돈 보내기", "계좌", "입금", "받는 사람", "금융"],
  atm: ["atm", "현금", "출금", "돈 찾기", "자동화기기", "카드", "비밀번호"],
  gov: ["정부", "민원", "등본", "주민등록", "서류", "발급", "공공", "정부24", "민원24"],
  hospital: ["병원", "진료", "예약", "접수", "무인접수", "내과", "의사", "접수표"],
  chat: ["카톡", "카카오톡", "메신저", "문자 보내기", "사진 보내기", "대화", "가족", "딸"],
  video: ["영상통화", "화상통화", "카메라", "통화", "가족", "딸", "카톡"],
  sms: ["문자", "스미싱", "사기", "수상한 문자", "택배 문자", "링크", "피싱", "보이스피싱"],
  food: ["음식", "햄버거", "버거", "키오스크", "주문", "식당", "포장", "매장", "결제"],
  delivery: ["배달", "음식 주문", "김밥", "배달앱", "주소", "주문", "요청사항"],
  shopping: ["쇼핑", "물건", "온라인 주문", "택배", "배송", "생수", "장바구니", "인터넷 쇼핑"],
  taxi: ["택시", "호출", "차 부르기", "기사", "목적지", "서울역", "지도"]
};

const synonymGroups = [
  ["예매", "예약", "표", "승차권", "티켓"],
  ["송금", "이체", "돈보내기", "돈 보내기", "계좌이체"],
  ["영상통화", "화상통화", "비디오통화"],
  ["지하철", "전철", "도시철도"],
  ["음식", "식사", "메뉴", "주문"],
  ["병원", "진료", "접수"],
  ["쇼핑", "구매", "물건", "상품"],
  ["비행기", "항공", "항공권"],
  ["호텔", "숙소", "숙박"],
  ["문자", "메시지", "메신저", "카톡", "카카오톡"]
];

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function expandSearchTerms(query) {
  const normalized = normalizeSearchText(query);
  const compact = compactSearchText(query);
  const terms = new Set(normalized.split(" ").filter(Boolean));
  if (compact) terms.add(compact);
  synonymGroups.forEach((group) => {
    const normalizedGroup = group.map(normalizeSearchText);
    if (normalizedGroup.some((word) => normalized.includes(word) || compact.includes(word.replace(/\s+/g, "")))) {
      normalizedGroup.forEach((word) => {
        terms.add(word);
        terms.add(word.replace(/\s+/g, ""));
      });
    }
  });
  return [...terms].filter(Boolean);
}

function bigrams(value) {
  const text = compactSearchText(value);
  const result = [];
  for (let i = 0; i < text.length - 1; i += 1) result.push(text.slice(i, i + 2));
  return result;
}

function diceSimilarity(a, b) {
  const aa = bigrams(a);
  const bb = bigrams(b);
  if (!aa.length || !bb.length) return compactSearchText(a) === compactSearchText(b) ? 1 : 0;
  const counts = new Map();
  aa.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  let matches = 0;
  bb.forEach((item) => {
    const count = counts.get(item) || 0;
    if (count > 0) {
      matches += 1;
      counts.set(item, count - 1);
    }
  });
  return (2 * matches) / (aa.length + bb.length);
}

function moduleSearchText(module) {
  return [module.title, module.desc, module.goal, ...module.steps, ...(searchAliases[module.id] || [])].join(" ");
}

function scoreModule(module, query) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;
  const compactQuery = compactSearchText(query);
  const haystack = normalizeSearchText(moduleSearchText(module));
  const compactHaystack = compactSearchText(haystack);
  const terms = expandSearchTerms(query);
  let score = 0;
  if (haystack.includes(normalizedQuery)) score += 80;
  if (compactHaystack.includes(compactQuery)) score += 70;
  terms.forEach((term) => {
    const compactTerm = term.replace(/\s+/g, "");
    if (haystack.includes(term)) score += term.length >= 3 ? 18 : 10;
    if (compactTerm && compactHaystack.includes(compactTerm)) score += 14;
  });
  score += Math.round(diceSimilarity(query, moduleSearchText(module)) * 35);
  return score;
}

function readCompletedModules() {
  try {
    const value = JSON.parse(localStorage.getItem("digital-completed") || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveCompletedModules(value) {
  try {
    localStorage.setItem("digital-completed", JSON.stringify(value));
  } catch (error) {
    console.warn("완료 기록을 저장하지 못했습니다.", error);
  }
}

const appCatalog = [
  ["rail", "🚄", "코레일톡", "#2f6fb2"],
  ["air", "✈️", "대한항공", "#4b74c9"],
  ["bank", "★", "KB스타뱅킹", "#665343"],
  ["chat", "💬", "카카오톡", "#fee500"],
  ["delivery", "배달", "배달의민족", "#2ac1bc"],
  ["shopping", "C", "쿠팡", "#e74b3b"],
  ["taxi", "T", "카카오 T", "#222222"],
  ["health", "＋", "똑닥", "#ef5b73"],
  ["gov", "24", "정부24", "#1769aa"],
  ["map", "지도", "네이버 지도", "#34a853"],
  ["message", "✉", "메시지", "#4d8bd8"],
  ["browser", "🌐", "삼성 인터넷", "#6b5bd2"]
];

const entryGuides = {
  ktx: { mode: "app", appId: "rail", appName: "코레일톡", command: "휴대전화 홈 화면에서 ‘코레일톡’ 앱을 찾아 한 번 누르세요.", note: "아이콘 아래에 ‘코레일톡’이라고 적혀 있는지 먼저 확인하세요." },
  air: { mode: "web", appId: "browser", appName: "인터넷", query: "대한항공 항공권 예약", siteName: "대한항공 공식 홈페이지", domainHint: "koreanair.com", command: "홈 화면 아래쪽의 ‘인터넷’ 앱을 누르세요." },
  hotel: { mode: "web", appId: "browser", appName: "인터넷", query: "부산 호텔 예약", siteName: "호텔 예약 검색 결과", domainHint: "예약 조건과 취소 가능 여부를 확인", command: "홈 화면 아래쪽의 ‘인터넷’ 앱을 누르세요." },
  bank: { mode: "app", appId: "bank", appName: "사용 중인 은행 앱(연습에서는 KB스타뱅킹)", command: "홈 화면에서 ‘KB스타뱅킹’ 앱을 찾아 한 번 누르세요.", note: "실전에서는 본인이 거래하는 은행 앱 이름을 확인하세요." },
  gov: { mode: "web", appId: "browser", appName: "인터넷", query: "정부24 주민등록등본", siteName: "정부24 공식 홈페이지", domainHint: "gov.kr", command: "홈 화면 아래쪽의 ‘인터넷’ 앱을 누르세요." },
  hospital: { mode: "web", appId: "browser", appName: "인터넷", query: "가까운 병원 진료 예약", siteName: "병원 공식 예약 페이지", domainHint: "병원 이름과 주소 확인", command: "홈 화면 아래쪽의 ‘인터넷’ 앱을 누르세요." },
  chat: { mode: "app", appId: "chat", appName: "카카오톡", command: "홈 화면에서 노란 말풍선 모양의 ‘카카오톡’ 앱을 찾아 한 번 누르세요.", note: "아이콘 모양만 보지 말고 아래의 앱 이름도 함께 읽으세요." },
  video: { mode: "app", appId: "chat", appName: "카카오톡", command: "홈 화면에서 ‘카카오톡’ 앱을 찾아 한 번 누르세요.", note: "영상통화는 카카오톡 대화방 안에서 시작합니다." },
  sms: { mode: "app", appId: "message", appName: "문자", command: "화면 아래쪽의 ‘문자’ 앱을 한 번 누르세요.", note: "봉투 또는 말풍선 모양과 ‘문자’라는 이름을 함께 확인하세요." },
  delivery: { mode: "app", appId: "delivery", appName: "배달의민족", command: "홈 화면에서 ‘배달의민족’ 앱을 찾아 한 번 누르세요.", note: "실전에서는 평소 사용하는 배달 앱을 선택해도 됩니다." },
  shopping: { mode: "app", appId: "shopping", appName: "쿠팡", command: "홈 화면에서 ‘쿠팡’ 앱을 찾아 한 번 누르세요.", note: "실전에서는 평소 사용하는 쇼핑 앱을 선택해도 됩니다." },
  taxi: { mode: "app", appId: "taxi", appName: "카카오 T", command: "홈 화면에서 ‘카카오 T’ 앱을 찾아 한 번 누르세요.", note: "검은색 아이콘 아래의 ‘카카오 T’ 글자를 확인하세요." }
};

let state = {
  module: null,
  step: 0,
  mistakes: 0,
  hints: 0,
  start: 0,
  data: {},
  lastEntry: null,
  launcherStage: "home",
  mode: "guided",
  stepErrors: {},
};
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
function showView(id) {
  $$(".view").forEach((v) => v.classList.remove("active"));
  $("#" + id).classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function renderHome(cat = "all", query = "") {
  const grid = $("#moduleGrid");
  if (!grid) return;

  const normalizedQuery = normalizeSearchText(query);
  const ranked = modules
    .filter((module) => cat === "all" || module.cat === cat)
    .map((module) => ({ module, score: scoreModule(module, normalizedQuery) }))
    .filter((item) => !normalizedQuery || item.score >= 12)
    .sort((a, b) => b.score - a.score || a.module.title.localeCompare(b.module.title, "ko"));

  grid.innerHTML = "";
  ranked.forEach(({ module }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "module-card";
    button.dataset.moduleId = module.id;
    button.setAttribute("aria-label", `${module.title} 연습 시작`);
    button.innerHTML = `<span class="module-icon">${module.icon}</span><h3>${module.title}</h3><p>${module.desc}</p><span class="goal">실전 목표: ${module.goal}</span><span class="start-label">연습 시작하기 →</span>`;
    grid.appendChild(button);
  });

  if (!ranked.length) {
    grid.innerHTML = `<div class="empty-search"><div class="empty-icon">⌕</div><h3>비슷한 연습을 찾지 못했습니다.</h3><p>짧은 단어로 다시 검색해 보세요. 예: 기차, 송금, 병원, 영상통화</p><button type="button" data-action="clear-search">전체 연습 보기</button></div>`;
  }

  const resultTitle = $("#searchResultTitle");
  const resultDescription = $("#searchResultDescription");
  if (resultTitle && resultDescription) {
    if (normalizedQuery) {
      resultTitle.textContent = `“${query.trim()}”와 비슷한 연습 ${ranked.length}개`;
      resultDescription.textContent = "원하는 결과를 누르면 휴대전화에서 앱을 찾는 단계부터 연습이 시작됩니다.";
    } else {
      resultTitle.textContent = cat === "all" ? "원하는 연습을 선택하세요" : "선택한 분야의 연습입니다";
      resultDescription.textContent = "아래 연습을 누르거나 위 검색창에 하고 싶은 일을 입력하세요.";
    }
  }

  const completed = readCompletedModules();
  if ($("#moduleCount")) $("#moduleCount").textContent = modules.length + "개";
}

function runSearch(query) {
  const input = $("#practiceSearchInput");
  const clearButton = $("#clearSearch");
  const value = String(query ?? input?.value ?? "").trim();
  if (input) input.value = value;
  if (clearButton) clearButton.hidden = !value;
  $$('[data-category]').forEach((button) => button.classList.toggle("active", button.dataset.category === "all"));
  renderHome("all", value);
  $("#searchResultTitle")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearSearch() {
  const input = $("#practiceSearchInput");
  if (input) input.value = "";
  if ($("#clearSearch")) $("#clearSearch").hidden = true;
  $$('[data-category]').forEach((button) => button.classList.toggle("active", button.dataset.category === "all"));
  renderHome("all", "");
  input?.focus();
}

function startModule(id) {
  state = {
    module: modules.find((m) => m.id === id),
    step: 0,
    mistakes: 0,
    hints: 0,
    start: Date.now(),
    data: {},
    lastEntry: null,
    launcherStage: "home",
    mode: "guided",
    stepErrors: {},
  };
  document.body.classList.remove("field-mode");
  document.body.classList.add("guided-mode");
  if (state.module.entry === "kiosk") {
    showView("practiceView");
    renderPractice();
  } else {
    showLauncher();
  }
}

function beginPracticeMode(mode) {
  state.mode = mode === "field" ? "field" : "guided";
  state.start = Date.now();
  document.body.classList.toggle("field-mode", state.mode === "field");
  document.body.classList.toggle("guided-mode", state.mode === "guided");
  if (state.module.entry === "kiosk") {
    showView("practiceView");
    renderPractice();
  } else {
    showLauncher();
  }
}
function getEntryGuide() {
  return entryGuides[state.module.id] || {
    mode: "app",
    appId: state.module.entry,
    appName: "해당 앱",
    command: "화면에서 필요한 앱 이름을 확인한 뒤 한 번 누르세요.",
    note: "아이콘과 앱 이름을 함께 확인하세요."
  };
}

function setLauncherInstructions(title) {
  const mission = $("#launcherMission");
  if (mission) mission.textContent = title;
  const speakButton = $("#repeatLauncherInstruction");
  if (speakButton) {
    speakButton.onclick = () => speakText(title);
  }
}

function showLauncher() {
  showView("launcherView");
  const guide = getEntryGuide();
  state.launcherStage = "apps";
  $("#launcherTitle").textContent = `앱스 화면에서 ${guide.appName}을 찾아 누르세요`;
  // 연습 시작 전에 잠금 해제나 홈 화면 제스처를 요구하지 않습니다.
  // 실제 연습에 필요한 앱 찾기 단계부터 바로 시작합니다.
  renderGalaxyApps(guide);
}

function phoneStatusBar() {
  return `<div class="galaxy-status"><span>9:41</span><span>◉ 5G ▰ 92%</span></div>`;
}

function renderGalaxyHome(guide) {
  const screen = $("#launcherView .phone-screen");
  screen.className = "phone-screen galaxy-home";
  screen.innerHTML = `${phoneStatusBar()}
    <div class="galaxy-wallpaper">
      <div class="galaxy-clock"><strong>9:41</strong><span>7월 18일 금요일</span><small>고양시 29° 맑음</small></div>
      <div class="home-page-icons">
        <button type="button"><i>📅</i><span>캘린더</span></button>
        <button type="button"><i>🖼️</i><span>갤러리</span></button>
        <button type="button"><i>📷</i><span>카메라</span></button>
        <button type="button"><i>⚙️</i><span>설정</span></button>
      </div>
      <div class="swipe-up-zone" id="swipeUpZone" tabindex="0" role="button" aria-label="위로 밀어 앱스 화면 열기"><span></span></div>
      <div class="home-dock-real">
        <button type="button"><i>☎</i></button><button type="button"><i>💬</i></button><button type="button"><i>🌐</i></button><button type="button"><i>📷</i></button>
      </div>
    </div>`;
  let startY = null;
  const zone = $("#swipeUpZone");
  const open = () => renderGalaxyApps(guide);
  zone.addEventListener("pointerdown", e => { startY = e.clientY; zone.setPointerCapture?.(e.pointerId); });
  zone.addEventListener("pointerup", e => { if (startY === null || startY - e.clientY > 35) open(); else wrong("손가락을 아래에서 위쪽으로 길게 밀어 주세요."); startY = null; });
  zone.addEventListener("click", open);
  zone.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") open(); });
}

function renderGalaxyApps(guide) {
  state.launcherStage = "apps";
  setLauncherInstructions(`앱스 화면에서 “${guide.appName}”을 찾아 누르세요. 보이지 않으면 위쪽 [검색]을 누르세요.`);
  const screen = $("#launcherView .phone-screen");
  screen.className = "phone-screen galaxy-apps";
  const allApps = [
    ["calendar","📅","캘린더","#4d82dd"],["gallery","🌄","갤러리","#e96ab5"],["camera","📷","카메라","#6c7785"],["settings","⚙","설정","#8090a5"],
    ["rail","🚄","코레일톡","#326ab4"],["air","✈","항공예약","#5678dc"],["bank","🏦","KB스타뱅킹","#f1c400"],["chat","💬","카카오톡","#fee500"],
    ["delivery","🛵","배달의민족","#24b8b2"],["shopping","📦","쿠팡","#e94646"],["taxi","🚕","카카오 T","#30343b"],["hospital","✚","건강예약","#ed6675"],
    ["gov","📄","정부24","#3974c5"],["map","🗺","지도","#62a75f"],["message","✉","메시지","#6ea3dd"],["browser","🌐","삼성 인터넷","#6b65d8"]
  ];
  screen.innerHTML = `${phoneStatusBar()}<div class="apps-panel">
    <button type="button" id="openFinder" class="oneui-finder"><span>⌕</span><b>검색</b></button>
    <div class="oneui-app-grid">${allApps.map(a=>`<button type="button" class="drawer-app" data-drawer-app="${a[0]}"><i style="background:${a[3]};${a[0]==='chat'||a[0]==='bank'?'color:#111':''}">${a[1]}</i><span>${a[2]}</span></button>`).join('')}</div>
    <div class="page-dots"><b></b><i></i></div>
  </div>`;
  $("#openFinder").onclick = () => renderGalaxyFinder(guide, allApps);
  $$("[data-drawer-app]").forEach(btn => btn.onclick = () => openApp(btn.dataset.drawerApp));
}

function renderGalaxyFinder(guide, allApps) {
  state.launcherStage = "finder";
  const exactName = guide.mode === "web" ? "삼성 인터넷" : guide.appName.replace("사용 중인 은행 앱(연습에서는 ", "").replace(")", "");
  setLauncherInstructions(`검색 칸에 ‘${exactName}’이라고 입력하세요.`);
  const screen = $("#launcherView .phone-screen");
  screen.className = "phone-screen galaxy-finder";
  screen.innerHTML = `${phoneStatusBar()}<div class="finder-screen">
    <div class="finder-top"><button type="button" id="finderBack">←</button><input id="finderInput" autocomplete="off" placeholder="앱 검색"><button type="button" id="finderClear">×</button></div>
    <div class="finder-keyword">찾을 앱: <strong>${exactName}</strong></div>
    <div id="finderResults" class="finder-results"><p>앱 이름을 입력하면 결과가 여기에 나타납니다.</p></div>
    <div class="mock-keyboard">${['ㅂ','ㅈ','ㄷ','ㄱ','ㅅ','ㅛ','ㅕ','ㅑ','ㅐ','ㅔ','ㅁ','ㄴ','ㅇ','ㄹ','ㅎ','ㅋ','ㅌ','ㅊ','ㅍ','ㅠ','ㅜ','ㅡ'].map(k=>`<span>${k}</span>`).join('')}<b>가나다</b><em>검색</em></div>
  </div>`;
  const input=$("#finderInput"), results=$("#finderResults");
  input.focus();
  const update=()=>{
    const q=normalizeSearchText(input.value);
    const matches=allApps.filter(a=>!q||normalizeSearchText(a[2]).includes(q));
    results.innerHTML = q ? matches.map(a=>`<button type="button" class="finder-result" data-app="${a[0]}"><i style="background:${a[3]}">${a[1]}</i><span><strong>${a[2]}</strong><small>앱</small></span></button>`).join('') || '<p>검색 결과가 없습니다.</p>' : '<p>앱 이름을 입력하면 결과가 여기에 나타납니다.</p>';
    $$('[data-app]',results).forEach(btn=>btn.onclick=()=>openApp(btn.dataset.app));
  };
  input.addEventListener('input', update);
  $("#finderClear").onclick=()=>{input.value='';update();input.focus();};
  $("#finderBack").onclick=()=>renderGalaxyApps(guide);
}

function renderBrowserSearch() {
  state.launcherStage = "browser-search";
  const guide = getEntryGuide();
  $("#launcherTitle").textContent = "삼성 인터넷에서 검색어를 입력하세요";
  setLauncherInstructions(`검색창에 “${guide.query}”라고 그대로 입력한 뒤 [검색]을 누르세요.`, [
    "오른쪽 휴대전화 화면 위쪽의 긴 검색창을 한 번 누르세요.",
    `검색창에 “${guide.query}”라고 입력하세요. 띄어쓰기가 조금 달라도 괜찮습니다.`,
    "키보드 오른쪽 아래의 파란 [검색] 버튼 또는 화면의 [검색] 버튼을 누르세요."
  ], "검색창에는 주민번호, 카드번호, 계좌 비밀번호를 절대 입력하지 않습니다.");
  const screen = $("#launcherView .phone-screen");
  screen.className = "phone-screen browser-phone";
  screen.innerHTML = `<div class="phone-status realistic"><span>9:41</span><span>● ● ● 100%</span></div>
    <div class="browser-toolbar"><button type="button">←</button><button type="button">→</button><button type="button">⌂</button><span>삼성 인터넷</span><button type="button">☰</button></div>
    <div class="browser-page realistic-browser">
      <div class="portal-wordmark">NAVER</div>
      <form id="webSearchForm" class="web-search-form realistic-search">
        <label class="sr-only" for="webSearchInput">검색어 입력</label>
        <div><input id="webSearchInput" autocomplete="off" placeholder="검색어를 입력하세요"/><button type="submit">검색</button></div>
      </form>
      <div class="type-exact"><b>입력할 말</b><span>${guide.query}</span></div>
      <div id="webSearchResults" class="web-results"></div>
    </div>
    <div class="browser-bottom"><button>←</button><button>→</button><button>⌂</button><button>□</button><button>☰</button></div>`;
  $("#webSearchInput").focus();
  $("#webSearchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = $("#webSearchInput").value.trim();
    if (!value || scoreFreeText(value, guide.query) < 0.25) {
      wrong(`검색창에 “${guide.query}”와 비슷하게 입력해 보세요.`);
      return;
    }
    renderOfficialSearchResults(guide);
  });
}
function scoreFreeText(a,b){
  const aa=compactSearchText(a), bb=compactSearchText(b);
  if(!aa||!bb) return 0;
  if(aa.includes(bb)||bb.includes(aa)) return 1;
  const words=normalizeSearchText(b).split(" ").filter(Boolean);
  const hit=words.filter(w=>normalizeSearchText(a).includes(w)).length;
  return hit/Math.max(1,words.length);
}
function renderOfficialSearchResults(guide) {
  state.launcherStage = "browser-results";
  $("#launcherTitle").textContent = "검색 결과에서 공식 사이트를 누르세요";
  setLauncherInstructions(`제목이 “${guide.siteName}”이고 주소에 “${guide.domainHint}”이 보이는 결과를 누르세요.`, [
    `검색 결과에서 제목 “${guide.siteName}”을 찾으세요.`,
    `제목 아래 주소에 “${guide.domainHint}”이 포함되어 있는지 확인하세요.`,
    "‘광고’ 또는 ‘대행’이라고 적힌 결과가 아니라 공식 결과를 한 번 누르세요."
  ], "공식 사이트 주소를 확인하는 습관이 피싱 피해를 줄입니다.");
  const results = $("#webSearchResults");
  results.innerHTML = `<div class="search-summary"><b>검색 결과</b><span>${guide.query}</span></div>
    <button type="button" class="web-result sponsored" data-open-decoy="true">
      <small>광고 · fast-help.example</small><strong>빠른 예약·발급 대행</strong><span>수수료를 요구하거나 개인정보를 받을 수 있습니다.</span><em>누르지 마세요</em>
    </button>
    <button type="button" class="web-result official-result expected-result" data-open-official="true">
      <small>${guide.domainHint} · 공식</small><strong>${guide.siteName}</strong><span>${state.module.goal} 관련 공식 서비스입니다.</span><em>② 이 결과를 누르세요</em>
    </button>
    <button type="button" class="web-result decoy-result" data-open-decoy="true">
      <small>개인 블로그 · blog.example</small><strong>사용 방법 후기</strong><span>설명만 있고 실제 신청은 할 수 없습니다.</span>
    </button>`;
}
function openApp(id) {
  const guide = getEntryGuide();
  if (id !== guide.appId) {
    wrong(`지금은 “${guide.appName}”을 눌러야 합니다. 앱 아이콘 아래의 이름을 다시 확인하세요.`);
    return;
  }
  state.lastEntry = id;
  if (guide.mode === "web") {
    renderBrowserSearch();
    return;
  }
  // 앱을 여는 단계는 휴대전화 홈 화면에서 이미 끝났습니다.
  // 실제 앱 화면으로 들어갈 때 안내도 반드시 다음 단계로 함께 이동합니다.
  if (state.step === 0 && state.module.steps[0] && /앱|인터넷|문자|병원 찾기/.test(state.module.steps[0])) {
    state.step = 1;
  }
  showView("practiceView");
  renderPractice();
}

function renderPractice() {
  const m = state.module;
  $("#practiceTitle").textContent = m.title;
  const visibleStep = Math.min(state.step + 1, m.steps.length);
  const visibleLabel = m.steps[state.step] || m.steps[m.steps.length - 1] || "현재 단계";
  $("#practiceStep").textContent =
    `${visibleStep}단계 / 전체 ${m.steps.length}단계 · ${visibleLabel}`;
  $("#progressBar").style.width = `${(state.step / m.steps.length) * 100}%`;
  $("#mistakeCount").textContent = state.mistakes;
  $("#hintCount").textContent = state.hints;

  const simulator = $("#simulator");
  if (simulator) {
    simulator.innerHTML = '<div class="sim-loading" role="status">연습 화면을 불러오는 중입니다.</div>';
    simulator.scrollTop = 0;
  }

  const ui = renderers[m.id] || renderGeneric;
  try {
    ui();
  } catch (error) {
    console.error("연습 화면 렌더링 오류", error);
    if (simulator) {
      simulator.innerHTML = `<div class="sim-error"><strong>연습 화면을 불러오지 못했습니다.</strong><p>아래의 [화면 다시 불러오기]를 눌러 주세요.</p><button type="button" id="retrySimulator">화면 다시 불러오기</button></div>`;
      $("#retrySimulator")?.addEventListener("click", renderPractice, { once: true });
    }
  }

  // 단계가 바뀔 때 이전 단계에서 내려간 페이지 위치가 남아 있으면
  // 오른쪽 실제 화면이 화면 위쪽으로 사라져 빈 공간처럼 보일 수 있습니다.
  // 매 단계마다 페이지와 두 패널을 시작 위치로 맞춥니다.
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const panel = document.querySelector("#practiceView .mission-panel");
    const simPanel = document.querySelector("#practiceView .simulator");
    if (panel) panel.scrollTop = 0;
    if (simPanel) simPanel.scrollTop = 0;
  });
}
const detailedGuides = {
  ktx: [
    {word:'열차 조회', location:'코레일톡 승차권 화면의 맨 아래 파란 버튼', gesture:'파란 [열차 조회] 버튼의 가운데를 한 번 누르기', after:'서울→부산 열차 목록이 시간 순서대로 나타납니다.', title:'출발 서울, 도착 부산을 확인하고 [열차 조회]를 누르세요.', steps:['오른쪽 화면 왼쪽의 [출발] 칸에 “서울”이라고 적혀 있는지 읽으세요.','오른쪽 [도착] 칸에 “부산”이라고 적혀 있는지 읽으세요.','출발 날짜와 승객이 어른 1명인지 확인하세요.','화면 맨 아래 파란색 [열차 조회] 버튼을 한 번 누르세요.'], caution:'출발역과 도착역이 바뀌지 않았는지 반드시 다시 읽으세요.'},
    {word:'KTX 015 · 09:00', location:'열차 조회 결과의 가운데 두 번째 줄', gesture:'해당 줄 오른쪽의 [좌석선택]을 한 번 누르기', after:'5호차 등 호차를 고르는 좌석 화면이 열립니다.', title:'오전 9시 KTX 015편의 [좌석선택]을 누르세요.', steps:['열차번호 열에서 “KTX 015”를 찾으세요.','출발 시간이 “09:00”인지 확인하세요.','도착역이 부산인지 한 번 더 확인하세요.','같은 줄 맨 오른쪽의 [좌석선택]을 누르세요.'], caution:'시간만 보지 말고 열차번호와 도착역도 같이 확인하세요.'},
    {word:'5호차 · 6A', location:'좌석표의 6번째 줄 왼쪽 창가 자리', gesture:'[6A]를 누른 뒤 아래 [선택 완료] 누르기', after:'선택 좌석에 “6A”가 표시되고 예약 확인 화면으로 이동합니다.', title:'5호차 창가 좌석 [6A]를 선택하세요.', steps:['화면 위쪽에서 파란색으로 표시된 “5호차”를 확인하세요.','좌석표에서 숫자 6이 적힌 줄을 찾으세요.','그 줄 맨 왼쪽의 [6A] 좌석을 한 번 누르세요.','아래 선택한 좌석에 6A가 표시되면 [선택 완료]를 누르세요.'], caution:'A와 D는 창가, B와 C는 통로 쪽 좌석입니다.'},
    {word:'예약하기', location:'예약 정보 확인 화면의 맨 아래 파란 버튼', gesture:'내용을 위에서 아래로 읽은 뒤 [예약하기] 한 번 누르기', after:'결제수단 확인 화면이 나타납니다.', title:'열차와 좌석 정보를 확인하고 [예약하기]를 누르세요.', steps:['서울→부산이 맞는지 확인하세요.','KTX 015, 출발 09:00인지 확인하세요.','5호차 6A인지 확인하세요.','운임을 확인한 뒤 [예약하기]를 누르세요.'], caution:'실전에서는 결제 전에 날짜·시간·좌석을 마지막으로 다시 확인하세요.'},
    {word:'결제하기', location:'결제 화면의 맨 아래 큰 파란 버튼', gesture:'결제수단과 금액을 확인한 뒤 한 번 누르기', after:'모바일 승차권이 발권됩니다.', title:'결제 금액을 확인하고 [결제하기]를 누르세요.', steps:['결제 예정 금액을 읽으세요.','선택된 결제수단을 확인하세요.','실제 앱에서는 비밀번호나 인증 절차를 진행합니다.','연습 화면에서는 [결제하기]를 한 번 누르세요.'], caution:'다른 사람이 보낸 링크에서 결제하지 말고 반드시 코레일톡 안에서 진행하세요.'},
    {word:'승차권 확인', location:'발권된 모바일 승차권의 아래쪽 확인 버튼', gesture:'열차번호·시간·호차·좌석을 읽고 [확인] 누르기', after:'KTX 예매 연습이 완료됩니다.', title:'발권된 모바일 승차권을 확인하세요.', steps:['출발역 서울과 도착역 부산을 읽으세요.','출발시간 09:00을 확인하세요.','5호차 6A 좌석을 확인하세요.','기차에 타기 전 이 화면을 다시 열 수 있다는 점을 기억하고 [확인]을 누르세요.'], caution:'승차권 화면을 캡처한 것보다 앱의 최신 승차권 화면을 보여주는 것이 안전합니다.'}
  ],
  metro: [
    {word:'화면을 눌러주세요', location:'발매기 중앙의 큰 터치 화면', gesture:'화면 가운데를 손가락으로 한 번 누르기', after:'승차권 종류를 고르는 첫 메뉴가 나타납니다.', title:'발매기 화면 가운데를 한 번 누르세요.', steps:['기계 위쪽에 “교통카드 발매기”가 적혀 있는지 확인하세요.','중앙의 밝은 터치 화면을 찾으세요.','화면 가운데를 손가락으로 가볍게 한 번 누르세요.'], caution:'카드 투입구가 아니라 먼저 화면을 눌러 시작합니다.'},
    {word:'1회용 교통카드', location:'첫 메뉴 화면 왼쪽 위의 큰 버튼', gesture:'[1회용 교통카드]를 한 번 누르기', after:'목적지를 선택하는 화면이 나타납니다.', title:'[1회용 교통카드]를 누르세요.', steps:['화면에 있는 여러 메뉴의 이름을 천천히 읽으세요.','“1회용 교통카드”라고 적힌 버튼을 찾으세요.','찾았으면 버튼 가운데를 한 번 누르세요.'], caution:'교통카드 충전과 1회용 교통카드 발급은 서로 다른 메뉴입니다.'},
    {word:'잠실', location:'목적지 검색 결과 또는 역 이름 목록', gesture:'검색창에 잠실을 입력하거나 [잠실] 버튼 누르기', after:'서울역→잠실 운임 화면이 나타납니다.', title:'목적지 [잠실]을 선택하세요.', steps:['목적지 검색 칸을 한 번 누르세요.','화면 키보드에서 “잠실”을 입력하세요.','검색 결과의 “잠실” 역을 한 번 누르세요.','출발역 서울역, 도착역 잠실이 맞는지 확인하세요.'], caution:'이름이 비슷한 역이 있을 수 있으니 노선과 역 이름을 함께 확인하세요.'},
    {word:'성인 1명', location:'인원 선택 화면의 성인 항목', gesture:'성인 수량의 [+] 또는 [1명]을 누르기', after:'운임과 보증금이 합산되어 표시됩니다.', title:'성인 1명을 선택하고 금액을 확인하세요.', steps:['성인 항목을 찾으세요.','인원이 1명인지 확인하세요.','운임과 보증금 500원이 함께 표시되는지 읽으세요.'], caution:'1회용 교통카드는 보증금이 포함되며 도착 후 환급할 수 있습니다.'},
    {word:'결제', location:'금액 확인 화면 아래의 결제 방법 영역', gesture:'안내된 현금 또는 카드 결제 버튼 누르기', after:'발급 중 화면으로 바뀐 뒤 카드가 나옵니다.', title:'결제 방법을 선택하세요.', steps:['총금액을 읽으세요.','사용할 결제 방법을 선택하세요.','현금이라면 지폐·동전 투입구 위치를 확인하세요.','카드라면 카드 삽입 또는 접촉 안내를 따르세요.'], caution:'기계마다 사용 가능한 결제 방법이 다를 수 있으므로 화면 안내를 먼저 읽으세요.'},
    {word:'카드 받는 곳', location:'기기 아래쪽 넓은 카드 배출구', gesture:'발급된 1회용 카드를 꺼내기', after:'승차권 발급 연습이 완료됩니다.', title:'아래 카드 발급구에서 카드를 가져가세요.', steps:['화면에 “발급 완료”가 나오는지 기다리세요.','기기 아래쪽의 카드 받는 곳을 찾으세요.','나온 1회용 교통카드를 꺼내세요.','거스름돈이나 영수증이 있는지도 확인하세요.'], caution:'카드를 두고 가면 다시 개찰구를 통과할 수 없으므로 반드시 챙기세요.'}
  ],
  bank: [
    {word:'KB스타뱅킹', location:'휴대전화 홈 화면의 은행 앱 아이콘', gesture:'“KB스타뱅킹” 아이콘을 한 번 누르기', after:'은행 앱 첫 화면이 열립니다.', title:'[KB스타뱅킹] 앱을 찾아 한 번 누르세요.', steps:['앱 아이콘 아래 이름을 천천히 읽으세요.','“KB스타뱅킹”이라고 적힌 앱을 찾으세요.','노란 테두리가 있는 아이콘 가운데를 한 번 누르세요.'], caution:'문자메시지 속 링크로 은행 앱을 열지 말고 홈 화면의 공식 앱을 직접 누르세요.'},
    {word:'이체', location:'은행 앱 첫 화면의 자주 쓰는 메뉴', gesture:'[이체] 버튼을 한 번 누르기', after:'받는 계좌를 입력하는 화면이 나타납니다.', title:'은행 앱 첫 화면에서 [이체]를 누르세요.', steps:['화면 위쪽의 계좌 잔액을 확인하세요.','메뉴에서 “이체”라고 적힌 버튼을 찾으세요.','[이체] 버튼을 한 번 누르세요.'], caution:'조회·출금·이체는 서로 다른 메뉴이므로 버튼 글자를 반드시 읽으세요.'},
    {word:'계좌번호', location:'받는 분 계좌 입력 칸', gesture:'숫자 키패드로 계좌번호 입력 후 [다음] 누르기', after:'받는 분 이름 확인 화면이 나타납니다.', title:'받는 분의 은행과 계좌번호를 입력하세요.', steps:['받는 은행을 선택하세요.','계좌번호 입력 칸을 한 번 누르세요.','연습에 제시된 계좌번호를 숫자 키패드로 입력하세요.','입력한 숫자를 다시 읽고 [다음]을 누르세요.'], caution:'계좌번호 한 자리만 틀려도 다른 사람에게 보낼 수 있으므로 다시 확인하세요.'},
    {word:'30,000원', location:'보낼 금액 입력 칸', gesture:'숫자 3, 0, 0, 0, 0을 누른 뒤 확인', after:'받는 분과 금액 확인 화면이 나타납니다.', title:'송금 금액 [30,000원]을 입력하세요.', steps:['금액 입력 칸을 누르세요.','숫자 키패드로 30000을 입력하세요.','화면에 “30,000원”으로 표시되는지 읽으세요.','[다음]을 누르세요.'], caution:'0을 하나 더 누르면 금액이 10배가 되므로 쉼표가 찍힌 금액을 읽으세요.'},
    {word:'김민수', location:'최종 확인 화면의 받는 분 이름', gesture:'이름과 금액을 읽은 뒤 체크 또는 [확인] 누르기', after:'최종 이체 버튼이 활성화됩니다.', title:'받는 분 이름이 [김민수]인지 확인하세요.', steps:['받는 분 이름 “김민수”를 소리 내어 읽으세요.','은행과 계좌번호 뒤 네 자리를 확인하세요.','보낼 금액이 30,000원인지 확인하세요.','모두 맞으면 [확인]을 누르세요.'], caution:'이름이 다르면 절대로 보내지 말고 이전 화면으로 돌아가세요.'},
    {word:'이체하기', location:'최종 확인 화면 맨 아래 큰 버튼', gesture:'모든 내용을 확인한 뒤 한 번 누르기', after:'이체 완료 내역이 표시됩니다.', title:'마지막으로 확인하고 [이체하기]를 누르세요.', steps:['받는 분 이름을 다시 확인하세요.','금액을 다시 확인하세요.','수수료가 있는지 확인하세요.','모두 맞으면 [이체하기]를 누르세요.'], caution:'비밀번호·인증번호는 가족이나 은행 직원에게도 알려주지 마세요.'}
  ],
  chat: [
    {word:'카카오톡', location:'휴대전화 홈 화면의 노란 말풍선 앱', gesture:'[카카오톡] 아이콘을 한 번 누르기', after:'카카오톡 대화 목록이 열립니다.', title:'[카카오톡] 앱을 찾아 한 번 누르세요.', steps:['앱 아래 이름을 읽으세요.','“카카오톡”이라고 적힌 노란 말풍선 앱을 찾으세요.','아이콘 가운데를 한 번 누르세요.'], caution:'이름이 비슷한 다른 앱이 아니라 “카카오톡”인지 확인하세요.'},
    {word:'딸', location:'대화 목록에서 상대 이름이 적힌 줄', gesture:'“딸” 대화방을 한 번 누르기', after:'딸과의 대화 내용이 열립니다.', title:'대화 목록에서 [딸]을 찾아 누르세요.', steps:['대화 목록을 위에서 아래로 읽으세요.','이름이 “딸”인 줄을 찾으세요.','프로필과 이름을 확인한 뒤 그 줄을 한 번 누르세요.'], caution:'같은 이름이 있다면 프로필 사진과 최근 대화 내용도 확인하세요.'},
    {word:'메시지 입력', location:'대화방 화면 맨 아래 흰색 입력 칸', gesture:'입력 칸을 누르고 “잘 도착했다” 입력', after:'오른쪽 전송 버튼을 누를 수 있게 됩니다.', title:'메시지 입력 칸에 [잘 도착했다]를 입력하세요.', steps:['화면 맨 아래 “메시지 입력” 칸을 누르세요.','키보드가 나타나면 “잘 도착했다”를 입력하세요.','글자가 맞는지 다시 읽으세요.','오른쪽 [전송] 버튼을 누르세요.'], caution:'보낼 사람의 대화방이 맞는지 입력 전에 다시 확인하세요.'},
    {word:'＋ 또는 사진', location:'메시지 입력 칸 왼쪽의 더하기 버튼', gesture:'[＋]를 누른 뒤 사진 메뉴 선택', after:'휴대전화 사진 목록이 열립니다.', title:'왼쪽 아래 [＋] 버튼을 누르고 [사진]을 선택하세요.', steps:['입력 칸 왼쪽의 [＋] 버튼을 찾으세요.','[＋]를 한 번 누르세요.','나타난 메뉴에서 “사진”을 누르세요.','사진 목록이 열릴 때까지 기다리세요.'], caution:'카메라 촬영과 기존 사진 선택은 서로 다른 메뉴입니다.'},
    {word:'사진 1장', location:'사진 목록에서 연습용 사진', gesture:'사진 한 장을 선택하고 [전송] 누르기', after:'대화방에 사진 미리보기가 나타납니다.', title:'보낼 사진 한 장을 선택하고 [전송]을 누르세요.', steps:['사진을 한 번 눌러 체크 표시가 생기는지 보세요.','선택한 사진이 맞는지 크게 확인하세요.','오른쪽 위 또는 아래의 [전송]을 누르세요.'], caution:'신분증·통장·비밀번호가 보이는 사진은 보내지 마세요.'},
    {word:'보낸 메시지와 사진', location:'대화방 오른쪽 말풍선 영역', gesture:'전송된 내용을 눈으로 확인하고 [확인] 누르기', after:'메신저 연습이 완료됩니다.', title:'메시지와 사진이 전송됐는지 확인하세요.', steps:['오른쪽 말풍선에 “잘 도착했다”가 보이는지 확인하세요.','그 아래 보낸 사진이 보이는지 확인하세요.','전송 실패 표시가 없는지 확인하세요.','모두 보이면 [확인]을 누르세요.'], caution:'시계 모양이나 빨간 느낌표가 보이면 전송되지 않은 것입니다.'}
  ]
};

function inferGuide(title, reason, steps) {
  const quoted = [...String(title).matchAll(/[\[“"]([^\]”"]+)[\]”"]/g)].map(m => m[1]);
  const word = quoted[0] || String(title).replace(/누르세요|선택하세요|확인하세요|입력하세요|\.|오른쪽 화면에서/g, '').trim();
  return {
    word: word || '안내된 글자',
    location: '오른쪽 연습 화면에서 노란 테두리가 표시된 곳',
    gesture: '글자와 위치를 확인한 뒤 손가락으로 한 번 누르기',
    after: '화면이 바뀌고 다음 단계 안내가 나타납니다.',
    title,
    steps: Array.isArray(steps) && steps.length ? steps : [title],
    caution: reason
  };
}
function instruction(title, reason = "", steps = []) {
  // 실제 오른쪽 화면을 만든 렌더러가 전달한 현재 행동만 사용합니다.
  // 별도 설명표를 덮어쓰지 않아 화면과 안내가 어긋나지 않습니다.
  const command = String(title || "오른쪽 화면에서 안내된 항목을 누르세요.")
    .replace(/\s+/g, " ")
    .trim();

  const instructionEl = $("#currentInstruction");
  if (instructionEl) instructionEl.textContent = command;

  const numberEl = document.querySelector("#practiceView .command-number");
  if (numberEl) numberEl.textContent = String(Math.min(state.step + 1, state.module?.steps?.length || state.step + 1));

  const repeat = $("#repeatInstruction");
  if (repeat) {
    repeat.onclick = () => {
      window.speechSynthesis?.cancel();
      const utterance = new SpeechSynthesisUtterance(command);
      utterance.lang = "ko-KR";
      utterance.rate = 0.76;
      window.speechSynthesis?.speak(utterance);
    };
  }

  const panel = document.querySelector("#practiceView .mission-panel");
  if (panel) panel.scrollTop = 0;
}

function next(data = {}) {
  Object.assign(state.data, data);
  state.step++;
  if (state.step >= state.module.steps.length) {
    complete();
  } else renderPractice();
}
function wrong(msg) {
  state.mistakes++;
  state.stepErrors[state.step] = (state.stepErrors[state.step] || 0) + 1;
  $("#mistakeCount").textContent = state.mistakes;
  toast(msg);
}
function hint() {
  state.hints++;
  $("#hintCount").textContent = state.hints;
  const hints = {
    ktx: "출발역과 도착역을 먼저 고르고 파란 조회 버튼을 누르세요.",
    metro: "첫 화면에서 “1회용 교통카드”를 선택합니다.",
    gtx: "GTX는 좌석 예약이 아니라 교통카드를 발급받아 이용합니다.",
    bank: "이체 버튼을 찾은 뒤 계좌번호와 받는 분 이름을 꼭 확인하세요.",
    chat: "노란색 말풍선 앱을 찾으세요.",
    video: "대화방 오른쪽 위의 카메라 모양 버튼을 찾으세요.",
    gov: "주소가 gov.kr로 끝나는 공식 사이트인지 확인하세요.",
  };
  const message = hints[state.module.id] || "화면의 버튼 글자를 천천히 읽고 현재 단계와 같은 뜻의 메뉴를 찾으세요.";
  toast(state.mode === "field" ? `도움: ${message}` : message);
}
function complete() {
  const sec = Math.max(1, Math.round((Date.now() - state.start) / 1000));
  $("#resultTitle").textContent = `${state.module.title} 연습을 마쳤습니다.`;
  $("#resultSummary").textContent =
    `“${state.module.goal}” 목표를 끝까지 수행했습니다.`;
  const weakSteps = Object.entries(state.stepErrors).filter(([, count]) => count > 0).map(([step]) => state.module.steps[Number(step)]);
  const checklist = document.createElement("div");
  checklist.className = "result-checklist";
  checklist.innerHTML = `<h3>현장에 가기 전 마지막 점검</h3><ul>
    <li>앱이나 공식 사이트를 다른 사람 도움 없이 찾을 수 있는지 확인하세요.</li>
    <li>결제·송금 전 이름, 금액, 날짜, 목적지를 다시 읽으세요.</li>
    <li>${weakSteps.length ? `다시 연습하면 좋은 단계: <b>${weakSteps.join(", ")}</b>` : "실수한 단계가 없습니다. 실전 모드로 한 번 더 연습해 보세요."}</li>
  </ul>`;
  const resultStats = $(".result-stats");
  $("#resultView .result-checklist")?.remove();
  resultStats?.insertAdjacentElement("afterend", checklist);
  $("#resultTime").textContent = `${Math.floor(sec / 60)}분 ${sec % 60}초`;
  $("#resultMistakes").textContent = state.mistakes + "회";
  $("#resultHints").textContent = state.hints + "회";
  const list = readCompletedModules();
  if (!list.includes(state.module.id)) {
    list.push(state.module.id);
    saveCompletedModules(list);
  }
  showView("resultView");
}
function sim(html) {
  const safeMarkup = String(html ?? "")
    .replace(/\b(?:undefined|unfinded|null)\b/gi, "정보 없음");
  $("#simulator").innerHTML = safeMarkup;
}
function simHeader(title, sub = "교육용 모의 화면") {
  // 앱 화면 안에 실제로 존재하지 않는 교육용 파란 제목 띠는 표시하지 않습니다.
  return "";
}
const renderers = {
  ktx() {
    const s = state.step;
    if (s === 0) {
      instruction(
        "출발역·도착역·날짜·인원을 직접 선택한 뒤 [열차 조회]를 누르세요.",
        "실제 예매에서는 이미 채워진 값을 믿지 말고 각 항목을 직접 열어 확인하는 습관이 중요합니다.",
        [
          "[출발]을 눌러 역 목록에서 서울을 선택하세요.",
          "[도착]을 눌러 역 목록에서 부산을 선택하세요.",
          "[출발일]을 눌러 달력에서 7월 20일을 선택하세요.",
          "승객이 어른 1명, 열차 종류가 KTX 전체인지 확인하세요.",
          "모든 값이 맞으면 [열차 조회]를 누르세요."
        ]
      );
      state.data.from ||= '';
      state.data.to ||= '';
      state.data.date ||= '';
      sim(
        simHeader("레일온 · 승차권 예매", "실제 결제는 되지 않는 교육용 모의 화면") +
          `<div class="rail-page app-real-shell" style="position:relative">
            <div class="rail-nav"><b>승차권</b><span>관광상품</span><span>여행정보</span><span>마이</span></div>
            <div class="rail-tabs"><button class="active">일반승차권</button><button>할인승차권</button><button>정기승차권</button></div>
            <div class="rail-search-card">
              <div class="route-row">
                <button class="station-box" id="chooseFrom"><small>출발</small><strong id="fromLabel">${state.data.from || '역 선택'}</strong><span>〉</span></button>
                <button class="swap-route" id="swapRoute" type="button" aria-label="출발역과 도착역 바꾸기">⇄</button>
                <button class="station-box" id="chooseTo"><small>도착</small><strong id="toLabel">${state.data.to || '역 선택'}</strong><span>〉</span></button>
              </div>
              <div class="booking-grid">
                <button class="station-box" id="chooseDate"><small>출발일</small><strong id="dateLabel">${state.data.date || '날짜 선택'}</strong><span>달력 〉</span></button>
                <label><span>출발시간</span><select id="travelTime"><option value="08">08시 이후</option><option value="09">09시 이후</option><option value="10">10시 이후</option></select></label>
                <label><span>승객</span><select id="passenger"><option value="1">어른 1명</option><option value="2">어른 2명</option><option value="senior">경로 1명</option></select></label>
                <label><span>열차 종류</span><select id="trainKind"><option value="all">KTX 전체</option><option value="ktx">KTX</option><option value="sancheon">KTX-산천</option></select></label>
              </div>
              <details class="realism-note"><summary>왕복·좌석 방향 등 추가 조건</summary><p>실제 앱에서는 왕복 여부, 직통 여부, 좌석 방향 등을 추가로 설정할 수 있습니다. 이번 과제는 편도 일반승차권입니다.</p></details>
              <button class="rail-search-button" id="searchTrain">열차 조회</button>
            </div>
          </div>`
      );
      const openStations=(kind)=>{
        const shell=$('.app-real-shell');
        shell.insertAdjacentHTML('beforeend',`<div class="station-modal" id="stationModal"><header><button id="closeStation">←</button><b>${kind==='from'?'출발역':'도착역'} 선택</b></header><input class="station-search" id="stationSearch" placeholder="역 이름을 입력하세요"><div class="station-tabs"><button class="active">주요역</button><button>최근역</button><button>가나다</button></div><div class="station-list">${['서울','용산','광명','수원','대전','동대구','부산','울산','경주','천안아산','오송','익산'].map(x=>`<button data-station="${x}">${x}</button>`).join('')}</div></div>`);
        $('#closeStation').onclick=()=>$('#stationModal').remove();
        $('#stationSearch').oninput=(e)=>{$$('[data-station]').forEach(b=>b.hidden=!b.dataset.station.includes(e.target.value.trim()));};
        $$('[data-station]').forEach(b=>b.onclick=()=>{state.data[kind]=b.dataset.station;$(`#${kind==='from'?'fromLabel':'toLabel'}`).textContent=b.dataset.station;$('#stationModal').remove();});
      };
      $('#chooseFrom').onclick=()=>openStations('from');
      $('#chooseTo').onclick=()=>openStations('to');
      $('#swapRoute').onclick=()=>{[state.data.from,state.data.to]=[state.data.to,state.data.from];$('#fromLabel').textContent=state.data.from||'역 선택';$('#toLabel').textContent=state.data.to||'역 선택';};
      $('#chooseDate').onclick=()=>{
        $('.app-real-shell').insertAdjacentHTML('beforeend',`<div class="calendar-modal" id="calendarModal"><header><button id="closeCalendar">←</button><b>출발일 선택</b></header><div class="calendar-head"><button>〈</button><strong>2026년 7월</strong><button>〉</button></div><div class="calendar-grid">${['일','월','화','수','목','금','토'].map(x=>`<span class="weekday">${x}</span>`).join('')}${Array.from({length:31},(_,i)=>`<button data-day="${i+1}" class="${i+1===18?'today':''}">${i+1}</button>`).join('')}</div></div>`);
        $('#closeCalendar').onclick=()=>$('#calendarModal').remove();
        $$('[data-day]').forEach(b=>b.onclick=()=>{state.data.date=`2026-07-${String(b.dataset.day).padStart(2,'0')}`;$('#dateLabel').textContent=`7월 ${b.dataset.day}일`;$('#calendarModal').remove();});
      };
      $('#searchTrain').onclick=()=>{
        if(state.data.from!=='서울') return wrong('출발역 목록을 열어 “서울”을 선택하세요.');
        if(state.data.to!=='부산') return wrong('도착역 목록을 열어 “부산”을 선택하세요.');
        if(state.data.date!=='2026-07-20') return wrong('달력에서 7월 20일을 선택하세요.');
        if($('#passenger').value!=='1') return wrong('이번 과제는 어른 1명입니다.');
        next({from:state.data.from,to:state.data.to,date:state.data.date});
      };
    } else if (s === 1) {
      instruction(
        "오전 9시에 출발하는 KTX 015편의 [좌석선택]을 누르세요.",
        "같은 구간이라도 출발시각과 도착시각이 다르므로 열차번호와 시간을 함께 확인해야 합니다.",
        [
          "표에서 출발시각이 09:00인 줄을 찾으세요.",
          "그 줄의 열차번호가 KTX 015인지 확인하세요.",
          "가장 오른쪽 파란 [좌석선택] 버튼을 누르세요."
        ]
      );
      sim(
        simHeader(`${state.data.from} → ${state.data.to} 열차 조회`, "조회 결과 연습 화면") +
          `<div class="rail-page">
            <div class="result-route"><b>${state.data.from}</b><span>→</span><b>${state.data.to}</b><small>${state.data.date || "2026-07-20"} · 어른 1명</small></div>
            <div class="result-legend"><span>일반실</span><span>직통</span><span>잔여석 표시</span></div>
            <div class="train-list">
              <div class="train-card"><div><b>KTX 011</b><small>직통</small></div><div><strong>08:27</strong><small>서울</small></div><div class="journey-line"><span>2시간 35분</span></div><div><strong>11:02</strong><small>부산</small></div><div><b>59,800원</b><small>일반실 가능</small></div><button data-train="KTX 011">좌석선택</button></div>
              <div class="train-card target-row"><div><b>KTX 015</b><small>직통</small></div><div><strong>09:00</strong><small>서울</small></div><div class="journey-line"><span>2시간 41분</span></div><div><strong>11:41</strong><small>부산</small></div><div><b>59,800원</b><small>일반실 가능</small></div><button class="target-control" data-train="KTX 015"><span class="finger">☝</span> 좌석선택</button></div>
              <div class="train-card"><div><b>KTX 019</b><small>직통</small></div><div><strong>09:32</strong><small>서울</small></div><div class="journey-line"><span>2시간 36분</span></div><div><strong>12:08</strong><small>부산</small></div><div><b>59,800원</b><small>일반실 가능</small></div><button data-train="KTX 019">좌석선택</button></div>
            </div>
          </div>`,
      );
      $$('[data-train]').forEach((b) => b.onclick = () => {
        if (b.dataset.train !== 'KTX 015') return wrong('이번 연습에서는 오전 9시 출발 KTX 015편을 선택하세요.');
        next({ train: 'KTX 015', time: '09:00', arrival: '11:41' });
      });
    } else if (s === 2) {
      instruction(
        "5호차의 창가 좌석 6A를 선택한 뒤 [선택 완료]를 누르세요.",
        "KTX 일반실은 A와 D가 창가, B와 C가 통로 쪽입니다. 회색 좌석은 이미 예약된 좌석입니다.",
        [
          "화면 위쪽 호차 목록에서 5호차가 선택되어 있는지 확인하세요.",
          "좌석표에서 6번째 줄의 왼쪽 창가 좌석 [6A]를 누르세요.",
          "좌석이 파란색으로 바뀌면 아래 [선택 완료]를 누르세요."
        ]
      );
      let rows = '';
      for (let r = 1; r <= 10; r++) {
        const seat = (letter) => {
          const code = `${r}${letter}`;
          const booked = ['2A','2D','4C','7B','9D'].includes(code);
          const target = code === '6A';
          return `<button class="seat ${booked ? 'booked' : ''} ${target ? 'target-control' : ''}" data-seat="${code}" ${booked ? 'disabled' : ''}>${target ? '<span class="finger">☝</span>' : ''}${code}</button>`;
        };
        rows += `<div class="seat-row"><span class="row-number">${r}</span>${seat('A')}${seat('B')}<span class="aisle">통로</span>${seat('C')}${seat('D')}</div>`;
      }
      sim(
        simHeader(`${state.data.train} · 좌석 선택`, "5호차 일반실") +
          `<div class="rail-page seat-page">
            <div class="car-tabs"><button>3호차</button><button>4호차</button><button class="active">5호차</button><button>6호차</button><button>7호차</button></div>
            <div class="seat-guide"><span class="available-box"></span>선택 가능 <span class="selected-box"></span>선택한 좌석 <span class="booked-box"></span>예약 완료</div>
            <div class="direction">열차 진행 방향 ↑</div>
            <div class="seat-map">${rows}</div>
            <div class="selected-seat-bar"><span>선택한 좌석</span><strong id="selectedSeatText">없음</strong><button class="rail-search-button" id="seatNext">선택 완료</button></div>
          </div>`,
      );
      $$('.seat:not(.booked)').forEach((b) => b.onclick = () => {
        $$('.seat').forEach((x) => x.classList.remove('selected'));
        b.classList.add('selected');
        state.data.seat = b.dataset.seat;
        $('#selectedSeatText').textContent = `5호차 ${b.dataset.seat}`;
      });
      $('#seatNext').onclick = () => {
        if (!state.data.seat) return wrong('좌석표에서 6A 좌석을 먼저 누르세요.');
        if (state.data.seat !== '6A') return wrong('이번 목표 좌석은 5호차 6A 창가 좌석입니다.');
        next();
      };
    } else if (s === 3) {
      instruction(
        "예약 정보를 한 줄씩 확인한 뒤 [결제하기]를 누르세요.",
        "출발역, 시간, 호차 또는 좌석이 잘못되면 실제 탑승 때 큰 불편이 생길 수 있습니다.",
        [
          "구간이 서울 → 부산인지 확인하세요.",
          "열차가 KTX 015, 출발시각이 09:00인지 확인하세요.",
          "좌석이 5호차 6A인지 확인한 뒤 [결제하기]를 누르세요."
        ]
      );
      sim(
        simHeader("예약 내용 확인", "결제 전 마지막 확인") +
          `<div class="rail-page"><div class="booking-summary">
            <div class="summary-title"><b>${state.data.from}</b><span>→</span><b>${state.data.to}</b></div>
            <dl><div><dt>출발일</dt><dd>${state.data.date || '2026-07-20'}</dd></div><div><dt>열차</dt><dd>${state.data.train}</dd></div><div><dt>출발·도착</dt><dd>${state.data.time} → ${state.data.arrival}</dd></div><div><dt>승객</dt><dd>어른 1명</dd></div><div><dt>좌석</dt><dd>5호차 ${state.data.seat}</dd></div><div><dt>결제금액</dt><dd class="price">59,800원</dd></div></dl>
            <label class="agreement"><input type="checkbox" id="agreeCheck"> 승차권 예약 내용을 확인했습니다.</label>
            <button class="rail-search-button target-control" id="confirmTrain"><span class="finger">☝</span> 결제하기</button>
          </div></div>`,
      );
      $('#confirmTrain').onclick = () => $('#agreeCheck').checked ? next() : wrong('예약 내용을 확인한 뒤 확인 체크칸을 먼저 누르세요.');
    } else if (s === 4) {
      instruction(
        "결제 예정 금액을 확인하고 [모의 결제]를 누르세요.",
        "이 연습에서는 실제 카드번호나 비밀번호를 입력하지 않습니다.",
        [
          "결제 예정 금액이 59,800원인지 확인하세요.",
          "실제 카드정보를 입력하지 않는 연습 화면임을 확인하세요.",
          "파란 [모의 결제] 버튼을 누르세요."
        ]
      );
      sim(
        simHeader("결제", "안전한 모의 결제") +
          `<div class="rail-page"><div class="payment-panel"><div class="payment-method active"><span>신용·체크카드</span><b>선택됨</b></div><div class="payment-total"><span>총 결제금액</span><strong>59,800원</strong></div><div class="safe-payment">🔒 실제 카드정보를 입력하지 않습니다.</div><button class="rail-search-button target-control" id="payTrain"><span class="finger">☝</span> 모의 결제</button></div></div>`,
      );
      $('#payTrain').onclick = () => next();
    } else {
      instruction(
        "승차권의 출발시각과 좌석을 소리 내어 확인한 뒤 [연습 끝내기]를 누르세요.",
        "실제 역에서는 승차권의 열차번호, 출발시각, 호차, 좌석을 확인하고 승강장으로 이동합니다.",
        [
          "열차번호 KTX 015를 확인하세요.",
          "서울 09:00 출발과 부산 11:41 도착을 확인하세요.",
          "5호차 6A를 확인한 뒤 [연습 끝내기]를 누르세요."
        ]
      );
      sim(
        simHeader("모바일 승차권", "발권 완료") +
          `<div class="rail-page"><div class="mobile-ticket"><div class="ticket-brand">레일온 승차권</div><div class="ticket-route"><div><small>출발</small><strong>${state.data.from}</strong><b>${state.data.time}</b></div><span>→</span><div><small>도착</small><strong>${state.data.to}</strong><b>${state.data.arrival}</b></div></div><div class="ticket-details"><span>${state.data.train}</span><strong>5호차 ${state.data.seat}</strong><span>어른 1명</span></div><div class="qr-sim">▦▦▦<br>▦▦▦</div><p>열차 출발 전 승차권 화면을 준비하세요.</p></div><button class="rail-search-button target-control" id="finishTrain"><span class="finger">☝</span> 연습 끝내기</button></div>`,
      );
      $('#finishTrain').onclick = () => next();
    }
  },
  metro() {
    renderTicketKiosk("서울 지하철", "서울역", "잠실역", 1650);
  },
  gtx() {
    renderTicketKiosk("GTX-A", "운정중앙", "서울역", 4450);
  },
  bank() {
    const s = state.step;
    if (s === 0) {
      instruction("첫 화면에서 “이체” 버튼을 누르세요.");
      sim(
        simHeader("한빛은행") +
          `<div class="bank-app"><div class="app-header">한빛은행 홈</div><div class="account-card"><span>입출금통장 123-***-456789</span><strong>1,245,800원</strong></div><div class="sim-body choice-grid"><button class="choice-card" id="transfer">↗ 이체</button><button class="choice-card">조회</button><button class="choice-card">공과금</button><button class="choice-card">카드</button></div></div>`,
      );
      $("#transfer").onclick = () => next();
    } else if (s === 1) {
      instruction("받는 분 계좌번호를 입력하고 다음을 누르세요.");
      sim(
        simHeader("한빛은행 · 계좌이체") +
          `<div class="bank-app"><div class="app-header">받는 분 계좌</div><div class="sim-body"><div class="field"><label>은행</label><select><option>한빛은행</option><option>국민은행</option><option>농협은행</option></select></div><div class="field"><label>계좌번호</label><input id="account" inputmode="numeric" placeholder="숫자만 입력" value="110245678901"></div><button class="big-primary" id="accountNext">다음</button></div></div>`,
      );
      $("#accountNext").onclick = () =>
        $("#account").value.length >= 10
          ? next({ account: $("#account").value })
          : wrong("계좌번호를 다시 확인하세요.");
    } else if (s === 2) {
      instruction("송금할 금액 30,000원을 입력하세요.");
      sim(
        simHeader("한빛은행 · 금액 입력") +
          `<div class="bank-app"><div class="app-header">보낼 금액</div><div class="sim-body"><input id="amount" value="" readonly style="width:100%;font-size:2rem;padding:18px;text-align:right"><div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "00", 0, "←"].map((x) => `<button data-key="${x}">${x}</button>`).join("")}</div><button class="big-primary" id="amountNext">다음</button></div></div>`,
      );
      $$("[data-key]").forEach(
        (b) =>
          (b.onclick = () => {
            let v = $("#amount").value;
            if (b.dataset.key === "←") v = v.slice(0, -1);
            else v += b.dataset.key;
            $("#amount").value = v;
          }),
      );
      $("#amountNext").onclick = () =>
        $("#amount").value === "30000"
          ? next({ amount: 30000 })
          : wrong("이번 목표 금액은 30,000원입니다.");
    } else if (s === 3) {
      instruction(
        "받는 분 이름이 “김민수”인지 확인하세요.",
        "이름이 다르면 절대 송금하지 말고 이전으로 돌아가야 합니다.",
      );
      sim(
        simHeader("받는 분 확인") +
          `<div class="bank-app"><div class="app-header">계좌 확인 결과</div><div class="sim-body"><div class="account-card"><span>받는 분</span><strong>김민수</strong><p>한빛은행 ${state.data.account}</p></div><button class="big-primary" id="nameOk">김민수님이 맞습니다</button><button class="big-primary" style="background:#777" id="nameNo">아닙니다</button></div></div>`,
      );
      $("#nameOk").onclick = () => next();
      $("#nameNo").onclick = () => wrong("이번 목표의 받는 분은 김민수입니다.");
    } else if (s === 4) {
      instruction("모든 내용을 마지막으로 확인하고 이체를 누르세요.");
      sim(
        simHeader("이체 최종 확인") +
          `<div class="bank-app"><div class="app-header">이체 내용</div><div class="sim-body"><table class="data-table"><tr><th>받는 분</th><td>김민수</td></tr><tr><th>계좌</th><td>${state.data.account}</td></tr><tr><th>금액</th><td>30,000원</td></tr><tr><th>수수료</th><td>0원</td></tr></table><button class="big-primary" id="sendMoney">모의 이체하기</button></div></div>`,
      );
      $("#sendMoney").onclick = () => next();
    } else {
      instruction("이체 결과를 확인하고 끝내세요.");
      sim(
        simHeader("이체 완료") +
          `<div class="bank-app"><div class="app-header">✓ 이체 완료</div><div class="sim-body"><div class="result-check">✓</div><h2 style="text-align:center">김민수님께<br>30,000원을 보냈습니다.</h2><button class="big-primary" id="finishBank">확인</button></div></div>`,
      );
      $("#finishBank").onclick = () => next();
    }
  },
  chat() {
    renderChat(false);
  },
  video() {
    renderChat(true);
  },
  gov() {
    renderBrowserFlow(
      "정부24",
      "주민등록등본 발급",
      "주민등록표 등본(초본)",
      "발급하기",
    );
  },
  hotel() {
    renderBrowserFlow(
      "여행숙소",
      "부산 호텔 1박",
      "무료 취소 가능한 객실",
      "예약하기",
    );
  },
  hospital() {
    renderHospitalFlow();
  },
  air() {
    const s = state.step;
    state.data.tripType ||= "round";
    state.data.from ||= "";
    state.data.to ||= "";
    state.data.departDate ||= "";
    state.data.returnDate ||= "";
    state.data.passengers ||= 1;

    const airlineShell = (body, title = "항공권 예약") => `
      <div class="air-app release-phone-ui">
        <div class="air-status"><span>9:41</span><span>5G ▰ 92%</span></div>
        <header class="air-topbar"><button type="button" aria-label="뒤로가기">‹</button><strong>${escapeHtml(title)}</strong><button type="button" aria-label="메뉴">☰</button></header>
        <main class="air-content">${body}</main>
      </div>`;

    const flightCards = (items, selectedId = "") => items.map(([no,dep,arr,price]) => `
      <button class="flight-card ${selectedId===no?'selected':''}" data-flight="${no}">
        <div><small>${no}</small><strong>${dep}</strong><span>${s < 4 ? '인천' : '제주'}</span></div>
        <div class="flight-line"><span>1시간 10분</span><i></i><small>직항</small></div>
        <div><strong>${arr}</strong><span>${s < 4 ? '제주' : '인천'}</span></div>
        <div class="flight-price"><strong>${price}원~</strong><small>운임 선택</small></div>
      </button>`).join('');

    const fareCards = (prefix) => `
      <div class="fare-list">
        <button class="fare-card" data-fare="special"><span>특가 운임</span><strong>${prefix==='out'?'89,000':'91,000'}원</strong><small>위탁수하물 없음 · 변경 불가</small></button>
        <button class="fare-card recommended" id="standardFare" data-fare="standard"><span>일반 운임</span><strong>${prefix==='out'?'102,000':'108,000'}원</strong><small>위탁수하물 15kg · 변경 수수료 있음</small><em>추천</em></button>
        <button class="fare-card" data-fare="flex"><span>유연 운임</span><strong>${prefix==='out'?'129,000':'135,000'}원</strong><small>위탁수하물 20kg · 일정 변경 가능</small></button>
      </div>`;

    if (s === 1) {
      instruction("인천→제주 왕복, 8월 20일~22일, 성인 1명을 입력하고 [항공편 검색]을 누르세요.");
      sim(airlineShell(`
        <section class="air-hero"><span>어디로 떠나시나요?</span><h2>항공권 검색</h2></section>
        <div class="segmented" role="group" aria-label="여정 종류"><button id="roundTrip" class="active" type="button">왕복</button><button id="oneWay" type="button">편도</button></div>
        <section class="air-card route-card">
          <button id="airFrom" class="route-field"><small>출발지</small><strong id="airFromLabel">${escapeHtml(state.data.from ? `${state.data.from} 인천` : "공항 선택")}</strong><span>›</span></button>
          <button id="swapAir" class="swap-air" type="button" aria-label="출발지와 도착지 바꾸기">⇄</button>
          <button id="airTo" class="route-field"><small>도착지</small><strong id="airToLabel">${escapeHtml(state.data.to ? `${state.data.to} 제주` : "공항 선택")}</strong><span>›</span></button>
        </section>
        <section class="air-card date-grid">
          <button id="departDate"><small>가는 날</small><strong id="departDateLabel">${escapeHtml(state.data.departDate ? '8월 20일' : "날짜 선택")}</strong></button>
          <button id="returnDate"><small>오는 날</small><strong id="returnDateLabel">${escapeHtml(state.data.returnDate ? '8월 22일' : "날짜 선택")}</strong></button>
        </section>
        <section class="air-card passenger-row"><div><small>탑승객</small><strong>성인 <span id="passengerCount">${state.data.passengers}</span>명</strong></div><div class="counter"><button id="passengerMinus" type="button">−</button><button id="passengerPlus" type="button">＋</button></div></section>
        <button class="air-primary" id="searchFlights">항공편 검색</button>
      `));
      const airportPicker = (kind) => {
        const root = document.querySelector('.air-app');
        root.insertAdjacentHTML('beforeend', `<div class="air-modal" id="airModal"><div class="air-modal-head"><button id="closeAirModal">‹</button><strong>${kind === 'from' ? '출발 공항' : '도착 공항'} 선택</strong></div><input id="airportSearch" placeholder="도시 또는 공항 검색"><div class="airport-list">${[['ICN','인천','서울/인천'],['GMP','김포','서울/김포'],['CJU','제주','제주'],['PUS','김해','부산'],['TAE','대구','대구']].map(([code,name,city])=>`<button data-airport="${code}" data-name="${name}"><b>${code}</b><span>${city}</span><small>${name}공항</small></button>`).join('')}</div></div>`);
        $('#closeAirModal').onclick = () => $('#airModal').remove();
        $('#airportSearch').oninput = e => { const q=e.target.value.trim().toLowerCase(); $$('.airport-list button').forEach(b=>b.hidden=!`${b.dataset.airport} ${b.dataset.name}`.toLowerCase().includes(q)); };
        $$('.airport-list button').forEach(b=>b.onclick=()=>{ state.data[kind]=b.dataset.airport; $(`#air${kind==='from'?'From':'To'}Label`).textContent=`${b.dataset.airport} ${b.dataset.name}`; $('#airModal').remove(); });
      };
      $('#airFrom').onclick=()=>airportPicker('from');
      $('#airTo').onclick=()=>airportPicker('to');
      $('#swapAir').onclick=()=>{ [state.data.from,state.data.to]=[state.data.to,state.data.from]; $('#airFromLabel').textContent=state.data.from||'공항 선택'; $('#airToLabel').textContent=state.data.to||'공항 선택'; };
      const datePicker=(kind)=>{ const root=document.querySelector('.air-app'); root.insertAdjacentHTML('beforeend', `<div class="air-modal" id="airModal"><div class="air-modal-head"><button id="closeAirModal">‹</button><strong>${kind==='departDate'?'가는 날':'오는 날'} 선택</strong></div><div class="air-calendar-title">2026년 8월</div><div class="air-calendar">${['일','월','화','수','목','금','토'].map(d=>`<span>${d}</span>`).join('')}${Array.from({length:31},(_,i)=>`<button data-date="2026-08-${String(i+1).padStart(2,'0')}">${i+1}</button>`).join('')}</div></div>`); $('#closeAirModal').onclick=()=>$('#airModal').remove(); $$('.air-calendar button').forEach(b=>b.onclick=()=>{state.data[kind]=b.dataset.date; $(`#${kind}Label`).textContent=`8월 ${Number(b.dataset.date.slice(-2))}일`; $('#airModal').remove();}); };
      $('#departDate').onclick=()=>datePicker('departDate'); $('#returnDate').onclick=()=>datePicker('returnDate');
      $('#passengerMinus').onclick=()=>{state.data.passengers=Math.max(1,state.data.passengers-1);$('#passengerCount').textContent=state.data.passengers};
      $('#passengerPlus').onclick=()=>{state.data.passengers=Math.min(4,state.data.passengers+1);$('#passengerCount').textContent=state.data.passengers};
      $('#oneWay').onclick=()=>wrong('이번 연습은 왕복 항공권입니다.');
      $('#searchFlights').onclick=()=>{
        if(state.data.from!=='ICN') return wrong('출발 공항으로 인천(ICN)을 선택하세요.');
        if(state.data.to!=='CJU') return wrong('도착 공항으로 제주(CJU)를 선택하세요.');
        if(state.data.departDate!=='2026-08-20') return wrong('가는 날은 8월 20일입니다.');
        if(state.data.returnDate!=='2026-08-22') return wrong('오는 날은 8월 22일입니다.');
        if(state.data.passengers!==1) return wrong('이번 연습은 성인 1명입니다.');
        next();
      };
    } else if (s === 2) {
      instruction("가는 편에서 오전 9시 10분 HA205편을 선택하세요.");
      const flights=[['HA101','07:30','08:40','89,000'],['HA205','09:10','10:20','102,000'],['HA311','11:25','12:35','96,000']];
      sim(airlineShell(`<div class="air-search-summary"><b>인천(ICN) → 제주(CJU)</b><span>8월 20일 · 성인 1명</span></div><div class="flight-list">${flightCards(flights)}</div>`, '가는 편 선택'));
      $$('.flight-card').forEach(b=>b.onclick=()=>b.dataset.flight==='HA205'?next({outbound:'HA205',outTime:'09:10'}):wrong('오전 9시 10분 HA205편을 선택하세요.'));
    } else if (s === 3) {
      instruction("가는 편의 수하물 조건을 확인하고 [일반 운임]을 선택하세요.");
      sim(airlineShell(`<div class="selected-flight-mini"><b>HA205 · 09:10</b><span>인천 → 제주</span></div>${fareCards('out')}`, '가는 편 운임'));
      $('#standardFare').onclick=()=>next({outFare:'일반 운임',outFarePrice:102000});
      $$('.fare-card:not(#standardFare)').forEach(b=>b.onclick=()=>wrong('이번 연습은 위탁수하물 15kg이 포함된 일반 운임을 선택합니다.'));
    } else if (s === 4) {
      instruction("오는 편에서 오후 4시 30분 HA518편을 선택하세요.");
      const flights=[['HA402','13:20','14:30','91,000'],['HA518','16:30','17:40','108,000'],['HA626','19:15','20:25','85,000']];
      sim(airlineShell(`<div class="air-search-summary"><b>제주(CJU) → 인천(ICN)</b><span>8월 22일 · 성인 1명</span></div><div class="flight-list">${flightCards(flights)}</div>`, '오는 편 선택'));
      $$('.flight-card').forEach(b=>b.onclick=()=>b.dataset.flight==='HA518'?next({inbound:'HA518',inTime:'16:30'}):wrong('오후 4시 30분 HA518편을 선택하세요.'));
    } else if (s === 5) {
      instruction("오는 편의 수하물 조건을 확인하고 [일반 운임]을 선택하세요.");
      sim(airlineShell(`<div class="selected-flight-mini"><b>HA518 · 16:30</b><span>제주 → 인천</span></div>${fareCards('in')}`, '오는 편 운임'));
      $('#standardFare').onclick=()=>next({inFare:'일반 운임',inFarePrice:108000});
      $$('.fare-card:not(#standardFare)').forEach(b=>b.onclick=()=>wrong('이번 연습은 위탁수하물 15kg이 포함된 일반 운임을 선택합니다.'));
    } else if (s === 6) {
      instruction("탑승객 영문 이름과 생년월일을 확인하고 [다음]을 누르세요.");
      sim(airlineShell(`<div class="air-form"><label>성<span>*</span><input id="lastName" value="HONG" autocomplete="off"></label><label>이름<span>*</span><input id="firstName" value="GILDONG" autocomplete="off"></label><label>생년월일<span>*</span><input id="birth" value="1960-03-15" inputmode="numeric"></label><label>휴대전화<input id="mobile" value="010-1234-5678" inputmode="tel"></label><label class="check-line"><input type="checkbox" id="nameAgree"> 신분증과 같은 영문 이름인지 확인했습니다.</label><button class="air-primary" id="passengerNext">다음</button></div>`, '탑승객 정보'));
      $('#passengerNext').onclick=()=>{if(!$('#lastName').value.trim()||!$('#firstName').value.trim())return wrong('탑승객 이름을 입력하세요.');if(!$('#birth').value.trim())return wrong('생년월일을 입력하세요.');if(!$('#nameAgree').checked)return wrong('신분증과 같은 이름인지 확인한 뒤 체크하세요.');next({passengerName:`${$('#lastName').value.trim()} ${$('#firstName').value.trim()}`});};
    } else if (s === 7) {
      instruction("무료 위탁수하물 15kg을 확인하고 추가 서비스 없이 [좌석 선택]을 누르세요.");
      sim(airlineShell(`<div class="addon-list"><section><div><b>위탁수하물</b><span>가는 편 15kg · 오는 편 15kg 포함</span></div><strong>포함</strong></section><section><div><b>기내식</b><span>짧은 국내선이라 추가하지 않음</span></div><button class="addon-skip" type="button">추가 안 함</button></section><section><div><b>여행자 보험</b><span>선택 사항</span></div><button class="addon-skip" type="button">가입 안 함</button></section></div><button class="air-primary" id="goSeats">좌석 선택</button>`, '수하물·추가 서비스'));
      $('#goSeats').onclick=()=>next();
    } else if (s === 8) {
      instruction("가는 편 12C 통로 좌석을 선택한 뒤 [오는 편 좌석]을 누르세요.");
      const makeSeats=(selected)=>Array.from({length:8},(_,i)=>{const row=i+9;return `<div class="air-seat-row"><span>${row}</span>${['A','B','C'].map(c=>`<button class="air-seat ${['10A','11B','13C'].includes(`${row}${c}`)?'occupied':''} ${selected===`${row}${c}`?'selected':''}" data-seat="${row}${c}">${c}</button>`).join('')}<i>통로</i>${['D','E','F'].map(c=>`<button class="air-seat ${['9F','12E','14D'].includes(`${row}${c}`)?'occupied':''} ${selected===`${row}${c}`?'selected':''}" data-seat="${row}${c}">${c}</button>`).join('')}</div>`}).join('');
      sim(airlineShell(`<div class="seat-flight-info"><b>가는 편 · HA205</b><span>인천 09:10 → 제주 10:20</span></div><div class="air-seat-legend"><span><i class="free"></i>선택 가능</span><span><i class="occupied"></i>선택 불가</span><span><i class="chosen"></i>선택 좌석</span></div><div class="air-seat-map">${makeSeats(state.data.outSeat)}</div><div class="air-seat-bottom"><span>선택 좌석 <b id="selectedAirSeat">${escapeHtml(state.data.outSeat||'없음')}</b></span><button id="outSeatNext">오는 편 좌석</button></div>`, '가는 편 좌석'));
      $$('.air-seat:not(.occupied)').forEach(b=>b.onclick=()=>{$$('.air-seat').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.data.outSeat=b.dataset.seat;$('#selectedAirSeat').textContent=b.dataset.seat;});
      $('#outSeatNext').onclick=()=>state.data.outSeat==='12C'?next():wrong('12C 통로 좌석을 선택하세요.');
    } else if (s === 9) {
      instruction("오는 편 14D 통로 좌석을 선택한 뒤 [선택 완료]를 누르세요.");
      const makeSeats=()=>Array.from({length:8},(_,i)=>{const row=i+9;return `<div class="air-seat-row"><span>${row}</span>${['A','B','C'].map(c=>`<button class="air-seat ${['10A','11B','13C'].includes(`${row}${c}`)?'occupied':''}" data-seat="${row}${c}">${c}</button>`).join('')}<i>통로</i>${['D','E','F'].map(c=>`<button class="air-seat ${['9F','12E'].includes(`${row}${c}`)?'occupied':''}" data-seat="${row}${c}">${c}</button>`).join('')}</div>`}).join('');
      sim(airlineShell(`<div class="seat-flight-info"><b>오는 편 · HA518</b><span>제주 16:30 → 인천 17:40</span></div><div class="air-seat-legend"><span><i class="free"></i>선택 가능</span><span><i class="occupied"></i>선택 불가</span><span><i class="chosen"></i>선택 좌석</span></div><div class="air-seat-map">${makeSeats()}</div><div class="air-seat-bottom"><span>선택 좌석 <b id="selectedAirSeat">없음</b></span><button id="inSeatNext">선택 완료</button></div>`, '오는 편 좌석'));
      $$('.air-seat:not(.occupied)').forEach(b=>b.onclick=()=>{$$('.air-seat').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.data.inSeat=b.dataset.seat;$('#selectedAirSeat').textContent=b.dataset.seat;});
      $('#inSeatNext').onclick=()=>state.data.inSeat==='14D'?next():wrong('14D 통로 좌석을 선택하세요.');
    } else {
      instruction("여정·탑승객·좌석·결제금액을 확인하고 결제수단을 선택한 뒤 [예약하기]를 누르세요.");
      sim(airlineShell(`<div class="air-summary"><section><h3>가는 편</h3><b>HA205 · 8월 20일</b><span>인천 09:10 → 제주 10:20</span><small>일반 운임 · 좌석 ${escapeHtml(state.data.outSeat||'12C')}</small></section><section><h3>오는 편</h3><b>HA518 · 8월 22일</b><span>제주 16:30 → 인천 17:40</span><small>일반 운임 · 좌석 ${escapeHtml(state.data.inSeat||'14D')}</small></section><section><h3>탑승객</h3><span>${escapeHtml(state.data.passengerName||'HONG GILDONG')} · 성인 1명</span><small>위탁수하물 각 15kg 포함</small></section><section class="price-summary"><div><span>가는 편</span><b>102,000원</b></div><div><span>오는 편</span><b>108,000원</b></div><div><span>좌석 지정</span><b>20,000원</b></div><div class="total"><span>총 결제금액</span><strong>230,000원</strong></div></section><div class="payment-choice"><button id="cardPay" class="active">신용·체크카드</button><button id="easyPay">간편결제</button></div><label class="check-line"><input type="checkbox" id="airFinalAgree"> 여정과 탑승객 정보를 확인했습니다.</label><button class="air-primary" id="airPay">예약하기</button></div>`, '결제·예약 확인'));
      let payment='card';
      $('#cardPay').onclick=()=>{payment='card';$('#cardPay').classList.add('active');$('#easyPay').classList.remove('active');};
      $('#easyPay').onclick=()=>{payment='easy';$('#easyPay').classList.add('active');$('#cardPay').classList.remove('active');};
      $('#airPay').onclick=()=>$('#airFinalAgree').checked?next({payment}):wrong('여정과 탑승객 정보를 확인한 뒤 체크하세요.');
    }
  },
  delivery() {
    renderDeliveryFlow();
  },
  shopping() {
    renderCommerce("쿠팡", "생수 2L 6개", "기본 배송지", "상품 주문");
  },
  taxi() {
    renderCommerce("카카오 T", "서울역", "현재 위치", "택시 호출");
  },
  food() {
    renderFood();
  },
  atm() {
    renderATM();
  },
  sms() {
    renderSMS();
  },
};
function renderTicketKiosk(label, from, to, fare) {
  const s = state.step;
  if (s === 0) {
    instruction("발매기 화면에서 “1회용 교통카드”를 누르세요.");
    sim(kioskWrap(`<div class="kiosk-mini-head"><b>${label}</b><small>언어선택 · 도움호출</small></div><h2>원하시는 서비스를 선택해 주세요</h2><div class="kiosk-menu"><button id="once">1회용<br>교통카드</button><button>교통카드<br>충전</button><button>우대용<br>교통카드</button><button>정기권</button></div><div class="kiosk-bottom-nav"><button>처음으로</button><button>직원호출</button><button>English</button></div>`));
    $("#once").onclick = () => next();
  } else if (s === 1) {
    instruction(`목적지 “${to}”를 선택하세요.`);
    sim(
      kioskWrap(
        `<h2>도착역을 선택해 주세요</h2><p>출발역: ${from}</p><div class="choice-grid">${[to, "시청", "강남", "홍대입구"].map((x) => `<button class="choice-card" data-dest="${x}">${x}</button>`).join("")}</div>`,
      ),
    );
    $$("[data-dest]").forEach(
      (b) =>
        (b.onclick = () =>
          b.dataset.dest === to
            ? next({ dest: to })
            : wrong(`이번 목표 목적지는 ${to}입니다.`)),
    );
  } else if (s === 2) {
    instruction("성인 1명을 선택하고 운임을 확인하세요.");
    sim(
      kioskWrap(
        `<h2>이용 인원을 선택해 주세요</h2><div class="choice-grid"><button class="choice-card selected" id="adult">성인 1명</button><button class="choice-card">어린이 0명</button></div><table class="data-table" style="margin-top:20px"><tr><th>운임</th><td>${fare.toLocaleString()}원</td></tr><tr><th>카드 보증금</th><td>500원</td></tr><tr><th>합계</th><td><b>${(fare + 500).toLocaleString()}원</b></td></tr></table><button class="big-primary" id="fareNext">확인</button>`,
      ),
    );
    $("#fareNext").onclick = () => next();
  } else if (s === 3) {
    instruction("현금 또는 카드 결제 방법을 선택하세요.");
    sim(
      kioskWrap(
        `<h2>결제 방법을 선택해 주세요</h2><div class="choice-grid"><button class="choice-card" data-pay="cash">💵 현금</button><button class="choice-card" data-pay="card">💳 신용카드</button></div>`,
      ),
    );
    $$("[data-pay]").forEach(
      (b) => (b.onclick = () => next({ pay: b.dataset.pay })),
    );
  } else if (s === 4) {
    instruction(
      state.data.pay === "cash"
        ? "지폐 투입구에 금액을 넣는 연습을 하세요."
        : "신용카드를 카드 투입구에 넣는 연습을 하세요.",
    );
    sim(kioskWrap(`<h2>${state.data.pay === "cash" ? "현금을 넣어 주세요" : "카드를 넣어 주세요"}</h2><div class="fare-screen"><p>투입하실 금액</p><strong>${(fare+500).toLocaleString()}원</strong><div class="progress-wait">기기 아래쪽의 ${state.data.pay === "cash" ? "지폐 투입구" : "카드 투입구"}를 사용해 주세요.</div></div>`, state.data.pay === "cash" ? "cash" : "card"));
    $(`[data-slot="${state.data.pay === "cash" ? "cash" : "card"}"]`).onclick = () => next();
  } else {
    instruction("카드 발급구에서 1회용 교통카드를 가져가세요.");
    sim(kioskWrap(`<h2>발급이 완료되었습니다</h2><div class="result-check">✓</div><p style="text-align:center;font-size:1.05rem">${from} → ${to}<br>화면 아래 발급구에서 카드와 거스름돈을 모두 꺼내세요.</p>`, "output"));
    $('[data-slot="output"]').onclick = () => next();
  }
}
function kioskWrap(content, activeSlot = "") {
  return `<div class="kiosk-stage drawn-kiosk-stage">
    <div class="drawn-kiosk" role="application" aria-label="무인 발매기 연습 화면">
      <div class="kiosk-brand-row"><span class="kiosk-brand-mark">동행</span><strong>무인 발매기</strong><span class="kiosk-help">도움 호출</span></div>
      <div class="kiosk-display"><div class="kiosk-display-inner">${content}</div></div>
      <div class="kiosk-hardware-panel">
        <button class="hardware-unit receipt-unit ${activeSlot==='output'?'active-slot':''}" data-slot="output"><span class="slot-line"></span><b>카드·영수증 나오는 곳</b></button>
        <button class="hardware-unit card-unit ${activeSlot==='card'?'active-slot':''}" data-slot="card"><span class="card-mouth"></span><b>신용카드 넣는 곳</b></button>
        <button class="hardware-unit cash-unit ${activeSlot==='cash'?'active-slot':''}" data-slot="cash"><span class="cash-mouth"></span><b>지폐 넣는 곳</b></button>
      </div>
      <div class="kiosk-base"><span></span></div>
    </div>
  </div>`;
}
function hardware() { return ``; }
function phonePractice(content, extraClass = "") {
  return `<div class="practice-phone ${extraClass}"><div class="practice-phone-camera"></div><div class="practice-phone-screen">${content}</div><div class="practice-phone-homebar"></div></div>`;
}

function renderChat(video) {
  const s = state.step;

  // 앱을 연 뒤에는 이미 화면에 보이는 하단 탭을 다시 설명하지 않습니다.
  // 바로 대화 목록에서 '딸'을 찾는 실제 행동부터 시작합니다.
  if (s === 1) {
    instruction("대화 목록에서 [딸]을 누르세요.");
    const list = `<div class="kakao-app chat-list-screen">
      <div class="kakao-top"><strong>채팅</strong><div><button aria-label="검색">⌕</button><button aria-label="새 채팅">＋</button><button aria-label="설정">⚙</button></div></div>
      <div class="chat-filter"><button class="active">전체</button><button>안 읽은 채팅</button><button>즐겨찾기</button></div>
      <div class="kakao-chat-list">${messengerRow({id:"daughter",avatar:"👩",name:"딸",preview:"엄마, 잘 도착했어요?",time:"오후 5:03",unread:4})}${messengerRow({avatar:"👨",name:"아들",preview:"이번 주말에 찾아뵐게요.",time:"오후 3:31",unread:2})}${messengerRow({avatar:"👥",name:"가족 모임",preview:"사진을 보냈습니다.",time:"오후 1:58"})}${messengerRow({avatar:"🌿",name:"정은",preview:"지금 지도 쓰는 중이야",time:"오전 11:44"})}${messengerRow({avatar:"🏌",name:"동네 골프 모임",preview:"내일 8시에 만나요",time:"어제"})}</div>
      <div class="kakao-bottom"><button><i>👤</i><span>친구</span></button><button class="active"><i>💬</i><span>채팅</span></button><button><i>◉</i><span>오픈채팅</span></button><button><i>▣</i><span>쇼핑</span></button><button><i>•••</i><span>더보기</span></button></div>
    </div>`;
    sim(phonePractice(list));
    $("#daughter").onclick = () => next();
    return;
  }

  if (video) {
    if (s === 2) {
      instruction("오른쪽 위 [영상통화]를 누르세요.");
      sim(phonePractice(conversationShell(`<div class="message-date">오늘</div><div class="message-row incoming"><div class="profile-mini">👩</div><div><div class="sender-name">딸</div><div class="bubble">엄마, 잘 도착했어요?</div></div></div>`, true)));
      $("#videoBtn").onclick = () => next();
    } else if (s === 3) {
      instruction("[영상통화]를 누르세요.");
      sim(phonePractice(`<div class="call-choice"><div class="call-choice-head"><button>×</button><strong>딸</strong></div><div class="call-profile">👩</div><h2>통화 방법을 선택하세요</h2><button class="voice-choice">☎ 음성통화</button><button class="video-choice" id="connectCall">▣ 영상통화</button></div>`));
      $("#connectCall").onclick = () => next();
    } else if (s === 4) {
      instruction("[카메라 전환]을 한 번 누르세요.");
      sim(phonePractice(videoUI(),"video-phone"));
      $("#switchCam").onclick = () => next();
    } else if (s === 5) {
      instruction("빨간색 [통화 종료]를 누르세요.");
      sim(phonePractice(videoUI(),"video-phone"));
      $("#endCall").onclick = () => next();
    }
    return;
  }

  if (s === 2) {
    instruction("메시지 입력칸에 ‘잘 도착했다’를 쓰고 [전송]을 누르세요.");
    sim(phonePractice(chatUI()));
    $("#sendChat").onclick = () => {
      const t = $("#chatText").value.trim();
      t ? next({message:t}) : wrong("메시지를 먼저 입력하세요.");
    };
  } else if (s === 3) {
    instruction("왼쪽 아래 [+]를 누른 뒤 [사진]을 누르세요.");
    sim(phonePractice(chatUI(true)));
    $("#addPhoto").onclick = () => next();
  } else if (s === 4) {
    instruction("사진 한 장을 선택하고 [전송]을 누르세요.");
    const picker=`<div class="kakao-app photo-picker"><div class="photo-picker-head"><button>취소</button><strong>앨범</strong><button id="sendPhoto">전송</button></div><div class="photo-picker-folders"><button class="active">최근 항목</button><button>앨범</button></div><div class="photo-grid-realistic">${['🌳','🍲','🌸','🌤️','👨‍👩‍👧','🚌','🏞️','☕','🐕'].map((x,i)=>`<button class="photo-cell ${i===0?'selected':''}">${i===0?'<span>1</span>':''}<div class="photo-art">${x}</div></button>`).join('')}</div><div class="photo-picker-count">1개 선택됨</div></div>`;
    sim(phonePractice(picker));
    $("#sendPhoto").onclick=()=>next();
  } else if (s === 5) {
    instruction("보낸 메시지와 사진을 확인하세요.");
    const body=`<div class="message-date">오늘</div><div class="message-row incoming"><div class="profile-mini">👩</div><div><div class="sender-name">딸</div><div class="bubble">엄마, 잘 도착했어요?</div></div></div><div class="message-row outgoing"><div class="message-meta">오후 5:06</div><div class="bubble me">${escapeHtml(state.data.message||'잘 도착했다')}</div></div><div class="message-row outgoing"><div class="message-meta">오후 5:07</div><div class="photo-message">🌳</div></div>`;
    sim(phonePractice(conversationShell(body,false,`<button class="chat-finish-button" id="chatDone">확인</button>`)));
    $("#chatDone").onclick=()=>next();
  }
}
function messengerRow({id="", avatar, name, preview, time, unread=0}) {
  return `<button type="button" class="messenger-row" ${id ? `id="${id}"` : ""} role="listitem">
    <span class="messenger-avatar" aria-hidden="true">${avatar}</span>
    <span class="messenger-main"><strong>${name}</strong><span>${preview}</span></span>
    <span class="messenger-side"><time>${time}</time>${unread ? `<span class="unread-badge">${unread}</span>` : ""}</span>
  </button>`;
}

function conversationShell(bodyHtml, videoButton=false, footerExtra="") {
  return `<div class="chat-app messenger-realistic conversation-view">
    <div class="chat-head conversation-head">
      <button type="button" class="back-button" aria-label="뒤로 가기">‹</button>
      <div class="conversation-title"><strong>딸</strong><span>1:1 채팅</span></div>
      <div class="conversation-actions"><button type="button" aria-label="검색"><span>⌕</span><small>검색</small></button><button type="button" ${videoButton ? 'id="videoBtn"' : ''} aria-label="영상통화"><span>▣</span><small>영상통화</small></button><button type="button" aria-label="메뉴"><span>☰</span><small>메뉴</small></button></div>
    </div>
    <div class="chat-body realistic-chat-body">${bodyHtml}</div>
    <div class="chat-input realistic-chat-input">
      <button id="addPhoto" class="attach-button" type="button" aria-label="첨부">＋</button>
      <div class="chat-input-box"><input id="chatText" placeholder="메시지를 입력하세요" value=""><button type="button" aria-label="이모티콘">☺</button></div>
      <button id="sendChat" class="send-chat-button" type="button">전송</button>
    </div>
    ${footerExtra}
  </div>`;
}

function chatUI(showAttachmentHint = false) {
  const body = `<div class="message-date">오늘</div><div class="message-row incoming"><div class="profile-mini">👩</div><div><div class="sender-name">딸</div><div class="bubble">엄마, 잘 도착했어요?</div></div></div>`;
  const value = showAttachmentHint ? escapeHtml(state.data.message || "잘 도착했다") : "";
  const attachment = showAttachmentHint
    ? `<div class="attachment-sheet"><button type="button" id="addPhoto"><span>▧</span>사진</button><button type="button"><span>▣</span>카메라</button><button type="button"><span>⌖</span>위치</button></div>`
    : "";
  return simHeader("카카오톡 · 딸") + `<div class="chat-app messenger-realistic conversation-view">
    <div class="chat-head conversation-head">
      <button type="button" class="back-button" aria-label="뒤로 가기">‹</button>
      <div class="conversation-title"><strong>딸</strong><span>1:1 채팅</span></div>
      <div class="conversation-actions"><button type="button" aria-label="검색"><span>⌕</span><small>검색</small></button><button type="button" aria-label="영상통화"><span>▣</span><small>영상통화</small></button><button type="button" aria-label="메뉴"><span>☰</span><small>메뉴</small></button></div>
    </div>
    <div class="chat-body realistic-chat-body">${body}</div>
    ${attachment}
    <div class="chat-input realistic-chat-input">
      <button id="addPhoto" class="attach-button" type="button" aria-label="첨부">＋</button>
      <div class="chat-input-box"><input id="chatText" placeholder="메시지를 입력하세요" value="${value}"><button type="button" aria-label="이모티콘">☺</button></div>
      <button id="sendChat" class="send-chat-button" type="button">전송</button>
    </div>
  </div>`;
}

function videoUI() {
  return (
    simHeader("카카오톡 · 영상통화") +
    `<div class="chat-app messenger-realistic"><div class="video-call realistic-video-call">
      <div class="call-top"><button type="button">⌄</button><span>딸</span><button type="button">⋮</button></div>
      <div class="remote-video"><div class="avatar-large">👩</div><strong>딸과 통화 중</strong><span>00:48</span></div>
      <div class="local-preview">내 화면</div>
      <div class="call-controls realistic-call-controls"><button type="button" aria-label="마이크"><span>🎙</span><small>마이크</small></button><button type="button" id="switchCam" aria-label="카메라 전환"><span>↻</span><small>카메라 전환</small></button><button type="button" aria-label="카메라"><span>▣</span><small>카메라 끄기</small></button><button type="button" id="endCall" class="call-end" aria-label="통화 종료"><span>☎</span><small>통화 종료</small></button></div>
    </div></div>`
  );
}

function deliveryPhone(body, title = "배달앱") {
  return phonePractice(`<div class="delivery-app">
    <div class="delivery-status"><span>9:41</span><span>5G ▰ 92%</span></div>
    <div class="delivery-top"><button type="button" aria-label="뒤로가기">‹</button><strong>${escapeHtml(title)}</strong><button type="button" aria-label="장바구니">🛒</button></div>
    ${body}
  </div>`, "delivery-phone");
}
function renderDeliveryFlow() {
  const s = state.step;
  state.data.delivery ||= {category:"", store:"", main:"", side:"", drink:"", qty:1, deliveryType:"", payment:"", coupon:false};
  const d = state.data.delivery;
  if (s === 1) {
    instruction("먹고 싶은 음식에서 [치킨]을 누르세요.");
    sim(deliveryPhone(`<div class="delivery-home">
      <button class="delivery-address"><span>배달 받을 곳</span><b>고양시 일산동구 중앙로 123</b><i>⌄</i></button>
      <div class="delivery-search"><span>⌕</span><input id="deliverySearch" placeholder="음식이나 가게를 검색하세요"><button id="deliverySearchBtn">검색</button></div>
      <div class="delivery-banner"><b>오늘은 무엇을 드실까요?</b><span>주문 전 배달비와 예상시간을 확인하세요</span></div>
      <div class="food-categories">${[['🍗','치킨'],['🍜','한식'],['🍕','피자'],['🍔','버거'],['🍱','분식'],['☕','카페'],['🥗','샐러드'],['🍣','일식']].map(([i,n])=>`<button data-food-cat="${n}"><span>${i}</span><b>${n}</b></button>`).join('')}</div>
      <section class="delivery-section"><h3>우리 동네 인기 가게</h3><div class="mini-store-row"><span>🍗</span><div><b>행복치킨</b><small>★ 4.8 · 25~35분</small></div></div></section>
      <nav class="delivery-nav"><button class="active">홈</button><button>검색</button><button>찜</button><button>주문내역</button><button>마이</button></nav>
    </div>`));
    $$('[data-food-cat]').forEach(b=>b.onclick=()=>b.dataset.foodCat==='치킨'?next({delivery:{...d,category:'치킨'}}):wrong('이번 연습에서는 치킨을 선택하세요.'));
    $('#deliverySearchBtn').onclick=()=>{ if($('#deliverySearch').value.includes('치킨')) next({delivery:{...d,category:'치킨'}}); else wrong('검색창에 치킨을 입력해 보세요.'); };
  } else if (s === 2) {
    instruction("평점·배달시간·배달비를 보고 [행복치킨]을 누르세요.");
    const stores=[
      ['행복치킨','4.8','2,314','25~35분','1,500원','18,000원','🍗'],
      ['바삭한집','4.6','987','35~45분','무료','20,000원','🍖'],
      ['우리동네통닭','4.3','412','45~55분','2,500원','15,000원','🥘']
    ];
    sim(deliveryPhone(`<div class="delivery-list-page"><div class="delivery-filter-row"><button class="active">추천순</button><button>배달 빠른순</button><button>배달비 낮은순</button></div>${stores.map(([name,r,rv,t,fee,min,icon])=>`<button class="store-card" data-store="${name}"><span class="store-photo">${icon}</span><div class="store-copy"><h3>${name}</h3><p><b>★ ${r}</b> (${rv})</p><p>${t} · 배달비 ${fee}</p><small>최소주문 ${min}</small></div><i>›</i></button>`).join('')}</div>`, '치킨 가게'));
    $$('[data-store]').forEach(b=>b.onclick=()=>b.dataset.store==='행복치킨'?next({delivery:{...d,store:'행복치킨'}}):wrong('평점 4.8, 배달 25~35분인 행복치킨을 선택하세요.'));
  } else if (s === 3) {
    instruction("대표 메뉴에서 [후라이드 치킨]을 누르세요.");
    sim(deliveryPhone(`<div class="store-detail"><div class="store-hero">🍗</div><div class="store-title"><h2>행복치킨</h2><p>★ 4.8 · 리뷰 2,314개</p><div><span>배달 25~35분</span><span>배달비 1,500원</span></div></div><div class="menu-tabs"><button class="active">대표메뉴</button><button>세트</button><button>사이드</button><button>음료</button></div><div class="menu-list">${[['후라이드 치킨','바삭한 기본 치킨','19,000원','🍗'],['양념 치킨','매콤달콤 양념','20,000원','🌶️'],['간장 치킨','달콤짭짤 간장','20,000원','🥢']].map(([n,desc,p,i])=>`<button class="menu-card" data-menu="${n}"><div><h3>${n}</h3><p>${desc}</p><b>${p}</b></div><span>${i}</span></button>`).join('')}</div></div>`, '행복치킨'));
    $$('[data-menu]').forEach(b=>b.onclick=()=>b.dataset.menu==='후라이드 치킨'?next({delivery:{...d,main:'후라이드 치킨'}}):wrong('이번 연습에서는 후라이드 치킨을 선택하세요.'));
  } else if (s === 4) {
    instruction("순살·감자튀김·콜라를 선택하고 [장바구니 담기]를 누르세요.");
    sim(deliveryPhone(`<div class="menu-option-page"><div class="option-product"><span>🍗</span><div><h2>후라이드 치킨</h2><b>19,000원</b></div></div><section><h3>필수 옵션 <em>1개 선택</em></h3><label><input type="radio" name="bone" value="뼈"> 뼈 <b>추가금 없음</b></label><label><input type="radio" name="bone" value="순살"> 순살 <b>+2,000원</b></label></section><section><h3>사이드 추가</h3><label><input type="checkbox" id="sideFries"> 감자튀김 <b>+4,000원</b></label><label><input type="checkbox"> 치즈볼 <b>+5,000원</b></label></section><section><h3>음료 추가</h3><label><input type="radio" name="drink" value="콜라 1.25L"> 콜라 1.25L <b>+3,000원</b></label><label><input type="radio" name="drink" value="사이다 1.25L"> 사이다 1.25L <b>+3,000원</b></label></section><div class="quantity-row"><span>수량</span><div><button id="qtyMinus">−</button><b id="qtyValue">${d.qty||1}</b><button id="qtyPlus">＋</button></div></div><button class="delivery-main-button" id="addCart">장바구니 담기 · <span id="optionPrice">28,000원</span></button></div>`, '메뉴 옵션'));
    $('#qtyMinus').onclick=()=>{d.qty=Math.max(1,(d.qty||1)-1);$('#qtyValue').textContent=d.qty};
    $('#qtyPlus').onclick=()=>{d.qty=Math.min(5,(d.qty||1)+1);$('#qtyValue').textContent=d.qty};
    $('#addCart').onclick=()=>{const bone=document.querySelector('input[name="bone"]:checked')?.value;const drink=document.querySelector('input[name="drink"]:checked')?.value;if(bone!=='순살')return wrong('이번 연습에서는 순살을 선택하세요.');if(!$('#sideFries').checked)return wrong('감자튀김을 추가하세요.');if(drink!=='콜라 1.25L')return wrong('콜라 1.25L를 선택하세요.');next({delivery:{...d,side:'감자튀김',drink,option:'순살'}})};
  } else if (s === 5) {
    instruction("장바구니 내용을 확인하고 [주문하기]를 누르세요.");
    sim(deliveryPhone(`<div class="cart-page"><h2>장바구니</h2><div class="cart-store">행복치킨 <button>더 담기</button></div><div class="cart-item"><span>🍗</span><div><h3>후라이드 치킨</h3><p>순살 · 감자튀김 · 콜라 1.25L</p><b>28,000원</b></div><div class="cart-qty"><button>−</button><b>1</b><button>＋</button></div></div><div class="cart-price"><div><span>메뉴 금액</span><b>28,000원</b></div><div><span>배달비</span><b>1,500원</b></div><div class="total"><span>예상 결제금액</span><strong>29,500원</strong></div></div><button class="delivery-main-button" id="cartOrder">주문하기</button></div>`, '장바구니'));
    $('#cartOrder').onclick=()=>next();
  } else if (s === 6) {
    instruction("배달 방식에서 [알뜰배달]을 선택하세요.");
    sim(deliveryPhone(`<div class="order-page"><h2>주문하기</h2><section class="order-section"><h3>배달 방식</h3><button class="delivery-type" data-type="알뜰배달"><div><b>알뜰배달</b><p>여러 주문을 함께 배달해요</p></div><span>35~45분<br><strong>1,500원</strong></span></button><button class="delivery-type" data-type="한집배달"><div><b>한집배달</b><p>내 주문만 바로 배달해요</p></div><span>25~35분<br><strong>3,900원</strong></span></button><button class="delivery-type" data-type="포장"><div><b>포장</b><p>가게에서 직접 받아요</p></div><span>20분<br><strong>0원</strong></span></button></section></div>`, '주문하기'));
    $$('[data-type]').forEach(b=>b.onclick=()=>b.dataset.type==='알뜰배달'?next({delivery:{...d,deliveryType:'알뜰배달'}}):wrong('이번 연습에서는 알뜰배달을 선택하세요.'));
  } else if (s === 7) {
    instruction("주소와 요청사항을 확인하고 [다음]을 누르세요.");
    sim(deliveryPhone(`<div class="order-page"><h2>배달 정보</h2><section class="order-section"><h3>배달 주소</h3><div class="address-card"><b>고양시 일산동구 중앙로 123</b><span>101동 1001호</span><button>변경</button></div></section><section class="order-section"><h3>가게 요청사항</h3><select id="storeRequest"><option value="">선택하세요</option><option value="단무지 많이">단무지 많이 주세요</option><option>일회용품 안 주셔도 돼요</option></select></section><section class="order-section"><h3>배달기사 요청사항</h3><select id="riderRequest"><option value="">선택하세요</option><option value="문 앞">문 앞에 놓고 벨 눌러주세요</option><option>직접 받을게요</option></select></section><button class="delivery-main-button" id="deliveryInfoNext">다음</button></div>`, '배달 정보'));
    $('#deliveryInfoNext').onclick=()=>{if($('#storeRequest').value!=='단무지 많이')return wrong('가게 요청사항에서 단무지 많이를 선택하세요.');if($('#riderRequest').value!=='문 앞')return wrong('배달기사 요청사항에서 문 앞에 놓기를 선택하세요.');next({delivery:{...d,request:'단무지 많이',rider:'문 앞'}})};
  } else if (s === 8) {
    instruction("쿠폰을 적용하고 [신용·체크카드]를 선택하세요.");
    sim(deliveryPhone(`<div class="order-page"><h2>할인·결제</h2><section class="order-section coupon-section"><h3>쿠폰</h3><button id="applyCoupon"><span>첫 주문 할인쿠폰</span><b>2,000원 할인</b><i>적용</i></button></section><section class="order-section"><h3>결제수단</h3><button class="payment-option" data-payment="신용·체크카드"><span>💳</span><div><b>신용·체크카드</b><p>카드사 선택 후 결제</p></div></button><button class="payment-option" data-payment="간편결제"><span>Ⓟ</span><div><b>간편결제</b><p>등록된 결제수단</p></div></button><button class="payment-option" data-payment="현장결제"><span>💵</span><div><b>현장결제</b><p>가게에서 지원할 때만 가능</p></div></button></section><button class="delivery-main-button" id="paymentNext">결제 내용 확인</button></div>`, '할인·결제'));
    let payment=''; $('#applyCoupon').onclick=()=>{d.coupon=true;$('#applyCoupon').classList.add('applied');$('#applyCoupon i').textContent='적용됨'}; $$('.payment-option').forEach(b=>b.onclick=()=>{$$('.payment-option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');payment=b.dataset.payment}); $('#paymentNext').onclick=()=>{if(!d.coupon)return wrong('2,000원 할인쿠폰을 적용하세요.');if(payment!=='신용·체크카드')return wrong('신용·체크카드를 선택하세요.');next({delivery:{...d,payment}})};
  } else if (s === 9) {
    instruction("주문 내용과 최종 금액을 확인하고 [29,000원 결제하기]를 누르세요.");
    sim(deliveryPhone(`<div class="order-page final-order"><h2>최종 확인</h2><section class="order-section summary-store"><b>행복치킨</b><p>후라이드 치킨 · 순살</p><p>감자튀김 · 콜라 1.25L</p></section><section class="order-section"><div class="summary-line"><span>배달 방식</span><b>알뜰배달</b></div><div class="summary-line"><span>배달 주소</span><b>중앙로 123, 101동 1001호</b></div><div class="summary-line"><span>결제수단</span><b>신용·체크카드</b></div></section><section class="order-section price-detail"><div><span>메뉴 금액</span><b>28,000원</b></div><div><span>배달비</span><b>1,500원</b></div><div><span>쿠폰 할인</span><b>-2,000원</b></div><div class="total"><span>총 결제금액</span><strong>27,500원</strong></div></section><label class="order-agree"><input type="checkbox" id="orderAgree"> 주문 내용과 주소를 확인했습니다.</label><button class="delivery-main-button" id="deliveryPay">27,500원 결제하기</button></div>`, '최종 확인'));
    $('#deliveryPay').onclick=()=>$('#orderAgree').checked?next():wrong('주문 내용과 주소를 확인한 뒤 체크하세요.');
  } else {
    instruction("주문이 접수됐는지 확인하세요.");
    sim(deliveryPhone(`<div class="delivery-tracking"><div class="tracking-check">✓</div><h2>주문이 접수됐어요</h2><p>행복치킨에서 음식을 준비하고 있습니다.</p><div class="tracking-map"><span>가게</span><i></i><b>배달 중</b><i></i><span>우리집</span></div><div class="tracking-card"><div><span>예상 도착</span><strong>오후 8:10~8:20</strong></div><div><span>주문번호</span><b>B-260718-1042</b></div></div><button class="delivery-main-button" id="deliveryDone">확인</button></div>`, '주문 현황'));
    $('#deliveryDone').onclick=()=>next();
  }
}

function renderHospitalFlow() {
  const s=state.step;
  state.data.hospital ||= {department:'',reason:'',date:'',time:''};
  const h=state.data.hospital;
  const shell=(body,title='우리병원 예약')=>`<div class="hospital-web"><div class="hospital-browser"><span>←</span><span>→</span><span>↻</span><div>https://woori-hospital.example</div></div><header><div><b>우리병원</b><span>건강한 일상을 함께합니다</span></div><nav><button>진료안내</button><button>진료예약</button><button>오시는 길</button></nav></header><main>${body}</main></div>`;
  if(s===1){
    instruction("진료과에서 [내과]를 선택하세요.");
    sim(shell(`<div class="hospital-steps"><span class="active">1 진료내용</span><span>2 날짜·시간</span><span>3 신청정보</span><span>4 완료</span></div><section class="hospital-card"><h2>어떤 진료가 필요하신가요?</h2><div class="department-grid">${[['내과','복통·감기·만성질환','🩺'],['정형외과','허리·관절·근육 통증','🦴'],['이비인후과','귀·코·목 증상','👂'],['피부과','피부·알레르기','🧴']].map(([n,d,i])=>`<button data-dept="${n}"><span>${i}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div></section>`, '진료내용'));
    $$('[data-dept]').forEach(b=>b.onclick=()=>b.dataset.dept==='내과'?next({hospital:{...h,department:'내과'}}):wrong('이번 연습에서는 내과를 선택하세요.'));
  } else if(s===2){
    instruction("진료 받을 내용에서 [속이 불편하고 소화가 안 됨]을 선택하세요.");
    sim(shell(`<div class="hospital-steps"><span class="active">1 진료내용</span><span>2 날짜·시간</span><span>3 신청정보</span><span>4 완료</span></div><section class="hospital-card"><h2>진료 받을 내용을 선택하세요</h2><p class="hospital-sub">선택한 진료과: <b>내과</b></p><div class="reason-list"><button data-reason="감기 증상">기침·콧물·몸살</button><button data-reason="소화 불편">속이 불편하고 소화가 안 됨</button><button data-reason="혈압 상담">혈압·당뇨 상담</button><button data-reason="기타">기타 증상</button></div></section>`));
    $$('[data-reason]').forEach(b=>b.onclick=()=>b.dataset.reason==='소화 불편'?next({hospital:{...h,reason:'속이 불편하고 소화가 안 됨'}}):wrong('이번 연습에서는 소화 불편 항목을 선택하세요.'));
  } else if(s===3){
    instruction("7월 22일과 오전 10시 30분을 선택하세요.");
    sim(shell(`<div class="hospital-steps"><span>1 진료내용</span><span class="active">2 날짜·시간</span><span>3 신청정보</span><span>4 완료</span></div><section class="hospital-card"><h2>예약 날짜와 시간을 선택하세요</h2><div class="hospital-calendar"><div class="calendar-title"><button>‹</button><b>2026년 7월</b><button>›</button></div><div class="hospital-days">${['일','월','화','수','목','금','토'].map(x=>`<span>${x}</span>`).join('')}${Array.from({length:31},(_,i)=>`<button data-hdate="${i+1}" class="${i+1===18?'today':''}">${i+1}</button>`).join('')}</div></div><div class="time-slots"><h3>예약 가능 시간</h3>${['09:00','09:30','10:00','10:30','11:00','14:00'].map(t=>`<button data-htime="${t}">${t}</button>`).join('')}</div><button class="hospital-primary" id="hospitalDateNext">다음</button></section>`));
    $$('[data-hdate]').forEach(b=>b.onclick=()=>{$$('[data-hdate]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');h.date=`2026-07-${String(b.dataset.hdate).padStart(2,'0')}`});
    $$('[data-htime]').forEach(b=>b.onclick=()=>{$$('[data-htime]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');h.time=b.dataset.htime});
    $('#hospitalDateNext').onclick=()=>{if(h.date!=='2026-07-22')return wrong('7월 22일을 선택하세요.');if(h.time!=='10:30')return wrong('오전 10시 30분을 선택하세요.');next({hospital:{...h}})};
  } else if(s===4){
    instruction("날짜·신청인·신청 내용을 확인하고 [예약 신청]을 누르세요.");
    sim(shell(`<div class="hospital-steps"><span>1 진료내용</span><span>2 날짜·시간</span><span class="active">3 신청정보</span><span>4 완료</span></div><section class="hospital-card"><h2>신청 정보 확인</h2><div class="hospital-summary"><div><span>날짜</span><b>2026년 7월 22일 오전 10:30</b></div><div><span>신청인</span><b>홍길동</b></div><div><span>신청 내용</span><b>내과 · 속이 불편하고 소화가 안 됨</b></div><div><span>담당 의료진</span><b>김하늘 의사</b></div></div><label class="hospital-check"><input type="checkbox" id="hospitalAgree"> 위 신청 정보를 확인했습니다.</label><button class="hospital-primary" id="hospitalApply">예약 신청</button></section>`));
    $('#hospitalApply').onclick=()=>$('#hospitalAgree').checked?next():wrong('날짜, 신청인, 신청 내용을 확인한 뒤 체크하세요.');
  } else if(s===5){
    instruction("예약 완료 내용을 확인하고 [현장 접수 연습]을 누르세요.");
    sim(shell(`<section class="hospital-card hospital-complete"><div class="complete-mark">✓</div><h2>예약이 완료되었습니다</h2><p>7월 22일 오전 10시 30분까지 도착해 주세요.</p><div class="reservation-number"><span>예약번호</span><b>R260722-1030</b></div><button class="hospital-primary" id="goReception">현장 접수 연습</button></section>`));
    $('#goReception').onclick=()=>next();
  } else if(s===6){
    instruction("접수기에서 [예약 환자 접수]를 누르세요.");
    sim(kioskWrap(`<div class="kiosk-mini-head"><b>우리병원 무인접수</b><small>도움이 필요하면 직원을 불러주세요</small></div><h2>원하시는 업무를 선택해 주세요</h2><div class="kiosk-menu"><button id="reservedReception">예약 환자<br>접수</button><button>당일 진료<br>접수</button><button>검사 접수</button><button>진료비 수납</button></div>`));
    $('#reservedReception').onclick=()=>next();
  } else {
    instruction("접수표의 진료과와 대기번호를 확인하세요.");
    sim(kioskWrap(`<div class="kiosk-mini-head"><b>우리병원 무인접수</b></div><div class="result-check">✓</div><h2>접수가 완료되었습니다</h2><div class="reception-ticket"><span>진료과</span><b>내과</b><span>대기번호</span><strong>내과 12번</strong><small>2층 내과 앞에서 기다려 주세요</small></div><button class="big-primary" id="hospitalDone">확인</button>`, 'output'));
    $('#hospitalDone').onclick=()=>next();
  }
}

function renderBrowserFlow(brand, query, result, finalLabel) {
  const s = state.step;
  if (s === 0) {
    instruction("인터넷 주소창을 눌러 검색어를 입력하세요.");
    sim(
      browser(
        `<h2>인터넷 검색</h2><div class="field"><label>검색어</label><input id="searchQ" value="${query}"></div><button class="big-primary" id="browserSearch">검색</button>`,
      ),
    );
    $("#browserSearch").onclick = () => next();
  } else if (s === 1) {
    instruction("광고가 아닌 공식 또는 신뢰할 수 있는 결과를 선택하세요.");
    sim(
      browser(
        `<h2>검색 결과</h2><button class="choice-card" id="official"><b>${brand} 공식</b><br>${query}</button><button class="choice-card">광고 · 빠른 발급 대행</button><button class="choice-card">개인 블로그 안내</button>`,
      ),
    );
    $("#official").onclick = () => next();
  } else if (s === 2) {
    instruction(`“${result}” 항목을 선택하세요.`);
    sim(
      site(
        brand,
        `<h2>${query}</h2><div class="choice-grid"><button class="choice-card" id="wanted">${result}</button><button class="choice-card">다른 서비스</button></div>`,
      ),
    );
    $("#wanted").onclick = () => next();
  } else if (s === 3) {
    instruction("날짜·인원·신청 내용을 확인하고 다음 단계로 이동하세요.");
    sim(
      site(
        brand,
        `<h2>신청 정보</h2><div class="form-grid"><div class="field"><label>신청자</label><input value="홍길동" readonly></div><div class="field"><label>신청 내용</label><input value="${result}" readonly></div></div><button class="big-primary" id="infoNext">다음</button>`,
      ),
    );
    $("#infoNext").onclick = () => next();
  } else if (s === 4) {
    instruction("취소 조건·발급 내용·최종 금액을 확인하세요.");
    sim(
      site(
        brand,
        `<h2>최종 확인</h2><table class="data-table"><tr><th>내용</th><td>${result}</td></tr><tr><th>신청자</th><td>홍길동</td></tr><tr><th>비용</th><td>교육용 0원</td></tr></table><button class="big-primary" id="finalNext">${finalLabel}</button>`,
      ),
    );
    $("#finalNext").onclick = () => next();
  } else {
    instruction("완료 화면을 확인하세요.");
    sim(
      site(
        brand,
        `<div class="result-check">✓</div><h2 style="text-align:center">${finalLabel} 완료</h2><button class="big-primary" id="browserDone">확인</button>`,
      ),
    );
    $("#browserDone").onclick = () => next();
  }
}
function browser(content) {
  return `<div class="sim-body"><div class="browser-shell"><div class="browser-bar"><span>← → ↻</span><input value="검색 또는 주소 입력"></div><div class="site-page"><div class="site-content">${content}</div></div></div></div>`;
}
function site(brand, content) {
  return `<div class="sim-body"><div class="browser-shell"><div class="browser-bar"><span>← → ↻</span><input value="https://official.example"></div><div class="site-page"><div class="site-header">${brand}</div><div class="site-content">${content}</div></div></div></div>`;
}
function renderCommerce(brand, item, address, action) {
  const s = state.step;
  if (s === 0) {
    instruction(`${brand} 앱의 검색창을 누르세요.`);
    sim(
      simHeader(brand) +
        `<div class="bank-app"><div class="app-header">${brand}</div><div class="sim-body"><input style="width:100%;padding:15px" value="${item}" id="productSearch"><button class="big-primary" id="doSearch">검색</button></div></div>`,
    );
    $("#doSearch").onclick = () => next();
  } else if (s === 1) {
    instruction(`검색 결과에서 “${item}”을 선택하세요.`);
    sim(
      simHeader(brand) +
        `<div class="sim-body product-grid"><button class="product" id="targetProduct"><div class="product-image">📦</div><h3>${item}</h3><p>12,900원</p></button><button class="product"><div class="product-image">🧴</div><h3>다른 상품</h3></button></div>`,
    );
    $("#targetProduct").onclick = () => next();
  } else if (s === 2) {
    instruction("수량과 옵션을 확인하세요.");
    sim(
      simHeader(brand) +
        `<div class="sim-body"><table class="data-table"><tr><th>상품</th><td>${item}</td></tr><tr><th>수량</th><td>1</td></tr><tr><th>가격</th><td>12,900원</td></tr></table><button class="big-primary" id="optionNext">장바구니 담기</button></div>`,
    );
    $("#optionNext").onclick = () => next();
  } else if (s === 3) {
    instruction(`배송지 또는 출발 위치가 “${address}”인지 확인하세요.`);
    sim(
      simHeader(brand) +
        `<div class="sim-body"><div class="field"><label>주소·위치</label><input value="${address}" readonly></div><button class="big-primary" id="addressNext">주소가 맞습니다</button></div>`,
    );
    $("#addressNext").onclick = () => next();
  } else if (s === 4) {
    instruction("최종 금액과 결제방법을 확인하세요.");
    sim(
      simHeader(brand) +
        `<div class="sim-body"><table class="data-table"><tr><th>내용</th><td>${item}</td></tr><tr><th>금액</th><td>12,900원</td></tr><tr><th>결제</th><td>교육용 모의 결제</td></tr></table><button class="big-primary" id="commercePay">${action}</button></div>`,
    );
    $("#commercePay").onclick = () => next();
  } else {
    instruction("주문 또는 호출 결과를 확인하세요.");
    sim(
      simHeader(brand) +
        `<div class="sim-body"><div class="result-check">✓</div><h2 style="text-align:center">${action} 완료</h2><button class="big-primary" id="commerceDone">확인</button></div>`,
    );
    $("#commerceDone").onclick = () => next();
  }
}
function renderFood() {
  const s=state.step;
  state.data.food ||= {place:'',main:'',set:'',drink:'',pay:''};
  const f=state.data.food;
  if(s===0){instruction("화면에서 [포장 주문]을 누르세요.");sim(kioskWrap(`<div class="kiosk-mini-head"><b>동행버거</b><small>주문을 시작해 주세요</small></div><h2>어디에서 드시나요?</h2><div class="kiosk-menu"><button data-place="매장">매장에서<br>먹기</button><button id="takeout" data-place="포장">포장해서<br>가져가기</button></div>`));$$('[data-place]').forEach(b=>b.onclick=()=>b.dataset.place==='포장'?next({food:{...f,place:'포장'}}):wrong('이번 연습에서는 포장 주문을 선택하세요.'))}
  else if(s===1){instruction("메뉴에서 [불고기버거]를 누르세요.");sim(kioskWrap(`<div class="kiosk-mini-head"><b>동행버거</b><small>포장 주문</small></div><div class="kiosk-category-tabs"><button class="active">버거</button><button>세트</button><button>사이드</button><button>음료</button></div><div class="kiosk-food-grid">${[['불고기버거','6,200원','🍔'],['새우버거','6,500원','🍤'],['치킨버거','6,800원','🍗'],['치즈버거','7,000원','🧀']].map(([n,p,i])=>`<button data-food-menu="${n}"><span>${i}</span><b>${n}</b><small>${p}</small></button>`).join('')}</div>`));$$('[data-food-menu]').forEach(b=>b.onclick=()=>b.dataset.foodMenu==='불고기버거'?next({food:{...f,main:'불고기버거'}}):wrong('불고기버거를 선택하세요.'))}
  else if(s===2){instruction("[세트로 변경]과 [감자튀김]을 선택하세요.");sim(kioskWrap(`<h2>메뉴 옵션을 선택해 주세요</h2><div class="kiosk-option-card"><h3>불고기버거</h3><label><input type="radio" name="foodSet" value="단품"> 단품 6,200원</label><label><input type="radio" name="foodSet" value="세트"> 세트로 변경 +2,800원</label></div><div class="kiosk-option-card"><h3>사이드</h3><label><input type="radio" name="foodSide" value="감자튀김"> 감자튀김</label><label><input type="radio" name="foodSide" value="치즈스틱"> 치즈스틱 +1,000원</label></div><button class="big-primary" id="foodOptionNext">다음</button>`));$('#foodOptionNext').onclick=()=>{const set=document.querySelector('input[name="foodSet"]:checked')?.value;const side=document.querySelector('input[name="foodSide"]:checked')?.value;if(set!=='세트'||side!=='감자튀김')return wrong('세트로 변경하고 감자튀김을 선택하세요.');next({food:{...f,set,side}})}}
  else if(s===3){instruction("음료에서 [콜라]를 선택하세요.");sim(kioskWrap(`<h2>세트 음료를 선택해 주세요</h2><div class="kiosk-food-grid drinks"><button data-drink="콜라"><span>🥤</span><b>콜라</b></button><button data-drink="사이다"><span>🫧</span><b>사이다</b></button><button data-drink="커피"><span>☕</span><b>커피</b><small>+500원</small></button></div>`));$$('[data-drink]').forEach(b=>b.onclick=()=>b.dataset.drink==='콜라'?next({food:{...f,drink:'콜라'}}):wrong('이번 연습에서는 콜라를 선택하세요.'))}
  else if(s===4){instruction("주문 내용을 확인하고 [카드 결제]를 누르세요.");sim(kioskWrap(`<h2>주문 내용을 확인해 주세요</h2><div class="kiosk-order-summary"><div><b>불고기버거 세트</b><span>감자튀김 · 콜라</span><strong>9,000원</strong></div><div class="summary-total"><span>총 결제금액</span><strong>9,000원</strong></div></div><div class="kiosk-pay-grid"><button data-food-pay="cash">현금 결제</button><button data-food-pay="card">카드 결제</button></div>`));$$('[data-food-pay]').forEach(b=>b.onclick=()=>b.dataset.foodPay==='card'?next({food:{...f,pay:'card'}}):wrong('이번 연습에서는 카드 결제를 선택하세요.'))}
  else {instruction("카드를 카드 투입구에 넣으세요.");sim(kioskWrap(`<h2>카드를 넣어 주세요</h2><div class="fare-screen"><p>결제금액</p><strong>9,000원</strong><div class="progress-wait">아래쪽 카드 투입구를 사용하세요.</div></div>`,"card"));$('[data-slot="card"]').onclick=()=>next()}
}
function renderATM() {
  const s=state.step;
  if(s===0){instruction("ATM 화면에서 [예금 출금]을 누르세요.");sim(kioskWrap(`<div class="kiosk-mini-head"><b>동행은행 ATM</b><small>카드와 현금을 꼭 챙기세요</small></div><h2>원하시는 업무를 선택해 주세요</h2><div class="kiosk-menu"><button id="atmWithdraw">예금<br>출금</button><button>입금</button><button>계좌이체</button><button>잔액조회</button></div>`));$('#atmWithdraw').onclick=()=>next()}
  else if(s===1){instruction("카드를 카드 투입구에 넣으세요.");sim(kioskWrap(`<h2>카드를 넣어 주세요</h2><p class="kiosk-center-copy">IC칩이 있는 방향을 확인해 주세요.</p>`,"card"));$('[data-slot="card"]').onclick=()=>next()}
  else if(s===2){instruction("비밀번호 4자리를 입력하고 [확인]을 누르세요.");sim(kioskWrap(`<h2>비밀번호를 입력해 주세요</h2><div class="pin-dots" id="pinDots">○ ○ ○ ○</div><div class="kiosk-keypad">${[1,2,3,4,5,6,7,8,9,'취소',0,'확인'].map(x=>`<button data-atm-key="${x}">${x}</button>`).join('')}</div>`));let pin='';$$('[data-atm-key]').forEach(b=>b.onclick=()=>{if(b.dataset.atmKey==='확인'){pin.length===4?next():wrong('비밀번호 4자리를 입력하세요.');return}if(b.dataset.atmKey==='취소'){pin=''}else if(pin.length<4)pin+=b.dataset.atmKey;$('#pinDots').textContent='● '.repeat(pin.length)+'○ '.repeat(4-pin.length)})}
  else if(s===3){instruction("출금 금액에서 [50,000원]을 누르세요.");sim(kioskWrap(`<h2>출금할 금액을 선택해 주세요</h2><div class="kiosk-menu amount-menu">${['10,000원','30,000원','50,000원','100,000원'].map(x=>`<button data-atm-amount="${x}">${x}</button>`).join('')}</div>`));$$('[data-atm-amount]').forEach(b=>b.onclick=()=>b.dataset.atmAmount==='50,000원'?next():wrong('이번 연습에서는 50,000원을 선택하세요.'))}
  else if(s===4){instruction("수수료와 금액을 확인하고 [출금]을 누르세요.");sim(kioskWrap(`<h2>출금 내용을 확인해 주세요</h2><table class="data-table"><tr><th>출금 금액</th><td>50,000원</td></tr><tr><th>수수료</th><td>0원</td></tr><tr><th>출금 후 잔액</th><td>1,195,800원</td></tr></table><button class="big-primary" id="atmConfirm">출금</button>`));$('#atmConfirm').onclick=()=>next()}
  else {instruction("카드를 먼저 받고, 현금을 꺼내세요.");sim(kioskWrap(`<h2>카드와 현금을 가져가세요</h2><div class="atm-recovery"><b>1. 카드 회수</b><span>2. 현금 회수</span><small>두 가지를 모두 챙겼는지 확인하세요.</small></div>`,"output"));$('[data-slot="output"]').onclick=()=>next()}
}
function renderSMS() {
  const s = state.step;
  if (s < 5) {
    instruction(
      `${s + 1}번째 문자를 읽고 수상한지 판단하세요.`,
      "링크, 개인정보 요구, 급한 행동 유도 여부를 확인하세요.",
    );
    const suspicious = s % 2 === 0;
    sim(
      simHeader("문자 메시지") +
        `<div class="chat-app"><div class="chat-head">${suspicious ? "[국제발신] 배송안내" : "우리병원"}</div><div class="chat-body"><div class="bubble">${suspicious ? "주소 오류로 배송이 중단되었습니다. 아래 링크에서 개인정보를 입력하세요. http://short.url" : "내일 오전 10시 30분 진료 예약이 확인되었습니다. 변경은 병원 대표번호로 연락해 주세요."}</div></div><div class="chat-input"><button id="safe">안전</button><button id="sus">수상함</button></div></div>`,
    );
    $("#sus").onclick = () =>
      suspicious
        ? next()
        : wrong("이 문자는 링크나 개인정보 요구가 없는 예약 안내입니다.");
    $("#safe").onclick = () =>
      !suspicious
        ? next()
        : wrong("출처 불명 링크와 개인정보 요구가 있어 수상합니다.");
  } else next();
}
function renderGeneric() {
  instruction("화면의 안내에 따라 다음 단계를 진행하세요.");
  sim(
    simHeader(state.module.title) +
      `<div class="sim-body"><h2>${state.module.steps[state.step]}</h2><button class="big-primary" id="genericNext">다음 단계</button></div>`,
  );
  $("#genericNext").onclick = () => next();
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}
function speak() {
  const view = $(".view.active");
  const text = view.innerText.slice(0, 1200);
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.rate = 0.85;
  speechSynthesis.speak(u);
}
function renderGoals() {
  const list = $("#goalList");
  list.innerHTML = modules
    .map(
      (m) =>
        `<div class="goal-item"><b>${m.icon} ${m.title}</b><p>${m.goal}</p></div>`,
    )
    .join("");
}
const searchForm = $("#practiceSearchForm");
if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runSearch($("#practiceSearchInput")?.value || "");
  });
}

$("#practiceSearchInput")?.addEventListener("input", (event) => {
  const value = event.target.value.trim();
  if ($("#clearSearch")) $("#clearSearch").hidden = !value;
  window.clearTimeout(window.__digitalSearchTimer);
  window.__digitalSearchTimer = window.setTimeout(() => {
    renderHome("all", value);
  }, 120);
});

$("#clearSearch")?.addEventListener("click", clearSearch);

window.addEventListener("error", (event) => {
  console.error("화면 실행 오류", event.error || event.message);
  toast("화면을 불러오는 중 문제가 생겼습니다. 새로고침해 주세요.");
});

document.addEventListener("click", (e) => {
  const modeButton = e.target.closest("[data-practice-mode]");
  if (modeButton) {
    e.preventDefault();
    beginPracticeMode(modeButton.dataset.practiceMode);
    return;
  }
  const moduleButton = e.target.closest("[data-module-id]");
  if (moduleButton) {
    e.preventDefault();
    startModule(moduleButton.dataset.moduleId);
    return;
  }

  const appButton = e.target.closest("[data-app]");
  if (appButton && appButton.closest("#appIcons, .phone-dock")) {
    e.preventDefault();
    openApp(appButton.dataset.app);
    return;
  }

  const officialResult = e.target.closest("[data-open-official]");
  if (officialResult) {
    e.preventDefault();
    // 인터넷 실행·검색·공식 사이트 선택까지 완료했으므로
    // 안내를 실제 사이트 안에서 해야 할 다음 단계로 이동합니다.
    const firstTwo = state.module?.steps?.slice(0, 2).join(" ") || "";
    if (state.module?.id === "hospital") {
      state.step = 1;
    } else if (/인터넷|공식 사이트|병원 찾기|검색/.test(firstTwo)) {
      state.step = Math.min(2, state.module.steps.length - 1);
    }
    showView("practiceView");
    renderPractice();
    return;
  }

  const decoyResult = e.target.closest("[data-open-decoy]");
  if (decoyResult) {
    e.preventDefault();
    wrong("이 결과는 ‘광고’이며 공식 사이트 주소가 아닙니다. 위의 공식 사이트 결과를 누르세요.");
    return;
  }

  const categoryButton = e.target.closest("[data-category]");
  if (categoryButton) {
    e.preventDefault();
    $$("[data-category]").forEach((button) => button.classList.remove("active"));
    categoryButton.classList.add("active");
    if ($("#practiceSearchInput")) $("#practiceSearchInput").value = "";
    if ($("#clearSearch")) $("#clearSearch").hidden = true;
    renderHome(categoryButton.dataset.category, "");
    return;
  }

  const exampleButton = e.target.closest("[data-search-example]");
  if (exampleButton) {
    e.preventDefault();
    runSearch(exampleButton.dataset.searchExample);
    return;
  }

  const a = e.target.closest("[data-action]");
  if (!a) return;
  const x = a.dataset.action;
  if (x === "home") {
    document.body.classList.remove("guided-mode", "field-mode");
    showView("homeView");
    renderHome();
window.DIGITAL_APP_READY = true;
  }
  if (x === "back-launcher") {
    state.module.entry === "kiosk" ? showView("homeView") : showLauncher();
  }
  if (x === "hint") hint();
  if (x === "restart") startModule(state.module.id);
  if (x === "repeat") startModule(state.module.id);
  if (x === "font-up")
    document.documentElement.style.setProperty(
      "--font-scale",
      Math.min(
        1.3,
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--font-scale",
          ) || 1,
        ) + 0.1,
      ),
    );
  if (x === "font-down")
    document.documentElement.style.setProperty(
      "--font-scale",
      Math.max(
        0.9,
        parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--font-scale",
          ) || 1,
        ) - 0.1,
      ),
    );
  if (x === "contrast") document.body.classList.toggle("high-contrast");
  if (x === "speak") speak();
  if (x === "clear-search") clearSearch();
});
renderHome();
})();
