FROM node:22-slim

RUN apt-get update && apt-get install -y --no-install-recommends build-essential curl m4 python3 python3-pip ca-certificates \
	&& curl -fsSL https://github.com/liblouis/liblouis/releases/download/v3.38.0/liblouis-3.38.0.tar.gz | tar -xz -C /tmp \
	&& cd /tmp/liblouis-3.38.0 \
	&& ./configure --without-yaml --disable-static \
	&& make -j2 \
	&& make install \
	&& ldconfig \
	&& rm -rf /tmp/liblouis-3.38.0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install -g corepack@latest \
    && corepack pnpm install \
    && corepack pnpm run build

ENV NODE_ENV=production
ENV LOUIS_TABLEPATH=/usr/local/share/liblouis/tables
CMD ["node", "dist/index.js"]
