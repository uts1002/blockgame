# nginx를 사용하여 정적 파일 서빙
FROM nginx:alpine

# 작업 디렉토리 설정
WORKDIR /usr/share/nginx/html

# 기존 nginx 파일 삭제
RUN rm -rf ./*

# 게임 파일들 복사
COPY index.html .
COPY game.js .

# nginx 설정 파일 복사 (선택사항)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 포트 노출
EXPOSE 80

# nginx 실행
CMD ["nginx", "-g", "daemon off;"]