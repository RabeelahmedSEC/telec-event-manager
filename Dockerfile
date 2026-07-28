FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY server.js ./
COPY public ./public
RUN mkdir -p /app/data /app/backups
ENV NODE_ENV=production
ENV PORT=4310
ENV TELEC_DATA_DIR=/app/data
ENV TELEC_BACKUP_DIR=/app/backups
EXPOSE 4310
CMD ["npm","run","cloud"]
