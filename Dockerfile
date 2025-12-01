# --- Estágio 1: Build do Flutter ---
FROM ghcr.io/cirruslabs/flutter:stable AS build

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY pubspec.* ./

# Baixa as dependências
RUN flutter pub get

# Copia todo o restante do código fonte
COPY . .

# Compila para web (modo release otimizado)
RUN flutter build web --release

# --- Estágio 2: Servidor Nginx (Produção) ---
FROM nginx:alpine

# Copia os arquivos compilados do estágio anterior para a pasta do Nginx
COPY --from=build /app/build/web /usr/share/nginx/html

# Copia nossa configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# O Railway injeta a porta automaticamente, mas o Nginx container padrão escuta na 80.
# O Railway mapeia a porta externa para a 80 do container.
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]