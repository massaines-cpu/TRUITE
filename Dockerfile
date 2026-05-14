FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

WORKDIR /app/back

RUN mkdir -p /app/back/staticfiles

EXPOSE 10000

CMD ["sh", "-c", "python manage.py migrate && python manage.py collectstatic --noinput && gunicorn truite.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]