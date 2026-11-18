FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

# The purchase flow writes temporary .docx/.pdf files under ./assets, so the app user owns /app.
COPY --chown=node:node . .
USER node

EXPOSE 8080
CMD ["node", "index.js"]
