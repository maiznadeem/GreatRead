FROM node:24-alpine

# LibreOffice converts the purchase DOCX to PDF (controllers/convertToPDF.js). The documents use Manrope
# SemiBold (embedded in the DOCX and installed below); Liberation is the metric-compatible Times New Roman
# that LibreOffice falls back to for glyphs Manrope lacks, as GroupDocs did.
RUN apk add --no-cache libreoffice-writer font-liberation

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

# The purchase flow writes temporary .docx/.pdf files under ./assets, so the app user owns /app.
COPY --chown=node:node . .
RUN mkdir -p /usr/share/fonts/manrope && cp assets/Manrope/static/Manrope-SemiBold.ttf /usr/share/fonts/manrope/ && fc-cache -f
USER node

EXPOSE 8080
CMD ["node", "index.js"]
