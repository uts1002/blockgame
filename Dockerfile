# nginx를 사용하여 정적 파일 서빙
FROM nginx:alpine

# 작업 디렉토리 설정
WORKDIR /usr/share/nginx/html

# 기존 nginx 파일 삭제
RUN rm -rf ./*

# 게임 파일들 복사
COPY index.html .
COPY game.js .

# nginx 기본 설정 파일 제거
RUN rm /etc/nginx/conf.d/default.conf

# nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run은 PORT 환경변수를 사용하므로 8080 포트 노출
EXPOSE 8080

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]