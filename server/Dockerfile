FROM node:26-trixie-slim

# LibreOffice converts the purchase DOCX to PDF (controllers/convertToPDF.js). The headless (-nogui) build keeps
# the image near 1 GB; Alpine's package pulls in Qt/GTK/Mesa (~1.8 GB). The documents use Manrope SemiBold
# (embedded in the DOCX and installed below); Liberation is the metric-compatible Times New Roman LibreOffice
# falls back to for glyphs Manrope lacks, as GroupDocs did. tini reaps soffice processes killed on timeout.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-writer-nogui fonts-liberation fontconfig tini \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The purchase flow writes temporary .docx/.pdf files under ./assets, so the app user owns /app.
COPY --chown=node:node . .
RUN mkdir -p /usr/share/fonts/manrope && cp assets/Manrope/static/Manrope-SemiBold.ttf /usr/share/fonts/manrope/ && fc-cache -f
USER node

EXPOSE 8080
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "index.js"]
