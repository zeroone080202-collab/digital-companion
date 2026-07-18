(() => {
  "use strict";

  const practices = [
    { id:"restaurant", category:"주문·결제", title:"음식점 키오스크", description:"메뉴 선택부터 카드 결제까지 실제 주문 순서 연습", icon:"🍔", keywords:"음식 주문 키오스크 햄버거 결제" },
    { id:"cafe", category:"주문·결제", title:"카페 키오스크", description:"음료·크기·온도·추가 옵션을 고르는 연습", icon:"☕", keywords:"카페 커피 음료 키오스크" },
    { id:"metro", category:"교통", title:"지하철 승차권", description:"노선도에서 목적지를 찾고 표를 구매하는 연습", icon:"🚇", keywords:"지하철 표 노선도 교통카드" },
    { id:"train", category:"교통", title:"기차표 예매", description:"출발역·도착역·시간·좌석을 선택하는 연습", icon:"🚄", keywords:"기차 KTX 좌석 예매" },
    { id:"flight", category:"여행", title:"비행기표 예매", description:"항공편 검색부터 승객 정보 확인까지 연습", icon:"✈", keywords:"비행기 항공권 예약 공항" },
    { id:"hotel", category:"여행", title:"호텔 예약", description:"날짜와 객실을 고르고 예약 내용을 확인하는 연습", icon:"🏨", keywords:"호텔 숙박 예약 객실" },
    { id:"bank", category:"금융", title:"은행 송금", description:"받는 사람과 금액을 확인하고 이체하는 연습", icon:"₩", keywords:"은행 송금 이체 계좌" },
    { id:"atm", category:"금융", title:"ATM 현금 찾기", description:"카드 넣기부터 금액 선택과 명세표 확인까지 연습", icon:"🏧", keywords:"ATM 현금 출금 카드" },
    { id:"chat", category:"연락", title:"메시지 보내기", description:"대화방에서 글과 사진을 보내는 연습", icon:"💬", keywords:"카톡 메시지 사진 연락" },
    { id:"video", category:"연락", title:"영상통화", description:"영상통화를 걸고 마이크·카메라를 조절하는 연습", icon:"▣", keywords:"카톡 영상통화 카메라 마이크" },
    { id:"shopping", category:"생활", title:"온라인 물건 주문", description:"상품 선택부터 배송지와 주문 확인까지 연습", icon:"🛒", keywords:"쇼핑 물건 주문 배송" },
    { id:"delivery", category:"생활", title:"배달 음식 주문", description:"가게·메뉴·주소·결제 방법을 선택하는 연습", icon:"🛵", keywords:"배달 음식 주문 주소" },
    { id:"hospital", category:"건강", title:"병원 무인접수", description:"진료과와 방문 목적을 선택하고 접수표를 받는 연습", icon:"✚", keywords:"병원 접수 진료 키오스크" },
    { id:"gov", category:"공공", title:"무인민원발급기", description:"필요한 증명서를 찾고 발급하는 순서 연습", icon:"▤", keywords:"민원 주민등록등본 발급" },
  ];

  const state = {
    current: null,
    step: 0,
    data: {},
    mistakes: 0,
    hints: 0,
    startedAt: 0,
    fontSize: 18,
  };

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const homeView = $("#homeView");
  const practiceView = $("#practiceView");
  const frame = $("#simulatorFrame");
  const toast = $("#toast");

  function money(n){ return Number(n || 0).toLocaleString("ko-KR") + "원"; }
  function esc(v){ return String(v ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c])); }
  function showToast(msg){ toast.textContent = msg; toast.classList.add("show"); clearTimeout(showToast.t); showToast.t = setTimeout(()=>toast.classList.remove("show"), 2200); }
  function speak(text){ if(!("speechSynthesis" in window)){ showToast("이 브라우저에서는 음성 안내를 지원하지 않습니다."); return; } speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang="ko-KR"; u.rate=.86; speechSynthesis.speak(u); }

  function renderCards(filter=""){
    const q = filter.trim().toLowerCase();
    const list = practices.filter(p => !q || `${p.title} ${p.description} ${p.keywords}`.toLowerCase().includes(q));
    $("#practiceGrid").innerHTML = list.map(p => `
      <button class="practice-card" type="button" data-practice="${p.id}">
        <span class="icon-box" aria-hidden="true">${p.icon}</span>
        <span class="tag">${p.category}</span>
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <span class="start-label">연습 시작하기 →</span>
      </button>`).join("") || `<p>찾는 연습이 없습니다.</p>`;
  }

  const flows = {
    restaurant: {
      title:"음식점 키오스크", category:"주문·결제", steps:5,
      coach:[
        ["먹을 장소를 선택하세요","매장에서 먹을지 포장할지 선택합니다.","화면 가운데의 두 버튼 중 하나를 눌러보세요."],
        ["메뉴를 장바구니에 담으세요","원하는 메뉴를 눌러 장바구니에 담습니다.","오른쪽 장바구니에 메뉴가 생기는지 확인하세요."],
        ["주문 내용을 확인하세요","선택한 메뉴와 총금액을 확인한 뒤 주문하기를 누릅니다.","장바구니가 비어 있으면 메뉴를 먼저 선택해야 합니다."],
        ["결제 방법을 고르세요","카드 결제를 선택하고 결제 단말기 안내를 따라갑니다.","연습에서는 실제 카드정보가 필요하지 않습니다."],
        ["카드를 넣는 동작을 연습하세요","카드 투입구를 누르면 모의 결제가 진행됩니다.","검은색 카드 투입구를 눌러보세요."],
      ],
      render: renderRestaurant
    },
    cafe: {
      title:"카페 키오스크", category:"주문·결제", steps:5,
      coach:[
        ["음료를 선택하세요","원하는 음료 메뉴를 하나 선택합니다.","사진과 가격을 보고 음료를 눌러보세요."],
        ["온도를 선택하세요","따뜻하게 마실지 차갑게 마실지 선택합니다.","HOT 또는 ICE를 눌러보세요."],
        ["크기를 선택하세요","기본 크기 또는 큰 크기를 고릅니다.","처음에는 기본 크기를 골라도 됩니다."],
        ["추가 옵션을 확인하세요","샷 추가나 시럽 추가 여부를 선택합니다.","원하지 않으면 '추가 안 함'을 누르세요."],
        ["결제하기를 누르세요","최종 주문 내용을 확인하고 결제합니다.","실제 결제는 이루어지지 않습니다."],
      ],
      render: renderCafe
    },
    metro: {
      title:"지하철 승차권", category:"교통", steps:5,
      coach:[
        ["목적지를 선택하세요","노선도에서 가려는 역을 눌러 선택합니다.","환승역은 두 노선 색이 함께 표시됩니다."],
        ["승차 인원을 고르세요","어른 1명 또는 2명을 선택합니다.","혼자 이동하는 연습이라면 1명을 누르세요."],
        ["운임을 확인하세요","출발역과 도착역, 총 운임을 확인합니다.","목적지가 맞는지 다시 읽어보세요."],
        ["결제 방법을 고르세요","교통카드 또는 현금을 선택합니다.","연습에서는 어떤 방법을 선택해도 실제 결제가 되지 않습니다."],
        ["승차권 받기를 누르세요","발권구를 눌러 승차권을 받는 동작을 연습합니다.","화면 아래의 발권구를 눌러보세요."],
      ],
      render: renderMetro
    },
    train: bookingFlow("기차표 예매","교통","서울","부산",["07:30 KTX","09:00 KTX","10:15 ITX"],"🚄"),
    flight: bookingFlow("비행기표 예매","여행","서울(김포)","제주",["08:10 직항","10:20 직항","13:40 직항"],"✈"),
    hotel: hotelFlow(),
    bank: bankFlow(),
    atm: atmFlow(),
    chat: chatFlow(),
    video: videoFlow(),
    shopping: shoppingFlow(false),
    delivery: shoppingFlow(true),
    hospital: serviceKioskFlow("병원 무인접수","건강",["내과","정형외과","안과","건강검진"],"진료과를 선택하세요","접수번호"),
    gov: serviceKioskFlow("무인민원발급기","공공",["주민등록등본","가족관계증명서","건축물대장","지방세증명"],"발급할 서류를 선택하세요","발급번호"),
  };

  function startPractice(id){
    const flow = flows[id]; if(!flow) return;
    state.current=id; state.step=0; state.data={}; state.mistakes=0; state.hints=0; state.startedAt=Date.now();
    homeView.classList.add("hidden"); practiceView.classList.remove("hidden");
    $("#practiceCategory").textContent = flow.category;
    $("#practiceTitle").textContent = flow.title;
    window.scrollTo({top:0,behavior:"smooth"});
    renderCurrent();
  }

  function renderCurrent(){
    const flow=flows[state.current]; if(!flow) return;
    const c=flow.coach[state.step] || ["연습 완료","잘하셨습니다.",""];
    $("#coachTitle").textContent=c[0]; $("#coachText").textContent=c[1]; $("#hintBox").textContent=c[2]; $("#hintBox").classList.add("hidden");
    $("#mistakeCount").textContent=state.mistakes; $("#hintCount").textContent=state.hints;
    $("#progressText").textContent=`${Math.min(state.step+1,flow.steps)} / ${flow.steps} 단계`;
    $("#progressBar").style.width=`${Math.min(100,((state.step+1)/flow.steps)*100)}%`;
    flow.render();
  }

  function next(){ state.step++; const flow=flows[state.current]; if(state.step>=flow.steps) return complete(); renderCurrent(); }
  function mistake(msg="먼저 필요한 항목을 선택해 주세요."){ state.mistakes++; $("#mistakeCount").textContent=state.mistakes; showToast(msg); }
  function complete(){
    const sec=Math.max(1,Math.round((Date.now()-state.startedAt)/1000));
    frame.innerHTML=`<div class="complete-screen"><div><div class="complete-icon">✓</div><h3>연습을 완료했습니다</h3><p>실제 화면에서도 오늘 연습한 순서를 천천히 떠올려 보세요. 화면 모양이 조금 달라도 확인해야 할 내용과 진행 순서는 비슷합니다.</p><div class="complete-stats"><span>걸린 시간 ${Math.floor(sec/60)}분 ${sec%60}초</span><span>실수 ${state.mistakes}회</span><span>도움 ${state.hints}회</span></div><button class="primary" data-action="repeat">같은 연습 다시 하기</button> <button class="secondary" data-action="go-home">다른 연습 선택</button></div></div>`;
    $("#progressText").textContent="연습 완료"; $("#progressBar").style.width="100%"; $("#coachTitle").textContent="잘하셨습니다"; $("#coachText").textContent="혼자서 다시 한 번 해보면 더 익숙해집니다.";
  }

  function renderRestaurant(){
    const items=[{id:"burger",name:"불고기 버거",price:5900,icon:"🍔"},{id:"chicken",name:"치킨 버거",price:6500,icon:"🍗"},{id:"fries",name:"감자튀김",price:2800,icon:"🍟"},{id:"cola",name:"탄산음료",price:2200,icon:"🥤"},{id:"salad",name:"샐러드",price:4300,icon:"🥗"},{id:"coffee",name:"아메리카노",price:2500,icon:"☕"}];
    if(state.step===0){ frame.innerHTML=simPage("WELCOME","주문 방법을 선택해 주세요",`<div class="option-grid"><button class="option-button" data-set="place" data-value="매장"><strong>매장에서 먹기</strong><span>매장 안에서 식사합니다</span></button><button class="option-button" data-set="place" data-value="포장"><strong>포장해서 가져가기</strong><span>음식을 포장합니다</span></button></div>`); return; }
    if(state.step<=2){
      const cart=state.data.cart||[]; const total=cart.reduce((s,x)=>s+x.price,0);
      frame.innerHTML=`<div class="kiosk-layout"><div class="kiosk-main"><div class="kiosk-head"><span class="kiosk-logo">GOOD MEAL</span><span class="kiosk-time">주문 방식: ${esc(state.data.place)}</span></div><div class="kiosk-category-tabs"><button class="active">추천메뉴</button><button>버거</button><button>사이드</button><button>음료</button></div><div class="menu-grid">${items.map(i=>`<button class="menu-card" data-add-item='${JSON.stringify(i)}'><div class="food-photo">${i.icon}</div><div class="menu-info"><strong>${i.name}</strong><span>${money(i.price)}</span></div></button>`).join("")}</div></div><aside class="kiosk-cart"><div class="cart-head"><strong>주문 내역</strong></div><div class="cart-list">${cart.length?cart.map((i,n)=>`<div class="cart-item"><span>${i.name}</span><button data-remove-item="${n}" aria-label="${i.name} 삭제">삭제</button></div>`).join(""):`<p class="cart-empty">메뉴를 선택해 주세요</p>`}</div><div class="cart-total"><span>총 결제금액</span><br><strong>${money(total)}</strong></div><button class="cart-order" data-action="restaurant-order">주문하기</button></aside></div>`; return;
    }
    if(state.step===3){ frame.innerHTML=simPage("PAYMENT","결제 방법을 선택해 주세요",`<div class="option-grid"><button class="option-button" data-set="payment" data-value="신용카드"><strong>신용·체크카드</strong><span>카드를 단말기에 넣습니다</span></button><button class="option-button" data-set="payment" data-value="모바일결제"><strong>모바일 결제</strong><span>휴대전화 결제 화면을 사용합니다</span></button></div>`); return; }
    frame.innerHTML=`<div class="metro-shell"><div class="metro-machine"><div class="metro-screen"><div class="metro-header"><strong>카드 결제</strong><span>${money((state.data.cart||[]).reduce((s,x)=>s+x.price,0))}</span></div><div class="sim-body" style="text-align:center"><h3 class="sim-title">카드를 아래 투입구에 넣어 주세요</h3><p class="sim-subtitle">카드 앞면이 위로 향하도록 천천히 넣습니다.</p><div style="font-size:5rem;margin:45px 0 20px">💳</div></div></div><div class="metro-bottom"><button class="metro-slot" data-action="finish-card">카드 투입구<br>여기를 눌러 연습</button><div class="metro-slot">영수증 출력구</div></div></div></div>`;
  }

  function renderCafe(){
    const drinks=[{name:"아메리카노",price:3200,icon:"☕"},{name:"카페라떼",price:4200,icon:"🥛"},{name:"바닐라라떼",price:4800,icon:"🍨"},{name:"유자차",price:4300,icon:"🍋"}];
    if(state.step===0){ frame.innerHTML=simPage("CAFE ORDER","음료를 선택해 주세요",`<div class="product-grid">${drinks.map(d=>`<button class="product-card" data-cafe-drink='${JSON.stringify(d)}'><div class="product-image">${d.icon}</div><div><strong>${d.name}</strong><span>${money(d.price)}</span></div></button>`).join("")}</div>`); return; }
    if(state.step===1) return frame.innerHTML=simPage("OPTION 1","온도를 선택해 주세요", optionButtons([["HOT","따뜻한 음료"],["ICE","차가운 음료"]],"cafe-temp"));
    if(state.step===2) return frame.innerHTML=simPage("OPTION 2","크기를 선택해 주세요", optionButtons([["기본 크기","추가금액 없음"],["큰 크기","700원 추가"]],"cafe-size"));
    if(state.step===3) return frame.innerHTML=simPage("OPTION 3","추가할 옵션이 있나요?", optionButtons([["추가 안 함","기본 구성으로 주문"],["샷 추가","500원 추가"],["시럽 추가","300원 추가"]],"cafe-extra"));
    const d=state.data.drink||{name:"음료",price:0}; const extra=(state.data.size==="큰 크기"?700:0)+(state.data.extra==="샷 추가"?500:state.data.extra==="시럽 추가"?300:0);
    frame.innerHTML=simPage("ORDER CHECK","주문 내용을 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>음료</span><strong>${esc(d.name)}</strong></div><div class="summary-row"><span>온도</span><strong>${esc(state.data.temp)}</strong></div><div class="summary-row"><span>크기</span><strong>${esc(state.data.size)}</strong></div><div class="summary-row"><span>추가 옵션</span><strong>${esc(state.data.extra)}</strong></div><div class="summary-row"><span>결제 금액</span><strong>${money(d.price+extra)}</strong></div></div>`, `<button class="primary" data-action="complete-now">결제하기</button>`);
  }

  function renderMetro(){
    const stations=[
      ["서울역",18,42,"transfer"],["시청",32,42,""],["종로3가",48,42,"transfer"],["동대문",64,42,""],["왕십리",80,42,"transfer"],
      ["홍대입구",18,67,"line2"],["신촌",31,64,"line2"],["을지로입구",45,61,"transfer"],["강남",63,57,"line2"],["잠실",80,53,"line2"]
    ];
    if(state.step===0){ frame.innerHTML=`<div class="metro-shell"><div class="metro-machine"><div class="metro-screen"><div class="metro-header"><strong>1회용 교통카드 구매</strong><span>출발역: 서울역</span></div><div class="metro-map"><div class="metro-line l1"></div><div class="metro-line l2"></div>${stations.map(s=>`<button class="metro-station ${s[3]}" style="left:${s[1]}%;top:${s[2]}%" data-station="${s[0]}">${s[0]}</button>`).join("")}</div></div><div class="metro-bottom"><div class="metro-slot">동전·지폐 투입구</div><div class="metro-slot">승차권 발권구</div></div></div></div>`; return; }
    if(state.step===1) return frame.innerHTML=simPage("인원 선택","승차 인원을 선택해 주세요", optionButtons([["어른 1명","한 명의 승차권"],["어른 2명","두 명의 승차권"]],"metro-people"));
    if(state.step===2){ const fare=state.data.people==="어른 2명"?3000:1500; state.data.fare=fare; frame.innerHTML=simPage("운임 확인","선택한 내용을 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>출발역</span><strong>서울역</strong></div><div class="summary-row"><span>도착역</span><strong>${esc(state.data.station)}</strong></div><div class="summary-row"><span>인원</span><strong>${esc(state.data.people)}</strong></div><div class="summary-row"><span>총 운임</span><strong>${money(fare)}</strong></div></div>`,`<button class="primary" data-action="next">확인</button>`); return; }
    if(state.step===3) return frame.innerHTML=simPage("결제","결제 방법을 선택해 주세요", optionButtons([["교통카드","카드를 단말기에 댑니다"],["현금","지폐 또는 동전을 넣습니다"]],"metro-payment"));
    frame.innerHTML=`<div class="metro-shell"><div class="metro-machine"><div class="metro-screen"><div class="metro-header"><strong>발권 완료</strong><span>${money(state.data.fare)}</span></div><div class="sim-body" style="text-align:center"><h3 class="sim-title">승차권이 나왔습니다</h3><p>아래 발권구를 눌러 승차권을 받는 연습을 해보세요.</p><div style="font-size:5rem;margin-top:35px">🎫</div></div></div><div class="metro-bottom"><div class="metro-slot">거스름돈 반환구</div><button class="metro-slot" data-action="complete-now">승차권 발권구<br>여기를 누르세요</button></div></div></div>`;
  }

  function bookingFlow(title,category,from,to,times,icon){
    return {
      title, category, steps:5,
      coach:[["출발지와 도착지를 확인하세요","출발하는 곳과 도착하는 곳을 선택합니다.","방향이 거꾸로 되지 않았는지 확인하세요."],["날짜를 선택하세요","이동할 날짜를 달력에서 선택합니다.","오늘보다 이전 날짜는 선택하지 않습니다."],["시간을 선택하세요","원하는 출발 시간과 교통편을 선택합니다.","너무 이르거나 늦은 시간은 아닌지 확인하세요."],["좌석을 선택하세요","비어 있는 좌석 중 하나를 선택합니다.","창가 또는 통로 좌석을 확인하세요."],["예약 내용을 확인하세요","날짜·시간·좌석과 금액을 최종 확인합니다.","이름과 일정이 맞는지 천천히 읽어보세요."]],
      render(){
        if(state.step===0) return frame.innerHTML=simPage(title,"출발지와 도착지를 확인해 주세요",`<div class="form-grid"><div class="form-field"><label>출발</label><select id="fromSel"><option>${from}</option><option>대전</option><option>부산</option></select></div><div class="form-field"><label>도착</label><select id="toSel"><option>${to}</option><option>대구</option><option>광주</option></select></div></div>`,`<button class="primary" data-action="booking-route">다음</button>`);
        if(state.step===1) return frame.innerHTML=calendarPage(title);
        if(state.step===2) return frame.innerHTML=simPage(title,"출발 시간을 선택해 주세요",`<div class="booking-list">${times.map((t,i)=>`<button class="booking-card" data-time="${t}"><div class="booking-thumb">${icon}</div><div><h4>${t}</h4><p>${from} → ${to}</p></div><span class="price">${money(42000+i*7000)}</span></button>`).join("")}</div>`);
        if(state.step===3) return frame.innerHTML=seatPage();
        frame.innerHTML=simPage(title,"예약 내용을 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>구간</span><strong>${from} → ${to}</strong></div><div class="summary-row"><span>날짜</span><strong>${esc(state.data.date)}</strong></div><div class="summary-row"><span>시간</span><strong>${esc(state.data.time)}</strong></div><div class="summary-row"><span>좌석</span><strong>${esc(state.data.seat)}</strong></div><div class="summary-row"><span>결제 예정 금액</span><strong>${money(49000)}</strong></div></div>`,`<button class="primary" data-action="complete-now">예약 연습 완료</button>`);
      }
    };
  }

  function hotelFlow(){
    return { title:"호텔 예약", category:"여행", steps:5, coach:[["여행지를 선택하세요","숙박할 지역을 입력합니다.","도시나 지역 이름을 확인하세요."],["숙박 날짜를 선택하세요","체크인 날짜를 선택합니다.","숙박 시작일을 눌러보세요."],["객실을 선택하세요","인원과 가격을 비교해 객실을 고릅니다.","조식 포함 여부도 확인하세요."],["예약자 정보를 확인하세요","연락받을 이름과 전화번호를 확인합니다.","연습용 정보만 사용합니다."],["예약 조건을 최종 확인하세요","날짜·객실·취소 조건을 확인합니다.","취소 가능 여부와 총금액을 꼭 확인하세요."]], render(){
      if(state.step===0) return frame.innerHTML=simPage("STAY BOOKING","어디에서 숙박하시나요?",`<div class="form-grid"><div class="form-field full"><label>여행지</label><select id="hotelCity"><option>부산 해운대</option><option>제주 서귀포</option><option>강릉 경포</option></select></div></div>`,`<button class="primary" data-action="hotel-city">날짜 선택</button>`);
      if(state.step===1) return frame.innerHTML=calendarPage("호텔 예약");
      if(state.step===2) return frame.innerHTML=simPage("ROOM SELECT","객실을 선택해 주세요",`<div class="booking-list"><button class="booking-card" data-room="스탠다드 더블"><div class="booking-thumb">🛏</div><div><h4>스탠다드 더블</h4><p>2인 · 무료 취소 가능</p></div><span class="price">89,000원</span></button><button class="booking-card" data-room="오션뷰 트윈"><div class="booking-thumb">🌊</div><div><h4>오션뷰 트윈</h4><p>2인 · 조식 포함</p></div><span class="price">139,000원</span></button></div>`);
      if(state.step===3) return frame.innerHTML=simPage("GUEST INFO","예약자 정보를 확인해 주세요",`<div class="form-grid"><div class="form-field"><label>예약자 이름</label><input id="guestName" value="김연습"></div><div class="form-field"><label>연락처</label><input id="guestPhone" value="010-0000-0000"></div></div>`,`<button class="primary" data-action="hotel-guest">다음</button>`);
      frame.innerHTML=simPage("BOOKING CHECK","예약 내용을 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>지역</span><strong>${esc(state.data.city)}</strong></div><div class="summary-row"><span>날짜</span><strong>${esc(state.data.date)}</strong></div><div class="summary-row"><span>객실</span><strong>${esc(state.data.room)}</strong></div><div class="summary-row"><span>예약자</span><strong>${esc(state.data.guest)}</strong></div><div class="summary-row"><span>취소 조건</span><strong>체크인 3일 전까지 무료</strong></div></div>`,`<button class="primary" data-action="complete-now">예약 연습 완료</button>`);
    }};
  }

  function bankFlow(){
    return { title:"은행 송금", category:"금융", steps:5, coach:[["이체 메뉴를 시작하세요","은행 앱에서 이체 버튼을 누릅니다.","잔액 아래의 이체하기 버튼을 찾아보세요."],["받는 계좌를 입력하세요","은행과 계좌번호를 확인합니다.","실제 계좌번호 대신 연습용 번호를 사용합니다."],["송금할 금액을 입력하세요","보낼 금액을 숫자로 입력합니다.","0을 너무 많이 누르지 않았는지 확인하세요."],["받는 사람을 확인하세요","계좌 주인의 이름이 맞는지 확인합니다.","이름이 다르면 송금하지 말고 취소해야 합니다."],["최종 내용을 확인하세요","받는 사람과 금액을 다시 확인한 뒤 송금합니다.","송금 전 두 번 확인하는 습관이 중요합니다."]], render: renderBank };
  }
  function renderBank(){
    if(state.step===0){ frame.innerHTML=phone(`<div class="bank-header"><strong>안심은행</strong><div class="bank-balance"><small>입출금 계좌</small><br><strong style="font-size:1.45rem">2,350,000원</strong></div></div><div class="bank-form"><button class="primary" style="width:100%" data-action="next">이체하기</button><div class="summary-card"><div class="summary-row"><span>최근 거래</span><strong>생활비 입금</strong></div><div class="summary-row"><span>자동이체</span><strong>3건</strong></div></div></div>`); return; }
    if(state.step===1){ frame.innerHTML=phone(`<div class="sim-topbar"><span>←</span><strong>받는 분</strong><span></span></div><div class="bank-form"><div class="form-field"><label>은행 선택</label><select id="bankName"><option>안심은행</option><option>대한은행</option><option>국민생활은행</option></select></div><div class="form-field" style="margin-top:15px"><label>계좌번호</label><input id="accountNo" inputmode="numeric" value="123456789012"></div><button class="primary" style="width:100%;margin-top:20px" data-action="bank-account">확인</button></div>`); return; }
    if(state.step===2){ frame.innerHTML=phone(`<div class="sim-topbar"><span>←</span><strong>금액 입력</strong><span></span></div><div class="bank-form"><div class="form-field"><label>송금할 금액</label><input id="bankAmount" inputmode="numeric" placeholder="0원" value="50000"></div></div><div class="bank-keypad">${[1,2,3,4,5,6,7,8,9,"00",0,"←"].map(x=>`<button data-key="${x}">${x}</button>`).join("")}</div><div style="padding:0 20px 20px"><button class="primary" style="width:100%" data-action="bank-amount">다음</button></div>`); return; }
    if(state.step===3){ frame.innerHTML=phone(`<div class="sim-topbar"><span>←</span><strong>받는 분 확인</strong><span></span></div><div class="bank-form"><div style="text-align:center;padding:30px 0"><div class="chat-avatar" style="margin:auto">김</div><h3>김안심 님</h3><p>${esc(state.data.bank)} ${esc(state.data.account)}</p></div><button class="primary" style="width:100%" data-action="next">이 사람이 맞습니다</button><button class="secondary" style="width:100%;margin-top:10px" data-action="reset-practice">다시 입력</button></div>`); return; }
    frame.innerHTML=phone(`<div class="sim-topbar"><span>←</span><strong>이체 확인</strong><span></span></div><div class="bank-form"><div class="summary-card"><div class="summary-row"><span>받는 분</span><strong>김안심</strong></div><div class="summary-row"><span>계좌</span><strong>${esc(state.data.bank)} ${esc(state.data.account)}</strong></div><div class="summary-row"><span>보낼 금액</span><strong>${money(state.data.amount)}</strong></div><div class="summary-row"><span>수수료</span><strong>0원</strong></div></div><button class="primary" style="width:100%;margin-top:20px" data-action="complete-now">송금 연습 완료</button></div>`);
  }

  function atmFlow(){ return { title:"ATM 현금 찾기", category:"금융", steps:5, coach:[["카드를 넣으세요","카드 투입구를 눌러 카드를 넣는 동작을 연습합니다.","카드 방향 안내를 확인하세요."],["출금을 선택하세요","화면에서 예금출금 또는 현금찾기를 선택합니다.","입금이 아니라 출금 버튼을 누르세요."],["비밀번호를 입력하세요","숫자 4자리를 입력하는 순서를 연습합니다.","실전에서는 주변 사람이 보지 못하도록 손으로 가립니다."],["금액을 선택하세요","찾을 금액을 선택합니다.","잔액보다 큰 금액을 선택하지 않습니다."],["현금과 카드를 챙기세요","현금·카드·명세표를 모두 확인합니다.","카드를 두고 가지 않도록 가장 먼저 챙기세요."]], render(){
      if(state.step===0) return frame.innerHTML=atmPage("카드를 넣어 주세요",`<button class="metro-slot" data-action="next">카드 투입구<br>여기를 누르세요</button>`);
      if(state.step===1) return frame.innerHTML=atmPage("원하는 거래를 선택하세요",`<div class="option-grid"><button class="option-button" data-action="next"><strong>예금 출금</strong><span>통장에서 현금을 찾습니다</span></button><button class="option-button" data-wrong="입금이 아닌 출금을 선택해 주세요"><strong>예금 입금</strong><span>현금을 통장에 넣습니다</span></button></div>`);
      if(state.step===2) return frame.innerHTML=atmPage("비밀번호 4자리를 입력해 주세요",`<div class="bank-keypad">${[1,2,3,4,5,6,7,8,9,"취소",0,"확인"].map(x=>`<button data-atm-pin="${x}">${x}</button>`).join("")}</div>`);
      if(state.step===3) return frame.innerHTML=atmPage("찾을 금액을 선택해 주세요",optionButtons([["10,000원","만원권 1장"],["50,000원","오만원"],["100,000원","십만원"]],"atm-amount"));
      return frame.innerHTML=atmPage("현금과 카드를 모두 챙겨 주세요",`<div style="display:flex;justify-content:center;gap:30px;font-size:4rem;margin:45px 0">💳 💵</div><button class="primary" data-action="complete-now">모두 챙겼습니다</button>`);
    }}; }

  function chatFlow(){ return { title:"메시지 보내기", category:"연락", steps:4, coach:[["대화방을 확인하세요","연락할 사람의 이름을 확인합니다.","다른 사람에게 잘못 보내지 않도록 이름을 먼저 봅니다."],["메시지를 입력하세요","아래 입력칸에 보낼 말을 적습니다.","짧고 간단한 문장으로 시작해 보세요."],["전송 버튼을 누르세요","입력한 내용을 확인하고 보내기를 누릅니다.","오타가 없는지 확인하세요."],["사진 보내기를 연습하세요","더하기 버튼을 눌러 사진 메뉴를 선택합니다.","연습용 사진만 전송됩니다."]], render(){
      const msgs=state.data.messages||[];
      if(state.step===0) return frame.innerHTML=phone(`<div class="chat-header"><div class="chat-avatar">딸</div><strong>김다인</strong><button style="margin-left:auto;border:0;background:transparent" data-action="next">대화 시작</button></div><div class="chat-body"><div class="message">아버지, 오늘 저녁에 전화드릴게요.</div></div>`);
      if(state.step<=2) return frame.innerHTML=phone(`<div class="chat-header"><div class="chat-avatar">딸</div><strong>김다인</strong></div><div class="chat-body"><div class="message">아버지, 오늘 저녁에 전화드릴게요.</div>${msgs.map(m=>`<div class="message mine">${esc(m)}</div>`).join("")}</div><div class="chat-input"><button data-wrong="먼저 글을 입력해 주세요">＋</button><input id="chatText" placeholder="메시지를 입력하세요" value="${esc(state.data.draft||"")}"><button data-action="chat-send">전송</button></div>`);
      return frame.innerHTML=phone(`<div class="chat-header"><div class="chat-avatar">딸</div><strong>김다인</strong></div><div class="chat-body"><div class="message">사진을 보내보세요.</div><div class="message mine">안녕, 잘 지내지?</div></div><div class="chat-input"><button data-action="chat-photo">＋</button><input disabled placeholder="사진 메뉴를 열어보세요"><button disabled>전송</button></div>`);
    }}; }

  function videoFlow(){ return { title:"영상통화", category:"연락", steps:4, coach:[["영상통화 버튼을 누르세요","연락처 화면에서 영상통화 아이콘을 누릅니다.","카메라 모양 버튼을 찾아보세요."],["통화 연결을 기다리세요","상대방이 받을 때까지 기다립니다.","연결 중에는 다시 여러 번 누르지 않습니다."],["마이크와 카메라를 조절하세요","필요하면 음소거 또는 카메라 끄기를 사용합니다.","버튼이 빨간색이면 꺼진 상태입니다."],["통화를 종료하세요","빨간 종료 버튼을 눌러 통화를 마칩니다.","통화가 끝났는지 화면을 확인하세요."]], render(){
      if(state.step===0) return frame.innerHTML=phone(`<div class="sim-topbar light"><span>연락처</span><strong>김다인</strong><span></span></div><div style="text-align:center;padding:45px 20px"><div class="video-person" style="margin:auto">딸</div><h3>김다인</h3><div style="display:flex;justify-content:center;gap:18px;margin-top:30px"><button class="secondary">전화</button><button class="primary" data-action="next">영상통화</button></div></div>`);
      if(state.step===1) return frame.innerHTML=`<div class="video-stage"><div><div class="video-person">딸</div><p style="text-align:center">연결 중...</p><button class="primary" data-action="next">상대방이 받았습니다</button></div></div>`;
      if(state.step===2) return frame.innerHTML=videoStage(false);
      return frame.innerHTML=videoStage(true);
    }}; }

  function shoppingFlow(delivery){
    const title=delivery?"배달 음식 주문":"온라인 물건 주문";
    const products=delivery?[{name:"김치찌개",price:9500,icon:"🍲"},{name:"돈가스",price:11000,icon:"🍛"},{name:"비빔밥",price:9000,icon:"🍚"}]:[{name:"세제",price:12900,icon:"🧴"},{name:"휴지",price:15900,icon:"🧻"},{name:"생수",price:8900,icon:"💧"}];
    return {title, category:"생활", steps:5, coach:[["상품을 선택하세요",delivery?"먹고 싶은 메뉴를 선택합니다.":"필요한 상품을 선택합니다.","사진·이름·가격을 함께 확인하세요."],["수량을 선택하세요","필요한 수량을 선택합니다.","처음에는 1개로 선택해 보세요."],["배송지를 확인하세요","배달 또는 배송받을 주소를 확인합니다.","동·호수까지 맞는지 확인하세요."],["결제 방법을 선택하세요","카드 또는 만나서 결제를 선택합니다.","실전에서는 저장된 카드가 본인 카드인지 확인합니다."],["주문 내용을 확인하세요","상품·수량·주소·총금액을 최종 확인합니다.","주문 버튼을 누르기 전에 주소를 다시 확인하세요."]], render(){
      if(state.step===0) return frame.innerHTML=simPage(title,delivery?"메뉴를 선택해 주세요":"상품을 선택해 주세요",`<div class="product-grid">${products.map(p=>`<button class="product-card" data-product='${JSON.stringify(p)}'><div class="product-image">${p.icon}</div><div><strong>${p.name}</strong><span>${money(p.price)}</span></div></button>`).join("")}</div>`);
      if(state.step===1) return frame.innerHTML=simPage("수량 선택","몇 개 주문하시겠어요?",optionButtons([["1개","기본 수량"],["2개","두 개 주문"],["3개","세 개 주문"]],"quantity"));
      if(state.step===2) return frame.innerHTML=simPage("주소 확인",delivery?"배달받을 주소를 확인해 주세요":"배송받을 주소를 확인해 주세요",`<div class="form-grid"><div class="form-field full"><label>주소</label><input id="addressInput" value="경기도 고양시 일산동구 연습로 10, 101동 1001호"></div></div>`,`<button class="primary" data-action="address-save">이 주소가 맞습니다</button>`);
      if(state.step===3) return frame.innerHTML=simPage("결제 방법","결제 방법을 선택해 주세요",optionButtons([["등록 카드","앱에 저장된 카드"],[delivery?"만나서 카드 결제":"계좌이체",delivery?"배달받을 때 결제":"은행 앱으로 결제"]],"shop-payment"));
      const p=state.data.product||{name:"상품",price:0}; const qty=Number((state.data.quantity||"1").replace(/\D/g,""))||1;
      return frame.innerHTML=simPage("주문 확인","주문 내용을 최종 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>${delivery?"메뉴":"상품"}</span><strong>${esc(p.name)}</strong></div><div class="summary-row"><span>수량</span><strong>${qty}개</strong></div><div class="summary-row"><span>주소</span><strong>${esc(state.data.address)}</strong></div><div class="summary-row"><span>결제</span><strong>${esc(state.data.payment)}</strong></div><div class="summary-row"><span>총금액</span><strong>${money(p.price*qty)}</strong></div></div>`,`<button class="primary" data-action="complete-now">주문 연습 완료</button>`);
    }};
  }

  function serviceKioskFlow(title,category,options,prompt,receiptLabel){
    return { title, category, steps:4, coach:[[prompt,"화면에서 필요한 항목을 선택합니다.","어떤 업무를 보러 왔는지 생각해 보세요."],["본인 확인 방법을 선택하세요","신분증 또는 휴대전화 인증을 선택합니다.","연습에서는 실제 개인정보를 입력하지 않습니다."],["신청 내용을 확인하세요","선택한 업무가 맞는지 확인합니다.","잘못 선택했다면 이전 화면으로 돌아갑니다."],["출력물을 받으세요","출력구를 눌러 접수표 또는 서류를 받습니다.","출력물이 모두 나올 때까지 기다립니다."]], render(){
      if(state.step===0) return frame.innerHTML=simPage(title,prompt,`<div class="option-grid">${options.map(o=>`<button class="option-button" data-service="${o}"><strong>${o}</strong><span>선택하려면 누르세요</span></button>`).join("")}</div>`);
      if(state.step===1) return frame.innerHTML=simPage("본인 확인","본인 확인 방법을 선택해 주세요",optionButtons([["신분증 확인","주민등록증 또는 운전면허증"],["휴대전화 인증","본인 명의 휴대전화"]],"service-auth"));
      if(state.step===2) return frame.innerHTML=simPage("신청 확인","선택한 내용을 확인해 주세요",`<div class="summary-card"><div class="summary-row"><span>신청 업무</span><strong>${esc(state.data.service)}</strong></div><div class="summary-row"><span>본인 확인</span><strong>${esc(state.data.auth)}</strong></div><div class="summary-row"><span>수수료</span><strong>${category==="공공"?"400원":"없음"}</strong></div></div>`,`<button class="primary" data-action="next">신청하기</button>`);
      return frame.innerHTML=atmPage(`${receiptLabel}가 나왔습니다`,`<div style="font-size:5rem;margin:35px 0">📄</div><button class="primary" data-action="complete-now">출력물을 받았습니다</button>`);
    }};
  }

  function simPage(brand,title,body,actions=""){
    return `<div><div class="sim-topbar"><span class="sim-brand">${brand}</span><span>교육용 모의 화면</span></div><div class="sim-body"><h3 class="sim-title">${title}</h3><p class="sim-subtitle">화면의 내용을 천천히 읽고 선택해 주세요.</p>${body}</div>${actions?`<div class="bottom-action-bar">${actions}</div>`:""}</div>`;
  }
  function phone(inner){ return `<div class="phone-shell"><div class="phone-notch"></div><div class="phone-screen">${inner}</div></div>`; }
  function optionButtons(opts,key){ return `<div class="option-grid">${opts.map(o=>`<button class="option-button" data-choice="${key}" data-value="${o[0]}"><strong>${o[0]}</strong><span>${o[1]}</span></button>`).join("")}</div>`; }
  function calendarPage(title){ const days=Array.from({length:28},(_,i)=>i+1); return simPage(title,"날짜를 선택해 주세요",`<div class="calendar-grid">${["일","월","화","수","목","금","토"].map(x=>`<strong style="text-align:center">${x}</strong>`).join("")}${days.map(d=>`<button data-date="7월 ${d}일">${d}</button>`).join("")}</div>`); }
  function seatPage(){ return simPage("좌석 선택","원하는 좌석을 선택해 주세요",`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:25px">${["1A","1B","1C","1D","2A","2B","2C","2D","3A","3B","3C","3D"].map((s,i)=>`<button class="option-button" style="min-height:74px" ${[1,6,9].includes(i)?"disabled":""} data-seat="${s}">${s}${[1,6,9].includes(i)?"<br><small>선택됨</small>":""}</button>`).join("")}</div>`); }
  function atmPage(title,body){ return `<div class="metro-shell"><div class="metro-machine"><div class="metro-screen"><div class="metro-header"><strong>안심 ATM</strong><span>교육용</span></div><div class="sim-body" style="text-align:center"><h3 class="sim-title">${title}</h3>${body}</div></div><div class="metro-bottom"><div class="metro-slot">현금 출금구</div><div class="metro-slot">카드 투입구</div></div></div></div>`; }
  function videoStage(end){ return `<div class="video-stage"><div class="video-person">딸</div><div class="video-self">나</div><div class="video-controls"><button data-toggle="mic">마이크</button><button data-toggle="cam">카메라</button><button class="off" data-action="${end?"complete-now":"next"}">${end?"종료":"다음"}</button></div></div>`; }

  document.addEventListener("click", e => {
    const t=e.target.closest("button"); if(!t) return;
    if(t.dataset.practice) return startPractice(t.dataset.practice);
    const a=t.dataset.action;
    if(a==="go-home"){ state.current=null; practiceView.classList.add("hidden"); homeView.classList.remove("hidden"); window.scrollTo({top:0,behavior:"smooth"}); return; }
    if(a==="reset-practice") return startPractice(state.current);
    if(a==="repeat") return startPractice(state.current);
    if(a==="next") return next();
    if(a==="complete-now" || a==="finish-card") return complete();
    if(a==="hint"){ state.hints++; $("#hintCount").textContent=state.hints; $("#hintBox").classList.remove("hidden"); return; }
    if(a==="speak-step"){ const flow=flows[state.current], c=flow.coach[state.step]; speak(`${c[0]}. ${c[1]}`); return; }
    if(a==="speak-screen"){ speak(practiceView.classList.contains("hidden") ? "생활 속 디지털 연습을 선택하세요." : `${$("#practiceTitle").textContent}. ${$("#coachTitle").textContent}. ${$("#coachText").textContent}`); return; }
    if(a==="font-up" || a==="font-down"){ state.fontSize=Math.max(16,Math.min(23,state.fontSize+(a==="font-up"?1:-1))); document.documentElement.style.setProperty("--base-size",`${state.fontSize}px`); showToast(`글자 크기 ${state.fontSize}`); return; }
    if(a==="toggle-contrast"){ document.body.classList.toggle("high-contrast"); return; }
    if(t.dataset.wrong) return mistake(t.dataset.wrong);

    if(t.dataset.set){ state.data[t.dataset.set]=t.dataset.value; next(); return; }
    if(t.dataset.addItem){ const i=JSON.parse(t.dataset.addItem); state.data.cart=state.data.cart||[]; state.data.cart.push(i); if(state.step===1) state.step=2; renderCurrent(); return; }
    if(t.dataset.removeItem!==undefined){ state.data.cart.splice(Number(t.dataset.removeItem),1); renderCurrent(); return; }
    if(a==="restaurant-order"){ if(!(state.data.cart||[]).length) return mistake("메뉴를 먼저 선택해 주세요."); state.step=3; renderCurrent(); return; }
    if(t.dataset.cafeDrink){ state.data.drink=JSON.parse(t.dataset.cafeDrink); next(); return; }
    if(t.dataset.choice){ const map={"cafe-temp":"temp","cafe-size":"size","cafe-extra":"extra","metro-people":"people","metro-payment":"payment","atm-amount":"amount","quantity":"quantity","service-auth":"auth","shop-payment":"payment"}; state.data[map[t.dataset.choice]||t.dataset.choice]=t.dataset.value; next(); return; }
    if(t.dataset.station){ if(t.dataset.station==="서울역") return mistake("출발역과 같은 역입니다. 다른 목적지를 선택해 주세요."); state.data.station=t.dataset.station; next(); return; }
    if(t.dataset.date){ state.data.date=t.dataset.date; next(); return; }
    if(t.dataset.time){ state.data.time=t.dataset.time; next(); return; }
    if(t.dataset.seat){ state.data.seat=t.dataset.seat; next(); return; }
    if(a==="booking-route"){ state.data.from=$("#fromSel").value; state.data.to=$("#toSel").value; if(state.data.from===state.data.to) return mistake("출발지와 도착지는 달라야 합니다."); next(); return; }
    if(a==="hotel-city"){ state.data.city=$("#hotelCity").value; next(); return; }
    if(t.dataset.room){ state.data.room=t.dataset.room; next(); return; }
    if(a==="hotel-guest"){ state.data.guest=$("#guestName").value.trim(); if(!state.data.guest) return mistake("예약자 이름을 입력해 주세요."); next(); return; }
    if(a==="bank-account"){ state.data.bank=$("#bankName").value; state.data.account=$("#accountNo").value.trim(); if(state.data.account.length<8) return mistake("계좌번호를 다시 확인해 주세요."); next(); return; }
    if(a==="bank-amount"){ state.data.amount=Number($("#bankAmount").value.replace(/\D/g,"")); if(!state.data.amount) return mistake("보낼 금액을 입력해 주세요."); next(); return; }
    if(t.dataset.key){ const input=$("#bankAmount"); if(!input) return; if(t.dataset.key==="←") input.value=input.value.slice(0,-1); else input.value+=t.dataset.key; return; }
    if(t.dataset.atmPin){ state.data.pin=(state.data.pin||""); if(t.dataset.atmPin==="확인"){ if(state.data.pin.length<4) return mistake("비밀번호 숫자 4개를 입력해 주세요."); next(); } else if(t.dataset.atmPin!=="취소" && state.data.pin.length<4){ state.data.pin+=t.dataset.atmPin; showToast("●".repeat(state.data.pin.length)); } return; }
    if(a==="chat-send"){ const v=$("#chatText").value.trim(); if(!v) return mistake("보낼 글을 먼저 입력해 주세요."); state.data.messages=state.data.messages||[]; state.data.messages.push(v); next(); return; }
    if(a==="chat-photo"){ showToast("사진 메뉴를 열었습니다."); setTimeout(()=>complete(),700); return; }
    if(t.dataset.toggle){ t.classList.toggle("off"); showToast(`${t.dataset.toggle==="mic"?"마이크":"카메라"} ${t.classList.contains("off")?"꺼짐":"켜짐"}`); return; }
    if(t.dataset.product){ state.data.product=JSON.parse(t.dataset.product); next(); return; }
    if(a==="address-save"){ state.data.address=$("#addressInput").value.trim(); if(!state.data.address) return mistake("주소를 입력해 주세요."); next(); return; }
    if(t.dataset.service){ state.data.service=t.dataset.service; next(); return; }
  });

  $("#practiceSearch").addEventListener("input", e=>renderCards(e.target.value));
  renderCards();
})();
