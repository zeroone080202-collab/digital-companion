(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const home = $('#home');
  const practice = $('#practice');
  const sim = $('#simulator');
  const toastEl = $('#toast');
  const state = { mode:null, step:0, mistakes:0, hints:0, font:18, data:{} };

  const flows = {
    ktx:{
      category:'철도 승차권 예매 연습', title:'KTX 승차권 예매',
      guides:[
        ['출발역과 도착역 선택','출발역과 도착역을 확인한 뒤 날짜와 시간을 선택하세요.','파란색 조회 버튼을 누르기 전 출발역과 도착역이 서로 다른지 확인하세요.'],
        ['열차 선택','조회된 열차 중 원하는 출발시간의 예약 버튼을 누르세요.','출발시간과 도착시간, 일반실 운임을 함께 확인하세요.'],
        ['좌석 선택','호차를 확인하고 회색이 아닌 좌석을 선택하세요.','창가 좌석은 A 또는 D입니다. 회색 좌석은 이미 예약된 좌석입니다.'],
        ['예약 내용 확인','구간, 날짜, 열차, 호차, 좌석을 다시 확인하세요.','틀린 내용이 있으면 처음부터 버튼으로 다시 연습할 수 있습니다.'],
        ['승차권 확인','모의 모바일 승차권에서 출발역·시간·좌석을 확인하세요.','실제 탑승 전에도 같은 항목을 반드시 확인하세요.']
      ]
    },
    metro:{
      category:'역사 발매기 연습', title:'서울 지하철 1회용 교통카드',
      guides:[
        ['1회용 교통카드 선택','발매기 첫 화면에서 1회용 교통카드 메뉴를 누르세요.','화면 왼쪽의 파란색 1회용 교통카드 버튼을 찾으세요.'],
        ['도착역 선택','목적지 역명을 검색하거나 화면의 역 버튼을 누르세요.','이번 연습에서는 강남역을 선택합니다.'],
        ['이용 인원 선택','성인 1명을 선택하세요.','성인 1명 버튼을 누르세요.'],
        ['운임 확인','운임과 1회용 카드 보증금 500원을 확인하세요.','총 결제금액을 읽은 뒤 확인 버튼을 누르세요.'],
        ['결제 방법 선택','현금 또는 카드 결제 방법을 선택하세요.','실제 기기에서는 지원하는 결제 방식이 기기마다 다를 수 있습니다.'],
        ['카드 받기','발급구에서 나온 1회용 교통카드를 받으세요.','화면 아래 카드 발급구 위치를 확인하세요.'],
        ['개찰구 통과','개찰구 단말기에 카드 한 장을 대세요.','교통카드 표시가 있는 단말기에 한 장만 접촉하세요.'],
        ['보증금 환급','도착역 환급기에 카드를 넣고 보증금을 받으세요.','1회용 카드는 버리지 말고 환급기에 넣으세요.']
      ]
    },
    gtx:{
      category:'GTX-A 이용 연습', title:'GTX-A 1회용 교통카드 이용',
      guides:[
        ['1회용 교통카드 선택','발매기에서 1회용 교통카드 메뉴를 선택하세요.','GTX-A도 좌석 예약이 아니라 교통카드 방식입니다.'],
        ['도착역 선택','운정중앙에서 서울역으로 이동하도록 서울역을 선택하세요.','서울역 버튼을 누르세요.'],
        ['이용 인원 선택','성인 1명을 선택하세요.','성인 1명 버튼을 누르세요.'],
        ['운임 확인','구간 운임과 보증금 500원을 확인하세요.','운정중앙~서울역 성인 평일 운임을 확인하세요.'],
        ['결제 방법 선택','현금 또는 카드 결제를 선택하세요.','실제 기기 지원 방식은 역사별 기기에 따라 다를 수 있습니다.'],
        ['카드 받기','발급구에서 1회용 교통카드를 받으세요.','카드를 두고 가지 않도록 발급구를 확인하세요.'],
        ['개찰구 통과','단말기에 카드 한 장을 접촉하세요.','여러 장을 겹쳐 대지 마세요.'],
        ['보증금 환급','하차 후 환급기에 카드를 넣으세요.','카드가 훼손되면 보증금을 돌려받지 못할 수 있습니다.']
      ]
    }
  };

  function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
  function money(n){return Number(n).toLocaleString('ko-KR')+'원'}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1900)}
  function speak(text){if(!('speechSynthesis' in window))return toast('이 브라우저는 음성 안내를 지원하지 않습니다.');speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ko-KR';u.rate=.84;speechSynthesis.speak(u)}
  function mistake(msg){state.mistakes++;$('#mistakes').textContent=state.mistakes;toast(msg)}
  function currentFlow(){return flows[state.mode]}
  function updateGuide(){const f=currentFlow(), g=f.guides[state.step];$('#practice-category').textContent=f.category;$('#practice-title').textContent=f.title;$('#guide-title').textContent=g[0];$('#guide-text').textContent=g[1];$('#hint-box').textContent=g[2];$('#hint-box').classList.add('hidden');$('#mistakes').textContent=state.mistakes;$('#hints').textContent=state.hints;const pct=((state.step+1)/f.guides.length)*100;$('#progress-bar').style.width=pct+'%';$('#progress-text').textContent=`${state.step+1}단계 / ${f.guides.length}단계`}
  function start(mode){state.mode=mode;state.step=0;state.mistakes=0;state.hints=0;state.data={};home.classList.add('hidden');practice.classList.remove('hidden');render();window.scrollTo({top:0,behavior:'smooth'})}
  function next(){const max=currentFlow().guides.length-1;if(state.step<max){state.step++;render()}else complete()}
  function complete(){toast('연습을 완료했습니다.');setTimeout(()=>{practice.classList.add('hidden');home.classList.remove('hidden');state.mode=null;window.scrollTo({top:0,behavior:'smooth'})},1000)}
  function render(){updateGuide();if(state.mode==='ktx')renderKtx();else renderMachine(state.mode==='gtx')}

  function railShell(body, active='승차권 예매'){
    return `<div class="rail-window">
      <div class="rail-brandbar"><div class="rail-brand"><i></i><span>코레일 연습</span></div><div class="rail-util"><span>로그인</span><span>승차권 확인</span><span>고객센터</span></div></div>
      <div class="rail-nav"><span class="${active==='승차권 예매'?'active':''}">승차권 예매</span><span>승차권 확인</span><span>예약승차권 조회/취소</span><span>고객센터</span></div>
      <div class="rail-body">${body}</div>
    </div>`
  }

  function renderKtx(){
    if(state.step===0){
      const today=new Date();today.setDate(today.getDate()+1);const d=today.toISOString().slice(0,10);
      sim.innerHTML=railShell(`<h3 class="rail-title">승차권 예매</h3><p class="rail-sub">출발역과 도착역, 날짜와 시간을 선택하세요.</p>
        <div class="booking-box">
          <div class="booking-row"><div class="booking-label">여정</div><div class="booking-control"><div class="station-select">
            <div class="station-field"><label>출발</label><select id="from"><option>서울</option><option>용산</option><option>광명</option><option>대전</option><option>동대구</option><option>부산</option></select></div>
            <button class="swap-btn" data-action="swap">⇄</button>
            <div class="station-field"><label>도착</label><select id="to"><option>부산</option><option>동대구</option><option>대전</option><option>광명</option><option>용산</option><option>서울</option></select></div>
          </div></div></div>
          <div class="booking-row"><div class="booking-label">출발일시</div><div class="booking-control"><div class="date-time-grid"><input id="date" type="date" value="${d}"><select id="hour"><option>06시 이후</option><option>08시 이후</option><option>10시 이후</option><option>12시 이후</option></select><select id="people"><option>어른 1명</option><option>어른 2명</option></select></div></div></div>
          <div class="booking-row"><div class="booking-label">열차 종류</div><div class="booking-control"><label><input type="radio" checked> KTX·KTX-산천</label>&nbsp;&nbsp;<label><input type="radio"> 전체 열차</label></div></div>
        </div><div class="rail-actions"><button class="primary" data-action="ktx-search">조회하기</button></div>`);return;
    }
    if(state.step===1){
      const trains=[['KTX 101','07:27','10:03','2시간 36분','59,800'],['KTX 117','09:58','12:41','2시간 43분','59,800'],['KTX 123','11:00','13:38','2시간 38분','59,800'],['KTX 135','13:47','16:25','2시간 38분','59,800']];
      sim.innerHTML=railShell(`<h3 class="rail-title">열차 조회 결과</h3><p class="rail-sub">원하는 열차의 예약 버튼을 누르세요.</p><table class="train-list"><thead><tr><th>열차</th><th>출발</th><th>도착</th><th>소요시간</th><th>일반실</th><th>예약</th></tr></thead><tbody>${trains.map(r=>`<tr><td><strong>${r[0]}</strong></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}원</td><td><button class="reserve-btn" data-train='${JSON.stringify({no:r[0],dep:r[1],arr:r[2],duration:r[3],fare:r[4]})}'>예약</button></td></tr>`).join('')}</tbody></table>`);return;
    }
    if(state.step===2){
      const occ=['1B','2C','3D','4A','5B','6C','7A'];
      sim.innerHTML=railShell(`<h3 class="rail-title">좌석 선택</h3><p class="rail-sub">원하는 호차와 좌석을 선택하세요.</p><div class="seat-page"><div class="car-tabs">${[1,2,3,4,5].map(n=>`<button class="${n===1?'active':''}" data-car="${n}">${n}호차</button>`).join('')}</div><div class="seat-map"><div class="train-direction">열차 진행 방향 →</div>${Array.from({length:8},(_,i)=>i+1).map(r=>`<div class="seat-row"><button class="seat window ${occ.includes(r+'A')?'occupied':''}" ${occ.includes(r+'A')?'disabled':''} data-seat="${r}A">${r}A</button><button class="seat ${occ.includes(r+'B')?'occupied':''}" ${occ.includes(r+'B')?'disabled':''} data-seat="${r}B">${r}B</button><span class="aisle">통로</span><button class="seat ${occ.includes(r+'C')?'occupied':''}" ${occ.includes(r+'C')?'disabled':''} data-seat="${r}C">${r}C</button><button class="seat window ${occ.includes(r+'D')?'occupied':''}" ${occ.includes(r+'D')?'disabled':''} data-seat="${r}D">${r}D</button></div>`).join('')}<div class="legend"><span><i></i>선택 가능</span><span><i class="l-selected"></i>선택 좌석</span><span><i class="l-occupied"></i>예약 완료</span></div></div></div>`);return;
    }
    if(state.step===3){
      const d=state.data;
      sim.innerHTML=railShell(`<h3 class="rail-title">예약 내용 확인</h3><p class="rail-sub">결제 전에 내용을 다시 확인하세요.</p><div class="summary-card"><div class="summary-line"><span>구간</span><strong>${escapeHtml(d.from)} → ${escapeHtml(d.to)}</strong></div><div class="summary-line"><span>출발일</span><strong>${escapeHtml(d.date)}</strong></div><div class="summary-line"><span>열차</span><strong>${escapeHtml(d.train.no)} · ${escapeHtml(d.train.dep)} 출발</strong></div><div class="summary-line"><span>좌석</span><strong>${d.car||1}호차 ${escapeHtml(d.seat)}</strong></div><div class="summary-line"><span>운임</span><strong>${d.train.fare}원</strong></div></div><div class="rail-actions"><button class="primary" data-action="next">모의 결제 완료</button></div>`);return;
    }
    const d=state.data;
    sim.innerHTML=railShell(`<div class="mobile-ticket"><div class="ticket-top"><strong>모바일 승차권</strong><span>교육용</span></div><div class="ticket-route"><strong>${escapeHtml(d.from)}</strong><i></i><strong>${escapeHtml(d.to)}</strong></div><div class="ticket-data"><div><small>출발일</small><strong>${escapeHtml(d.date)}</strong></div><div><small>열차</small><strong>${escapeHtml(d.train.no)}</strong></div><div><small>출발시간</small><strong>${escapeHtml(d.train.dep)}</strong></div><div><small>호차</small><strong>${d.car||1}호차</strong></div><div><small>좌석</small><strong>${escapeHtml(d.seat)}</strong></div><div><small>운임</small><strong>${d.train.fare}원</strong></div></div><div class="barcode"></div><div class="rail-actions" style="padding-bottom:22px"><button class="primary" data-action="finish">승차권 확인 완료</button></div></div>`);
  }

  function kioskShell(body,gtx){
    return `<div class="kiosk-room"><aside class="reference-card"><img src="assets/real-ticket-kiosk-reference.png" alt="실제 교통카드 키오스크 참고 사진"><p>제공된 실제 기기 사진을 참고한 교육용 모의 발매기입니다.</p></aside><div class="ticket-kiosk"><div class="kiosk-sign">${gtx?'GTX-A 교통카드 발매기':'교통카드 키오스크'}<small>TICKET KIOSK</small></div><div class="screen-bezel"><div class="ticket-screen"><div class="ticket-screen-head"><strong>${gtx?'GTX-A 1회용 교통카드':'서울 지하철 승차권 발매'}</strong><div class="language-row"><span>한국어</span><span>English</span><span>日本語</span><span>中文</span></div></div>${body}</div></div><div class="hardware-deck"><div class="hardware-module">교통카드 대는 곳<div class="hardware-slot"></div></div><div class="hardware-module">지폐·동전 투입구<div class="hardware-slot"></div></div><div class="hardware-module">신용카드 결제부<div class="hardware-slot"></div></div></div><div class="card-dispenser">1회용 교통카드 나오는 곳</div></div></div>`
  }

  function renderMachine(gtx){
    const stations=gtx?['서울역','연신내','대곡','킨텍스','운정중앙']:['강남','잠실','홍대입구','시청','종로3가','동대문','사당','신촌'];
    if(state.step===0){sim.innerHTML=kioskShell(`<div class="screen-content"><h3>원하시는 업무를 선택해 주세요</h3><div class="service-grid"><button class="service-btn blue" data-action="next"><span>🎫</span>1회용 교통카드</button><button class="service-btn purple" data-wrong="충전은 소지한 교통카드에 금액을 넣는 메뉴입니다."><span>💳</span>교통카드 충전</button><button class="service-btn green" data-wrong="우대용 교통카드는 별도 발급 조건이 필요합니다."><span>👤</span>우대용 교통카드</button><button class="service-btn cyan" data-wrong="정기권 메뉴가 아닙니다."><span>📅</span>정기권</button><button class="service-btn navy" data-wrong="이번 연습은 카드 환불이 아닙니다."><span>↩</span>카드 환불</button></div></div>`,gtx);return}
    if(state.step===1){sim.innerHTML=kioskShell(`<div class="screen-content"><h3>도착역을 선택해 주세요</h3><div class="station-tools"><input id="station-input" placeholder="역 이름을 입력하세요"><button data-action="station-search">검색</button></div><div class="station-buttons">${stations.map(s=>`<button data-station="${s}">${s}</button>`).join('')}</div><div class="screen-bottom"><button class="cancel-btn" data-action="restart">처음 화면</button></div></div>`,gtx);return}
    if(state.step===2){sim.innerHTML=kioskShell(`<div class="screen-content"><h3>이용 인원을 선택해 주세요</h3><div class="people-grid"><button class="large-choice" data-people="성인 1명"><strong>1</strong>성인 1명</button><button class="large-choice" data-people="성인 2명"><strong>2</strong>성인 2명</button><button class="large-choice" data-wrong="이번 연습은 성인 1명으로 진행합니다."><strong>어린이</strong>어린이</button><button class="large-choice" data-wrong="우대 대상자는 증빙 절차가 필요할 수 있습니다."><strong>우대</strong>우대용</button></div></div>`,gtx);return}
    if(state.step===3){
      const fare=gtx?4450:1550;state.data.fare=fare;
      sim.innerHTML=kioskShell(`<div class="screen-content"><h3>결제 금액을 확인해 주세요</h3><div class="fare-panel"><div class="fare-line"><span>출발역</span><strong>${gtx?'운정중앙':'서울역'}</strong></div><div class="fare-line"><span>도착역</span><strong>${escapeHtml(state.data.station)}</strong></div><div class="fare-line"><span>이용운임</span><strong>${money(fare)}</strong></div><div class="fare-line"><span>1회용 카드 보증금</span><strong>500원</strong></div><div class="fare-total"><span>총 결제금액</span><strong>${money(fare+500)}</strong></div></div><div class="screen-bottom"><button class="cancel-btn" data-action="restart">취소</button><button class="confirm-btn" data-action="next">확인</button></div></div>`,gtx);return;
    }
    if(state.step===4){sim.innerHTML=kioskShell(`<div class="screen-content"><h3>결제 방법을 선택해 주세요</h3><div class="payment-grid"><button class="large-choice" data-payment="현금"><strong>현금</strong>지폐 또는 동전 투입</button><button class="large-choice" data-payment="카드"><strong>카드</strong>신용·체크카드 결제</button></div><div class="screen-bottom"><button class="cancel-btn" data-action="restart">취소</button></div></div>`,gtx);return}
    if(state.step===5){sim.innerHTML=kioskShell(`<div class="screen-content" style="text-align:center"><h3>1회용 교통카드가 발급되었습니다</h3><p>기기 아래쪽 발급구에서 카드를 꺼내 주세요.</p><div class="issued-card">1회용 교통카드<br><small>교육용</small></div><div><button class="confirm-btn" data-action="next">카드를 받았습니다</button></div></div>`,gtx);return}
    if(state.step===6){sim.innerHTML=`<div class="gate-sim"><h3 class="gate-title">개찰구 통과 연습</h3><p style="text-align:center">오른쪽 단말기에 1회용 카드를 한 장만 대세요.</p><div class="gate-row"><div class="gate-unit"><div class="reader-pad">출구 방향</div></div><div class="gate-arrow">➜</div><div class="gate-unit"><div class="reader-pad"><button data-action="tap-card">교통카드<br>대는 곳</button></div></div></div></div>`;return}
    sim.innerHTML=`<div class="refund-box"><h3>보증금 환급기</h3><p>도착역에서 사용한 1회용 교통카드를 투입구에 넣으세요.</p><div class="issued-card">사용 완료 카드</div><div class="refund-slot"></div><button class="primary" data-action="refund">카드 넣기</button></div>`;
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.start)return start(b.dataset.start);
    const a=b.dataset.action;
    if(a==='home'){practice.classList.add('hidden');home.classList.remove('hidden');state.mode=null;return}
    if(a==='restart')return start(state.mode);
    if(a==='next')return next();
    if(a==='finish')return complete();
    if(a==='hint'){state.hints++;$('#hints').textContent=state.hints;$('#hint-box').classList.remove('hidden');return}
    if(a==='step-speak'){const g=currentFlow().guides[state.step];return speak(`${g[0]}. ${g[1]}`)}
    if(a==='speak'){return speak(practice.classList.contains('hidden')?'연습할 교통 서비스를 선택하세요.':`${$('#practice-title').textContent}. ${$('#guide-title').textContent}. ${$('#guide-text').textContent}`)}
    if(a==='font-plus'||a==='font-minus'){state.font=Math.max(16,Math.min(24,state.font+(a==='font-plus'?1:-1)));document.documentElement.style.setProperty('--base',state.font+'px');return toast('글자 크기를 조절했습니다.')}
    if(a==='contrast'){document.body.classList.toggle('contrast');return}
    if(b.dataset.wrong)return mistake(b.dataset.wrong);
    if(a==='swap'){const f=$('#from'),t=$('#to'),v=f.value;f.value=t.value;t.value=v;return}
    if(a==='ktx-search'){const from=$('#from').value,to=$('#to').value;if(from===to)return mistake('출발역과 도착역이 같습니다.');state.data.from=from;state.data.to=to;state.data.date=$('#date').value;return next()}
    if(b.dataset.train){state.data.train=JSON.parse(b.dataset.train);return next()}
    if(b.dataset.car){state.data.car=Number(b.dataset.car);document.querySelectorAll('.car-tabs button').forEach(x=>x.classList.toggle('active',x===b));return toast(`${state.data.car}호차를 선택했습니다.`)}
    if(b.dataset.seat){document.querySelectorAll('.seat').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');state.data.seat=b.dataset.seat;setTimeout(next,450);return}
    if(a==='station-search'){const v=$('#station-input').value.trim();const valid=state.mode==='gtx'?['서울역','연신내','대곡','킨텍스','운정중앙']:['강남','잠실','홍대입구','시청','종로3가','동대문','사당','신촌'];if(!v)return mistake('역 이름을 입력해 주세요.');if(!valid.includes(v))return mistake('화면에 표시된 역 중에서 선택해 주세요.');state.data.station=v;return next()}
    if(b.dataset.station){const target=state.mode==='gtx'?'서울역':'강남';if(b.dataset.station!==target)return mistake(`이번 연습에서는 ${target}을 선택해 주세요.`);state.data.station=b.dataset.station;return next()}
    if(b.dataset.people){if(b.dataset.people!=='성인 1명')return mistake('이번 연습은 성인 1명으로 진행합니다.');state.data.people=b.dataset.people;return next()}
    if(b.dataset.payment){state.data.payment=b.dataset.payment;return next()}
    if(a==='tap-card'){toast('삑! 카드가 정상적으로 인식되었습니다.');return setTimeout(next,700)}
    if(a==='refund'){toast('보증금 500원이 환급되었습니다.');return setTimeout(complete,900)}
  });
})();
