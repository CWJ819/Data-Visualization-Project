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

// 第一阶段：原始计数 + 各阶段作品总数
const typesByPhase = {}
const themesByPhase = {}
const imageryByPhase = {}
const poemCountPerPhase = {}

for (const r of records) {
  const phase = r['创作阶段']
  if (phase == null) continue

  poemCountPerPhase[phase] = (poemCountPerPhase[phase] || 0) + 1

  for (const t of r['类型'] || []) {
    typesByPhase[phase] ??= {}
    typesByPhase[phase][t] = (typesByPhase[phase][t] || 0) + 1
  }

  const theme = r['题材_llm']
  if (theme) {
    themesByPhase[phase] ??= {}
    themesByPhase[phase][theme] = (themesByPhase[phase][theme] || 0) + 1
  }

  for (const img of r['意象_llm'] || []) {
    imageryByPhase[phase] ??= {}
    imageryByPhase[phase][img] = (imageryByPhase[phase][img] || 0) + 1
  }
}

// 第二阶段：归一化为百分比（每种类型/题材在阶段内的出现率）
function normalize(byPhase) {
  const result = {}
  for (const [phase, cats] of Object.entries(byPhase)) {
    const total = poemCountPerPhase[phase]
    if (!total) continue
    result[phase] = {}
    for (const [cat, count] of Object.entries(cats)) {
      result[phase][cat] = +(count / total * 100).toFixed(2)
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

console.log(`类型河流图数据: ${typesRiver.length} 行 (已归一化)`)
console.log(`题材河流图数据: ${themesRiver.length} 行 (已归一化)`)
console.log(`各阶段作品数:`, Object.fromEntries(
  Object.entries(poemCountPerPhase).sort((a, b) => a[0] - b[0])
))
