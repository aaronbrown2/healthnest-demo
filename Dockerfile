FROM node:20-slim AS frontend-build

WORKDIR /app/code/frontend

COPY code/frontend/package*.json ./
RUN npm ci

COPY code/frontend ./
ENV VITE_HEALTHNEST_DEMO=true
RUN npm run build

FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEMO_DB_PATH=/var/data/healthnest_demo.sqlite

COPY code/demo_backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY code/demo_backend ./code/demo_backend
COPY --from=frontend-build /app/code/frontend/dist ./code/frontend/dist

WORKDIR /app/code/demo_backend

EXPOSE 8001

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8001}"]
