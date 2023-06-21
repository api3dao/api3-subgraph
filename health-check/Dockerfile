FROM python:3.9-alpine

WORKDIR /app
ARG FLASK_ENV=production

RUN pip3 install flask requests
COPY script.py /app/script.py

CMD [ "python3", "/app/script.py" ]