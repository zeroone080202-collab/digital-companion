import asyncio
import time
from collections import defaultdict, deque
from starlette.responses import JSONResponse
from urllib.parse import urlsplit

class BodyAndOriginGuard:
    def __init__(self, app, max_bytes=15*1024*1024):
        self.app=app; self.max_bytes=max_bytes; self.chat_gate=asyncio.Semaphore(2)
    async def __call__(self,scope,receive,send):
        if scope['type']=='http' and scope.get('path')=='/api/chat' and scope.get('method')=='POST':
            try:await asyncio.wait_for(self.chat_gate.acquire(),timeout=.1)
            except TimeoutError:
                return await JSONResponse({'error':'server_busy'},503)(scope,receive,send)
            try:return await self.handle(scope,receive,send)
            finally:self.chat_gate.release()
        return await self.handle(scope,receive,send)
    async def handle(self,scope,receive,send):
        if scope['type']!='http': return await self.app(scope,receive,send)
        headers={k.decode().lower():v.decode() for k,v in scope.get('headers',[])}
        method=scope['method']; body=None
        if method in {'POST','PUT','PATCH','DELETE'}:
            if headers.get('x-medi-client')!='web':
                return await JSONResponse({'error':'request_header_required'},403)(scope,receive,send)
            origin=headers.get('origin')
            if origin and (urlsplit(origin).netloc!=headers.get('host') or urlsplit(origin).scheme not in {'http','https'}):
                return await JSONResponse({'error':'origin_not_allowed'},403)(scope,receive,send)
            chunks=[]; size=0
            try:
                if int(headers.get('content-length','0'))>self.max_bytes:
                    return await JSONResponse({'error':'request_too_large'},413)(scope,receive,send)
            except ValueError: return await JSONResponse({'error':'invalid_length'},400)(scope,receive,send)
            while True:
                try:event=await asyncio.wait_for(receive(),timeout=15)
                except TimeoutError:return await JSONResponse({'error':'request_timeout'},408)(scope,receive,send)
                if event['type']=='http.disconnect': return
                block=event.get('body',b'');size+=len(block)
                if size>self.max_bytes:
                    return await JSONResponse({'error':'request_too_large'},413)(scope,receive,send)
                chunks.append(block)
                if not event.get('more_body'):break
            body=b''.join(chunks)
        sent=False
        async def replay():
            nonlocal sent
            if body is not None and not sent:
                sent=True;return {'type':'http.request','body':body,'more_body':False}
            return await receive()
        await self.app(scope,replay if body is not None else receive,send)

class Limiter:
    """Short-lived single-process brake; paid API daily limits live in Postgres."""
    def __init__(self): self.events=defaultdict(deque)
    def allow(self,key,limit,window=60):
        now=time.monotonic()
        if len(self.events)>10000:
            self.events={k:v for k,v in self.events.items() if v and v[-1]>now-window}
            self.events=defaultdict(deque,self.events)
        q=self.events[key]
        while q and q[0]<now-window:q.popleft()
        if len(q)>=limit:return False
        q.append(now);return True
