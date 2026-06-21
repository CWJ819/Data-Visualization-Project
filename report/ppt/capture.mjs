import puppeteer from 'puppeteer'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { resolve, extname } from 'path'

const PORT = 9876
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
  console.log(`Server on http://localhost:${PORT}`)
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080 })

  const totalPages = 10
  for (let i = 1; i <= totalPages; i++) {
    await page.goto(`http://localhost:${PORT}/ppt.html`, { waitUntil: 'networkidle0' })
    const slides = await page.$$('.slide')
    if (i <= slides.length) {
      const box = await slides[i - 1].boundingBox()
      await page.setViewport({ width: 1920, height: Math.ceil(box.height) })
      await page.goto(`http://localhost:${PORT}/ppt.html`, { waitUntil: 'networkidle0' })
      const updatedSlides = await page.$$('.slide')
      await updatedSlides[i - 1].screenshot({ path: resolve(ROOT, `pic/${i}.png`) })
      console.log(`  OK pic/${i}.png`)
    } else {
      console.log(`  SKIP pic/${i}.png (slide not found)`)
    }
  }

  await browser.close()
  server.close()
  console.log('Done.')
})
