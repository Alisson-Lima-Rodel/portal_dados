# ============= Build Stage =============
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============= Runtime Stage =============
FROM python:3.12-slim AS runtime

WORKDIR /app

# Copiar dependências instaladas
COPY --from=builder /install /usr/local

# Copiar código da aplicação
COPY . .

EXPOSE 8000

# Rodar migrations e subir a aplicação
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
