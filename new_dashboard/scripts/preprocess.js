/**
 * preprocess.js — 从 enriched_temp.jsonl 预聚合图表数据
 *
 * 用法: node scripts/preprocess.js
 * 输出: public/data/types_by_phase.json
 *        public/data/themes_by_phase.json
 *        public/data/imagery_by_phase.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'data')
const OUTPUT_DIR = resolve(__dirname, '..', 'public', 'data')

const inputFile = resolve(DATA_DIR, 'enriched_temp.jsonl')
if (!existsSync(inputFile)) {
  console.error(`错误: 未找到 ${inputFile}`)
  process.exit(1)
}

const lines = readFileSync(inputFile, 'utf-8').trim().split('\n')
const records = lines.map(l => JSON.parse(l))
console.log(`读取 ${records.length} 条记录`)

const typesByPhase = {}
const themesByPhase = {}
const imageryByPhase = {}
const poemCountPerPhase = {}

// 收集全部可能出现的类型和题材
const ALL_TYPES = new Set()
const ALL_THEMES = new Set()

for (const r of records) {
  const phase = r['创作阶段']
  if (phase == null) continue

  poemCountPerPhase[phase] = (poemCountPerPhase[phase] || 0) + 1

  for (const t of r['类型'] || []) {
    ALL_TYPES.add(t)
    typesByPhase[phase] ??= {}
    typesByPhase[phase][t] = (typesByPhase[phase][t] || 0) + 1
  }

  const theme = r['题材_llm']
  if (theme) {
    ALL_THEMES.add(theme)
    themesByPhase[phase] ??= {}
    themesByPhase[phase][theme] = (themesByPhase[phase][theme] || 0) + 1
  }

  for (const img of r['意象_llm'] || []) {
    imageryByPhase[phase] ??= {}
    imageryByPhase[phase][img] = (imageryByPhase[phase][img] || 0) + 1
  }
}

// 为每个阶段填补缺失的类型/题材（值为 0），确保河流图连续
function fillMissing(byPhase, allCats) {
  for (const phase of Object.keys(byPhase)) {
    for (const cat of allCats) {
      if (!(cat in byPhase[phase])) {
        byPhase[phase][cat] = 0
      }
    }
  }
}

fillMissing(typesByPhase, ALL_TYPES)
fillMissing(themesByPhase, ALL_THEMES)

// 归一化为百分比（各类型/题材在阶段内占比，合计 100%）
function normalize(byPhase) {
  const result = {}
  for (const [phase, cats] of Object.entries(byPhase)) {
    const sum = Object.values(cats).reduce((a, b) => a + b, 0)
    if (!sum) continue
    result[phase] = {}
    for (const [cat, count] of Object.entries(cats)) {
      result[phase][cat] = +(count / sum * 100).toFixed(2)
    }
  }
  return result
}

function toRiverData(byPhase) {
  const rows = []
  for (const [phase, cats] of Object.entries(byPhase)) {
    for (const [cat, value] of Object.entries(cats)) {
      rows.push([Number(phase), value, cat])
    }
  }
  return rows
}

const typesNormalized = normalize(typesByPhase)
const themesNormalized = normalize(themesByPhase)

const typesRiver = toRiverData(typesNormalized)
const themesRiver = toRiverData(themesNormalized)

writeFileSync(resolve(OUTPUT_DIR, 'types_by_phase.json'), JSON.stringify(typesRiver))
writeFileSync(resolve(OUTPUT_DIR, 'themes_by_phase.json'), JSON.stringify(themesRiver))
writeFileSync(resolve(OUTPUT_DIR, 'imagery_by_phase.json'), JSON.stringify(imageryByPhase))

console.log(`类型河流图数据: ${typesRiver.length} 行 (${ALL_TYPES.size} 种类型)`)
console.log(`题材河流图数据: ${themesRiver.length} 行 (${ALL_THEMES.size} 种题材)`)
console.log(`各阶段作品数:`, Object.fromEntries(
  Object.entries(poemCountPerPhase).sort((a, b) => a[0] - b[0])
))
