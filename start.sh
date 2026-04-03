#!/bin/bash
# Start backend and web frontend for local development

set -e

echo "Starting FastAPI backend on port 8000..."
cd apps/backend
pip install -r requirements.txt -q
python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ../..

echo "Starting React web frontend on port 5173..."
cd apps/web
npm install -q
npm run dev &
WEB_PID=$!
cd ../..

echo ""
echo "Personal Data Hub running:"
echo "  Web:      http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API docs: http://localhost:8000/docs"
echo ""
echo "  Mobile:   cd apps/mobile && npx expo start"
echo ""
echo "Press Ctrl+C to stop web + backend."

trap "kill $BACKEND_PID $WEB_PID 2>/dev/null; exit" INT TERM
wait
