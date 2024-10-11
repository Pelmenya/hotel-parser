FROM alpine:latest

# Устанавливаем необходимые пакеты
RUN apk add --no-cache build-base && \
    wget https://github.com/z3APA3A/3proxy/archive/refs/tags/0.9.4.tar.gz && \
    tar xzf 0.9.4.tar.gz && \
    cd 3proxy-0.9.4 && \
    make -f Makefile.Linux && \
    cp bin/3proxy /usr/local/bin && \
    cd .. && \
    rm -rf 3proxy-0.9.4 0.9.4.tar.gz && \
    apk del build-base

# Копируем конфигурационный файл
COPY 3proxy.cfg /etc/3proxy.cfg

# Запускаем 3proxy
CMD ["3proxy", "/etc/3proxy.cfg"]
