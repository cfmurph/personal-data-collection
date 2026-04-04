"""SPA server that serves the built React app and proxies /api to the backend."""
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn

BACKEND = "http://127.0.0.1:8000"
DIST = "/workspace/apps/web/dist"

app = FastAPI()


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def proxy_api(path: str, request: Request):
    url = f"{BACKEND}/api/{path}"
    if request.query_params:
        url += "?" + str(request.query_params)
    body = await request.body()
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method=request.method,
            url=url,
            headers={k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")},
            content=body,
            follow_redirects=True,
            timeout=30,
        )
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
    )


class SPAMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        if response.status_code == 404:
            return FileResponse(f"{DIST}/index.html")
        return response


app.add_middleware(SPAMiddleware)
app.mount("/", StaticFiles(directory=DIST, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5173, log_level="warning")
