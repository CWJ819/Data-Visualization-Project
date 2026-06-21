import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync } from 'fs'
import { resolve, extname } from 'path'

const PORT = 9877
const ROOT = resolve(import.meta.dirname)
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
}

const PAGE = Number(process.argv[2]) || 7

const server = createServer((req, res) => {
  let file = req.url === '/' ? '/ppt.html' : req.url
  const filePath = resolve(ROOT, '.' + file)
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return }
  try {
    const data = readFileSync(filePath)
    const ext = extname(filePath)
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404); res.end()
  }
})

server.listen(PORT, async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })
  await page.goto(`http://localhost:${PORT}/ppt.html`, { waitUntil: 'networkidle0' })
  const slides = await page.$$('.slide')
  const idx = PAGE - 1
  if (idx >= slides.length) { console.log('Page not found'); process.exit(1) }
  const box = await slides[idx].boundingBox()
  await page.setViewport({ width: 1920, height: Math.ceil(box.height) })
  await page.goto(`http://localhost:${PORT}/ppt.html`, { waitUntil: 'networkidle0' })
  const updatedSlides = await page.$$('.slide')
  await updatedSlides[idx].screenshot({ path: resolve(ROOT, `pic/${PAGE}.png`) })
  console.log(`OK pic/${PAGE}.png`)
  await browser.close()
  server.close()
})
