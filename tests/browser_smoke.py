"""Browser rendering uses an in-memory FastAPI TestClient bridge, no network."""
from pathlib import Path
import sys,json,re,base64,os
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R))
from fastapi.testclient import TestClient
from app.main import create_app
from app.config import Settings
from playwright.sync_api import sync_playwright
O=R/'test-results'/'ui';O.mkdir(parents=True,exist_ok=True)
report={'transport':'Browser DOM + in-memory FastAPI TestClient, no external network','viewports':[],'errors':[],'checks':0}
mark='data:image/svg+xml;base64,'+base64.b64encode((R/'static/mark.svg').read_bytes()).decode()
html=(R/'static/index.html').read_text();html=re.sub(r'<link[^>]+>','',html);html=re.sub(r'<script.*?</script>','',html);html=html.replace('/static/mark.svg',mark)
js=(R/'static/app.js').read_text().replace('/static/mark.svg',mark)
conf=Settings(deployment='local',database=R/'data/knowledge.sqlite',api_key='',supabase_url='',supabase_key='',encryption_key='')
with sync_playwright() as p:
 options={'headless':True}
 if os.getenv('CHROMIUM_PATH'):options['executable_path']=os.environ['CHROMIUM_PATH']
 browser=p.chromium.launch(**options)
 for width,height in [(1440,1000),(1024,768),(768,1024),(390,844),(360,800)]:
  with TestClient(create_app(conf)) as client:
   page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
   page.on('pageerror',lambda e:(report['errors'].append(str(e)),print('PAGEERROR',e)))
   def call(payload):
    res=client.request(payload.get('method','GET'),payload['path'],headers=payload.get('headers',{}),content=payload.get('body'))
    return {'status':res.status_code,'body':res.text}
   page.expose_function('_medi_test_api',call)
   page.set_content(html)
   page.add_style_tag(content=(R/'static/app.css').read_text())
   page.add_script_tag(content="window.fetch=async (path,opt={})=>{const r=await window._medi_test_api({path,method:opt.method||'GET',headers:opt.headers||{},body:opt.body});return new Response(r.body,{status:r.status,headers:{'Content-Type':'application/json'}})};")
   page.add_script_tag(content=js)
   page.wait_for_function("document.getElementById('docCount').textContent.includes('67,485')")
   assert page.locator('#connection').inner_text()=='AI \ubbf8\uc5f0\uacb0';report['checks']+=1
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');report['checks']+=1
   page.wait_for_timeout(350)
   if width<861:assert page.locator('#sidebar').bounding_box()['x']+page.locator('#sidebar').bounding_box()['width']<1
   page.screenshot(path=str(O/f'home_{width}.png'),full_page=True)
   page.locator('#question').fill('\ucc9c\uc2dd\uc758 \ubcd1\ud0dc\uc0dd\ub9ac\ub97c \uc124\uba85\ud574 \uc8fc\uc138\uc694.')
   page.locator('#sendButton').click();page.locator('#consentDialog').wait_for(state='visible')
   page.locator('#consentCheck').check();page.locator('#acceptConsent').click()
   try: page.wait_for_function("document.querySelector('.assistant-message') !== null",timeout=6000)
   except Exception:
    page.screenshot(path=str(O/'failed.png'));print(page.locator('body').inner_text()[-1800:]);raise
   assert '\uac80\uc0c9 \uccb4\ud5d8' in page.locator('.assistant-message').inner_text();report['checks']+=1
   assert page.locator('.source-item').count()>0;report['checks']+=1
   page.locator('.source-list>summary').click();page.locator('.source-item>summary').first.click()
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth');report['checks']+=1
   page.screenshot(path=str(O/f'chat_{width}.png'),full_page=True)
   page.locator('.turn-action').filter(has_text='\ud53c\ub4dc\ubc31').click();page.locator('#feedbackDialog').wait_for(state='visible')
   assert not page.locator('#feedbackConsent').is_checked();assert not page.locator('#deidentified').is_checked();report['checks']+=2
   page.locator('[data-close="feedbackDialog"]').click()
   if width<861:
    page.locator('#menuButton').click();assert page.locator('#sidebar').evaluate("el=>el.classList.contains('open')");report['checks']+=1
   page.locator('#dataInfo').click();page.locator('#infoDialog').wait_for(state='visible');assert '200,492' in page.locator('#infoBody').inner_text();report['checks']+=1
   page.locator('[data-close="infoDialog"]').first.click();page.keyboard.press('Escape')
   report['viewports'].append({'width':width,'height':height,'ok':True});page.close()
 browser.close()
(O/'results.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
