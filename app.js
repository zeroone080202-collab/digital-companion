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
    steps: ["앱 찾기", "여정 입력", "항공편", "승객 정보", "좌석", "예약 확인"],
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
      "진료과",
      "날짜·시간",
      "예약 확인",
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
    steps: ["앱 찾기", "연락처 찾기", "메시지", "사진 선택", "전송", "확인"],
  },
  {
    id: "video",
    cat: "communication",
    icon: "📹",
    title: "영상통화",
    desc: "대화방에서 영상통화를 걸고 카메라·마이크 조절",
    goal: "가족에게 영상통화를 걸고 카메라를 한 번 전환",
    entry: "chat",
    steps: ["앱 찾기", "대화방", "영상통화", "연결", "카메라 전환", "종료"],
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
    steps: ["앱 찾기", "주소 확인", "가게", "메뉴·수량", "결제", "주문 확인"],
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
  ["rail", "🚄", "기차예매", "#2878b8"],
  ["air", "✈️", "항공예약", "#4b7bec"],
  ["bank", "🏦", "한빛은행", "#168074"],
  ["chat", "💬", "모두톡", "#fee500"],
  ["delivery", "🛵", "바로배달", "#29b66f"],
  ["shopping", "📦", "온쇼핑", "#e85d2a"],
  ["taxi", "🚕", "바로택시", "#353535"],
  ["health", "🏥", "건강예약", "#e84e5b"],
  ["gov", "📄", "민원24＋", "#1769aa"],
  ["map", "🗺️", "지도", "#45a65a"],
  ["message", "✉️", "문자", "#5e9bd6"],
  ["browser", "🌐", "인터넷", "#3078d6"],
];
let state = {
  module: null,
  step: 0,
  mistakes: 0,
  hints: 0,
  start: 0,
  data: {},
  lastEntry: null,
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
  if ($("#completeCount")) $("#completeCount").textContent = completed.length + "개";
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
  };
  if (state.module.entry === "kiosk") {
    showView("practiceView");
    renderPractice();
  } else {
    showLauncher();
  }
}
function showLauncher() {
  showView("launcherView");
  $("#launcherMission").textContent = state.module.goal;
  $("#launcherChecklist").innerHTML = state.module.steps
    .map((s, i) => `<li>${i === 0 ? "<b>지금:</b> " : ""}${s}</li>`)
    .join("");
  const icons = $("#appIcons");
  icons.innerHTML = "";
  appCatalog.forEach(([id, emoji, name, color]) => {
    const b = document.createElement("button");
    b.className = "app-icon";
    b.dataset.app = id;
    b.innerHTML = `<i style="background:${color};color:${id === "chat" ? "#222" : "#fff"}">${emoji}</i><span>${name}</span>`;
    b.onclick = () => openApp(id);
    icons.appendChild(b);
  });
}
function openApp(id) {
  const expected = state.module.entry;
  if (
    id === expected ||
    (expected === "browser" && id === "browser") ||
    (expected === "message" && id === "message")
  ) {
    state.lastEntry = id;
    showView("practiceView");
    renderPractice();
  } else {
    wrong(
      "이 연습에 필요한 앱이 아닙니다. 목표에 맞는 앱 이름을 다시 살펴보세요.",
    );
  }
}
function renderPractice() {
  const m = state.module;
  $("#practiceTitle").textContent = m.title;
  $("#practiceStep").textContent =
    `${state.step + 1} / ${m.steps.length}단계 · ${m.steps[state.step]}`;
  $("#progressBar").style.width = `${(state.step / m.steps.length) * 100}%`;
  $("#mistakeCount").textContent = state.mistakes;
  $("#hintCount").textContent = state.hints;
  const ui = renderers[m.id] || renderGeneric;
  ui();
}
function instruction(
  title,
  reason = "화면의 정보를 천천히 확인한 뒤 선택하세요.",
) {
  $("#currentInstruction").textContent = title;
  $("#currentReason").textContent = reason;
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
  toast(
    hints[state.module.id] ||
      "왼쪽의 “지금 할 일”을 먼저 읽고, 같은 문구가 있는 버튼을 찾아보세요.",
  );
}
function complete() {
  const sec = Math.max(1, Math.round((Date.now() - state.start) / 1000));
  $("#resultTitle").textContent = `${state.module.title} 연습을 마쳤습니다.`;
  $("#resultSummary").textContent =
    `“${state.module.goal}” 목표를 끝까지 수행했습니다.`;
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
  $("#simulator").innerHTML = html;
}
function top(title, sub = "교육용 모의 화면") {
  return `<div class="sim-top"><h2>${title}</h2><span class="education-badge">${sub}</span></div>`;
}
const renderers = {
  ktx() {
    const s = state.step;
    if (s === 0) {
      instruction(
        "출발역·도착역과 날짜를 선택한 뒤 열차를 조회하세요.",
        "실제 예매에서도 가장 먼저 여정과 시간을 정합니다.",
      );
      sim(
        top("기차예매 · 승차권 예매") +
          `<div class="sim-body"><div class="form-grid"><div class="field"><label>출발역</label><select id="from"><option>서울</option><option>용산</option><option>광명</option></select></div><div class="field"><label>도착역</label><select id="to"><option>부산</option><option>대전</option><option>동대구</option></select></div><div class="field"><label>출발일</label><input type="date" value="2026-07-20"></div><div class="field"><label>출발시간</label><select><option>08시 이후</option><option>10시 이후</option></select></div></div><button class="big-primary" id="searchTrain">열차 조회하기</button></div>`,
      );
      $("#searchTrain").onclick = () =>
        next({ from: $("#from").value, to: $("#to").value });
    } else if (s === 1) {
      instruction("원하는 출발시간의 KTX 열차에서 “좌석선택”을 누르세요.");
      sim(
        top(`${state.data.from} → ${state.data.to} 열차 조회`) +
          `<div class="sim-body"><table class="data-table"><thead><tr><th>열차</th><th>출발</th><th>도착</th><th>일반실</th><th>선택</th></tr></thead><tbody><tr><td>KTX 011</td><td>08:27</td><td>11:02</td><td>59,800원</td><td><button data-train="KTX 011">좌석선택</button></td></tr><tr><td>KTX 015</td><td>09:00</td><td>11:41</td><td>59,800원</td><td><button data-train="KTX 015">좌석선택</button></td></tr><tr><td>KTX 019</td><td>09:32</td><td>12:08</td><td>59,800원</td><td><button data-train="KTX 019">좌석선택</button></td></tr></tbody></table></div>`,
      );
      $$("[data-train]").forEach(
        (b) =>
          (b.onclick = () =>
            next({
              train: b.dataset.train,
              time: b.closest("tr").children[1].textContent,
            })),
      );
    } else if (s === 2) {
      instruction(
        "5호차에서 창가 좌석을 하나 선택하세요.",
        "A와 D가 창가 좌석입니다. 회색은 이미 예약된 좌석입니다.",
      );
      let rows = "";
      for (let r = 1; r <= 8; r++) {
        rows += `<div class="seat-row"><button class="seat ${r === 2 ? "booked" : ""}" data-seat="${r}A">${r}A</button><button class="seat" data-seat="${r}B">${r}B</button><span class="aisle">통로</span><button class="seat ${r === 4 ? "booked" : ""}" data-seat="${r}C">${r}C</button><button class="seat" data-seat="${r}D">${r}D</button></div>`;
      }
      sim(
        top(`${state.data.train} · 5호차 좌석선택`) +
          `<div class="sim-body"><div class="seat-map">${rows}</div><button class="big-primary" id="seatNext">선택한 좌석으로 계속</button></div>`,
      );
      $$(".seat:not(.booked)").forEach(
        (b) =>
          (b.onclick = () => {
            $$(".seat").forEach((x) => x.classList.remove("selected"));
            b.classList.add("selected");
            state.data.seat = b.dataset.seat;
          }),
      );
      $("#seatNext").onclick = () =>
        state.data.seat ? next() : wrong("좌석을 먼저 선택하세요.");
    } else if (s === 3) {
      instruction("출발역·도착역·열차·좌석을 확인하고 예약을 진행하세요.");
      sim(
        top("예약 내용 확인") +
          `<div class="sim-body"><div class="ticket"><div class="ticket-head">기차 승차권 예약 확인</div><div class="ticket-grid"><div><span>구간</span><b>${state.data.from} → ${state.data.to}</b></div><div><span>열차</span><b>${state.data.train}</b></div><div><span>출발</span><b>${state.data.time}</b></div><div><span>호차</span><b>5호차</b></div><div><span>좌석</span><b>${state.data.seat}</b></div><div><span>운임</span><b>59,800원</b></div></div></div><button class="big-primary" id="confirmTrain">위 내용으로 예약하기</button></div>`,
      );
      $("#confirmTrain").onclick = () => next();
    } else if (s === 4) {
      instruction(
        "결제 전에 금액을 마지막으로 확인하고 “모의 결제”를 누르세요.",
      );
      sim(
        top("결제하기") +
          `<div class="sim-body"><div class="account-card"><span>결제 예정 금액</span><strong>59,800원</strong><p>실제 카드정보는 입력하지 않습니다.</p></div><button class="big-primary" id="payTrain">모의 결제</button></div>`,
      );
      $("#payTrain").onclick = () => next();
    } else {
      instruction("승차권에서 출발시간과 좌석을 다시 확인하세요.");
      sim(
        top("모바일 승차권") +
          `<div class="sim-body"><div class="ticket"><div class="ticket-head">승차권 · 발권 완료</div><div class="ticket-grid"><div><span>출발</span><b>${state.data.from} ${state.data.time}</b></div><div><span>도착</span><b>${state.data.to}</b></div><div><span>열차</span><b>${state.data.train}</b></div><div><span>호차</span><b>5호차</b></div><div><span>좌석</span><b>${state.data.seat}</b></div><div><span>QR 승차권</span><b>▦ ▦ ▦</b></div></div></div><button class="big-primary" id="finishTrain">확인했습니다</button></div>`,
      );
      $("#finishTrain").onclick = () => next();
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
        top("한빛은행") +
          `<div class="bank-app"><div class="app-header">한빛은행 홈</div><div class="account-card"><span>입출금통장 123-***-456789</span><strong>1,245,800원</strong></div><div class="sim-body choice-grid"><button class="choice-card" id="transfer">↗ 이체</button><button class="choice-card">조회</button><button class="choice-card">공과금</button><button class="choice-card">카드</button></div></div>`,
      );
      $("#transfer").onclick = () => next();
    } else if (s === 1) {
      instruction("받는 분 계좌번호를 입력하고 다음을 누르세요.");
      sim(
        top("한빛은행 · 계좌이체") +
          `<div class="bank-app"><div class="app-header">받는 분 계좌</div><div class="sim-body"><div class="field"><label>은행</label><select><option>한빛은행</option><option>국민은행</option><option>농협은행</option></select></div><div class="field"><label>계좌번호</label><input id="account" inputmode="numeric" placeholder="숫자만 입력" value="110245678901"></div><button class="big-primary" id="accountNext">다음</button></div></div>`,
      );
      $("#accountNext").onclick = () =>
        $("#account").value.length >= 10
          ? next({ account: $("#account").value })
          : wrong("계좌번호를 다시 확인하세요.");
    } else if (s === 2) {
      instruction("송금할 금액 30,000원을 입력하세요.");
      sim(
        top("한빛은행 · 금액 입력") +
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
        top("받는 분 확인") +
          `<div class="bank-app"><div class="app-header">계좌 확인 결과</div><div class="sim-body"><div class="account-card"><span>받는 분</span><strong>김민수</strong><p>한빛은행 ${state.data.account}</p></div><button class="big-primary" id="nameOk">김민수님이 맞습니다</button><button class="big-primary" style="background:#777" id="nameNo">아닙니다</button></div></div>`,
      );
      $("#nameOk").onclick = () => next();
      $("#nameNo").onclick = () => wrong("이번 목표의 받는 분은 김민수입니다.");
    } else if (s === 4) {
      instruction("모든 내용을 마지막으로 확인하고 이체를 누르세요.");
      sim(
        top("이체 최종 확인") +
          `<div class="bank-app"><div class="app-header">이체 내용</div><div class="sim-body"><table class="data-table"><tr><th>받는 분</th><td>김민수</td></tr><tr><th>계좌</th><td>${state.data.account}</td></tr><tr><th>금액</th><td>30,000원</td></tr><tr><th>수수료</th><td>0원</td></tr></table><button class="big-primary" id="sendMoney">모의 이체하기</button></div></div>`,
      );
      $("#sendMoney").onclick = () => next();
    } else {
      instruction("이체 결과를 확인하고 끝내세요.");
      sim(
        top("이체 완료") +
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
      "민원24＋",
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
    renderBrowserFlow(
      "우리병원",
      "내과 진료 예약",
      "오전 10:30 진료",
      "예약 확정",
    );
  },
  air() {
    renderBrowserFlow(
      "하늘항공",
      "인천 → 제주 왕복",
      "오전편 · 통로 좌석",
      "항공권 예약",
    );
  },
  delivery() {
    renderCommerce("바로배달", "김밥 2줄", "우리집 주소", "배달 주문");
  },
  shopping() {
    renderCommerce("온쇼핑", "생수 2L 6개", "기본 배송지", "상품 주문");
  },
  taxi() {
    renderCommerce("바로택시", "서울역", "현재 위치", "택시 호출");
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
    sim(
      `<div class="kiosk-stage"><div class="kiosk-sign">교통카드 키오스크 · Ticket Kiosk</div><div class="kiosk-machine"><div class="kiosk-screen"><h2>${label} 승차권 발매</h2><div class="kiosk-menu"><button id="once">1회용<br>교통카드</button><button>교통카드<br>충전</button><button>우대용<br>교통카드</button><button>정기권</button></div></div>${hardware()}</div></div>`,
    );
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
    sim(
      kioskWrap(
        `<h2>${state.data.pay === "cash" ? "현금을 투입해 주세요" : "카드를 투입해 주세요"}</h2><div class="hardware-panel"><button class="hardware" id="insert"><div class="hardware-slot"></div>${state.data.pay === "cash" ? "지폐 투입구" : "신용카드 투입구"}</button><div class="hardware"><div class="hardware-slot"></div>동전 투입구</div><div class="hardware"><div class="hardware-slot"></div>카드 발급구</div></div>`,
      ),
    );
    $("#insert").onclick = () => next();
  } else {
    instruction("카드 발급구에서 1회용 교통카드를 가져가세요.");
    sim(
      kioskWrap(
        `<h2>발급이 완료되었습니다</h2><div class="result-check">✓</div><p style="text-align:center;font-size:1.2rem">${from} → ${to}<br>카드를 반드시 가져가세요.</p><button class="big-primary" id="takeCard">카드를 받았습니다</button>`,
      ),
    );
    $("#takeCard").onclick = () => next();
  }
}
function kioskWrap(content) {
  return `<div class="kiosk-stage"><div class="kiosk-sign">교통카드 키오스크 · Ticket Kiosk</div><div class="kiosk-machine"><div class="kiosk-screen">${content}</div>${hardware()}</div></div>`;
}
function hardware() {
  return `<div class="hardware-panel"><div class="hardware"><div class="hardware-slot"></div>지폐 투입구</div><div class="hardware"><div class="hardware-slot"></div>동전 투입구</div><div class="hardware"><div class="hardware-slot"></div>카드 투입구</div><div class="hardware"><div class="hardware-slot"></div>교통카드 접촉부</div><div class="hardware"><div class="hardware-slot"></div>카드 발급구</div></div>`;
}
function renderChat(video) {
  const s = state.step;
  if (s === 0) {
    instruction("검색창에서 가족 이름 “딸”을 찾아 대화방을 여세요.");
    sim(
      top("모두톡") +
        `<div class="chat-app"><div class="chat-head"><span>대화</span><span>🔍</span></div><div class="sim-body"><button class="choice-card" id="daughter">👩 딸</button><button class="choice-card">👨 아들</button><button class="choice-card">친구 모임</button></div></div>`,
    );
    $("#daughter").onclick = () => next();
  } else if (video) {
    if (s === 1) {
      instruction("오른쪽 위 카메라 모양을 눌러 영상통화를 거세요.");
      sim(
        top("모두톡 · 딸") +
          `<div class="chat-app"><div class="chat-head"><span>← 딸</span><button id="videoBtn">📹</button></div><div class="chat-body"><div class="bubble">엄마, 잘 도착했어요?</div></div></div>`,
      );
      $("#videoBtn").onclick = () => next();
    } else if (s === 2) {
      instruction("영상통화 연결 버튼을 누르세요.");
      sim(
        top("영상통화 확인") +
          `<div class="chat-app"><div class="video-call"><div><div class="avatar-large">👩</div><h2 style="text-align:center">딸</h2></div><button class="big-primary" id="connectCall" style="position:absolute;bottom:30px;width:80%">영상통화 연결</button></div></div>`,
      );
      $("#connectCall").onclick = () => next();
    } else if (s === 3) {
      instruction("통화 중 카메라 전환 버튼을 눌러보세요.");
      sim(videoUI());
      $("#switchCam").onclick = () => next();
    } else if (s === 4) {
      instruction("마이크가 켜져 있는지 확인한 뒤 통화를 종료하세요.");
      sim(videoUI());
      $("#endCall").onclick = () => next();
    } else {
      instruction("영상통화가 종료됐는지 확인하세요.");
      sim(
        top("모두톡") +
          `<div class="chat-app"><div class="chat-head">딸</div><div class="chat-body"><div class="bubble me">영상통화 01:12</div></div><button class="big-primary" id="finishVideo" style="position:absolute;bottom:20px;width:90%;left:5%">확인</button></div>`,
      );
      $("#finishVideo").onclick = () => next();
    }
  } else {
    if (s === 1) {
      instruction("입력창에 “잘 도착했다”고 입력하고 전송하세요.");
      sim(chatUI());
      $("#sendChat").onclick = () => {
        const t = $("#chatText").value.trim();
        t ? next({ message: t }) : wrong("메시지를 입력하세요.");
      };
    } else if (s === 2) {
      instruction("사진 추가 버튼을 눌러 사진을 선택하세요.");
      sim(chatUI(true));
      $("#addPhoto").onclick = () => next();
    } else if (s === 3) {
      instruction("선택한 사진을 전송하세요.");
      sim(
        top("모두톡 · 사진 전송") +
          `<div class="chat-app"><div class="chat-head">← 딸</div><div class="chat-body"><div class="bubble me">${state.data.message}</div><div class="bubble me" style="font-size:4rem">🌳</div></div><button class="big-primary" id="sendPhoto" style="position:absolute;bottom:20px;width:90%;left:5%">사진 전송</button></div>`,
      );
      $("#sendPhoto").onclick = () => next();
    } else if (s === 4) {
      instruction("보낸 메시지와 사진이 대화방에 표시되는지 확인하세요.");
      sim(
        top("모두톡 · 딸") +
          `<div class="chat-app"><div class="chat-head">← 딸</div><div class="chat-body"><div class="bubble">엄마, 잘 도착했어요?</div><div class="bubble me">${state.data.message}</div><div class="bubble me" style="font-size:4rem">🌳</div></div><button class="big-primary" id="chatDone" style="position:absolute;bottom:20px;width:90%;left:5%">확인</button></div>`,
      );
      $("#chatDone").onclick = () => next();
    } else next();
  }
}
function chatUI(photo = false) {
  return (
    top("모두톡 · 딸") +
    `<div class="chat-app"><div class="chat-head"><span>← 딸</span><span>📞 📹</span></div><div class="chat-body"><div class="bubble">엄마, 잘 도착했어요?</div></div><div class="chat-input"><button id="addPhoto">＋</button><input id="chatText" placeholder="메시지 입력" value="${photo ? state.data.message || "잘 도착했다" : ""}"><button id="sendChat">전송</button></div></div>`
  );
}
function videoUI() {
  return (
    top("모두톡 · 영상통화") +
    `<div class="chat-app"><div class="video-call"><div><div class="avatar-large">👩</div><h2 style="text-align:center">딸과 통화 중</h2></div><div class="call-controls"><button>🎙️</button><button id="switchCam">🔄</button><button id="endCall" class="call-end">☎</button></div></div></div>`
  );
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
      top(brand) +
        `<div class="bank-app"><div class="app-header">${brand}</div><div class="sim-body"><input style="width:100%;padding:15px" value="${item}" id="productSearch"><button class="big-primary" id="doSearch">검색</button></div></div>`,
    );
    $("#doSearch").onclick = () => next();
  } else if (s === 1) {
    instruction(`검색 결과에서 “${item}”을 선택하세요.`);
    sim(
      top(brand) +
        `<div class="sim-body product-grid"><button class="product" id="targetProduct"><div class="product-image">📦</div><h3>${item}</h3><p>12,900원</p></button><button class="product"><div class="product-image">🧴</div><h3>다른 상품</h3></button></div>`,
    );
    $("#targetProduct").onclick = () => next();
  } else if (s === 2) {
    instruction("수량과 옵션을 확인하세요.");
    sim(
      top(brand) +
        `<div class="sim-body"><table class="data-table"><tr><th>상품</th><td>${item}</td></tr><tr><th>수량</th><td>1</td></tr><tr><th>가격</th><td>12,900원</td></tr></table><button class="big-primary" id="optionNext">장바구니 담기</button></div>`,
    );
    $("#optionNext").onclick = () => next();
  } else if (s === 3) {
    instruction(`배송지 또는 출발 위치가 “${address}”인지 확인하세요.`);
    sim(
      top(brand) +
        `<div class="sim-body"><div class="field"><label>주소·위치</label><input value="${address}" readonly></div><button class="big-primary" id="addressNext">주소가 맞습니다</button></div>`,
    );
    $("#addressNext").onclick = () => next();
  } else if (s === 4) {
    instruction("최종 금액과 결제방법을 확인하세요.");
    sim(
      top(brand) +
        `<div class="sim-body"><table class="data-table"><tr><th>내용</th><td>${item}</td></tr><tr><th>금액</th><td>12,900원</td></tr><tr><th>결제</th><td>교육용 모의 결제</td></tr></table><button class="big-primary" id="commercePay">${action}</button></div>`,
    );
    $("#commercePay").onclick = () => next();
  } else {
    instruction("주문 또는 호출 결과를 확인하세요.");
    sim(
      top(brand) +
        `<div class="sim-body"><div class="result-check">✓</div><h2 style="text-align:center">${action} 완료</h2><button class="big-primary" id="commerceDone">확인</button></div>`,
    );
    $("#commerceDone").onclick = () => next();
  }
}
function renderFood() {
  renderCommerce("푸드 키오스크", "불고기버거 세트", "포장", "카드 결제");
}
function renderATM() {
  renderCommerce("ATM", "현금 50,000원", "카드 먼저 회수", "출금 완료");
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
      top("문자 메시지") +
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
    top(state.module.title) +
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
  if ($("#clearSearch")) $("#clearSearch").hidden = !event.target.value.trim();
});

$("#clearSearch")?.addEventListener("click", clearSearch);

window.addEventListener("error", (event) => {
  console.error("화면 실행 오류", event.error || event.message);
  toast("화면을 불러오는 중 문제가 생겼습니다. 새로고침해 주세요.");
});

document.addEventListener("click", (e) => {
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
    showView("homeView");
    renderHome();
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
