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

const TRADITIONAL_TO_SIMPLIFIED = {
  風: '风',
  陽: '阳',
  黃: '黄',
  淚: '泪',
  燈: '灯',
  樓: '楼',
  場: '场',
  錢: '钱',
  殘: '残',
  紅: '红',
  戰: '战',
  塵: '尘',
  東: '东',
  畫: '画',
  細: '细',
  煙: '烟',
}

function normalizeImageryForMatch(value) {
  return String(value).replace(/[風陽黃淚燈樓場錢殘紅戰塵東畫細煙]/g, ch =>
    TRADITIONAL_TO_SIMPLIFIED[ch] || ch
  )
}

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

// 自定义排列顺序（决定河流图上下层级）
const TYPE_ORDER = ['家国', '豪迈', '哲思', '离愁', '思乡', '孤独', '爱情', '闲适']
const THEME_ORDER = ['家国兴亡', '边塞战争', '羁旅行役', '咏史怀古', '悼亡伤逝',
  '送别酬赠', '人生哲理', '山水田园', '闺情爱情', '宴饮闲适', '咏物', '其他']

function toRiverData(byPhase, order) {
  const rows = []
  for (const [phase, cats] of Object.entries(byPhase)) {
    // 按自定义顺序排序
    const sorted = Object.entries(cats).sort((a, b) => {
      const ai = order.indexOf(a[0])
      const bi = order.indexOf(b[0])
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
    for (const [cat, value] of sorted) {
      rows.push([Number(phase), value, cat])
    }
  }
  return rows
}

const typesNormalized = normalize(typesByPhase)
const themesNormalized = normalize(themesByPhase)

const typesRiver = toRiverData(typesNormalized, TYPE_ORDER)
const themesRiver = toRiverData(themesNormalized, THEME_ORDER)

writeFileSync(resolve(OUTPUT_DIR, 'types_by_phase.json'), JSON.stringify(typesRiver))
writeFileSync(resolve(OUTPUT_DIR, 'themes_by_phase.json'), JSON.stringify(themesRiver))
writeFileSync(resolve(OUTPUT_DIR, 'imagery_by_phase.json'), JSON.stringify(imageryByPhase))

console.log(`类型河流图数据: ${typesRiver.length} 行 (${ALL_TYPES.size} 种类型)`)
console.log(`题材河流图数据: ${themesRiver.length} 行 (${ALL_THEMES.size} 种题材)`)
console.log(`各阶段作品数:`, Object.fromEntries(
  Object.entries(poemCountPerPhase).sort((a, b) => a[0] - b[0])
))

// ════════════════ 地名匹配（地理气泡图用）════════════════
const placeNamesFile = resolve(DATA_DIR, 'place_names.json')
if (!existsSync(placeNamesFile)) {
  console.log(`\n[地理] 未找到 ${placeNamesFile}，跳过地名匹配`)
} else {
  const placeDict = JSON.parse(readFileSync(placeNamesFile, 'utf-8'))
  const sortedPlaces = Object.entries(placeDict)
    .map(([name, coords]) => ({ name, lng: coords[0], lat: coords[1] }))
    .sort((a, b) => b.name.length - a.name.length)

  const geoByPhase = {}
  let geoMatches = 0

  for (const r of records) {
    const phase = r['创作阶段']
    if (phase == null) continue
    const imageries = r['意象_llm'] || []
    if (imageries.length === 0) continue

    const matched = new Set()
    for (const img of imageries) {
      for (const p of sortedPlaces) {
        if (img.includes(p.name)) {
          matched.add(p.name)
        }
      }
    }
    if (matched.size === 0) continue

    geoByPhase[phase] ??= {}
    for (const placeName of matched) {
      geoByPhase[phase][placeName] = (geoByPhase[phase][placeName] || 0) + 1
      geoMatches++
    }
  }

  const placeCoords = {}
  for (const p of sortedPlaces) {
    placeCoords[p.name] = [p.lng, p.lat]
  }

  writeFileSync(resolve(OUTPUT_DIR, 'geo_by_phase.json'),
    JSON.stringify({ by_phase: geoByPhase, place_coords: placeCoords }))

  const phasesWithData = Object.keys(geoByPhase).sort((a, b) => a - b)
  console.log(`\n[地理] 匹配 ${geoMatches} 次, ${phasesWithData.length} 个阶段有数据, 写入 geo_by_phase.json`)
}

// ════════════════ 意象分组趋势（折线图用）════════════════
const groupsFile = resolve(DATA_DIR, 'imagery_groups.json')
if (!existsSync(groupsFile)) {
  console.log(`\n[趋势] 未找到 ${groupsFile}，跳过意象趋势`)
} else {
  const groups = JSON.parse(readFileSync(groupsFile, 'utf-8'))
  const normalizedGroups = groups.map(([groupName, keywords]) => [
    groupName,
    keywords.map(normalizeImageryForMatch),
  ])
  const groupAliases = {}
  for (const [groupName, keywords] of groups) {
    groupAliases[groupName] = groupName
    for (const keyword of keywords) {
      groupAliases[keyword] = groupName
      groupAliases[normalizeImageryForMatch(keyword)] = groupName
    }
  }

  // 对每组关键词，按阶段统计出现次数（归一化到 per_100）
  const trendByPhase = {}
  // 初始化所有组，确保无匹配的组也输出空数据
  for (const [groupName] of groups) {
    trendByPhase[groupName] = {}
  }

  for (const [groupName, keywords] of normalizedGroups) {
    for (const r of records) {
      const phase = r['创作阶段']
      if (phase == null) continue
      const imageries = (r['意象_llm'] || []).map(normalizeImageryForMatch)
      const found = keywords.some(kw => imageries.some(img => img.includes(kw)))
      if (!found) continue

      trendByPhase[groupName] ??= {}
      trendByPhase[groupName][phase] = (trendByPhase[groupName][phase] || 0) + 1
    }
  }

  // 归一化为每百首出现次数
  const trendOutput = {}
  for (const [groupName, phases] of Object.entries(trendByPhase)) {
    trendOutput[groupName] = {}
    for (let p = 1; p <= 12; p++) {
      const count = phases[String(p)] || 0
      const total = poemCountPerPhase[String(p)] || 1
      trendOutput[groupName][p] = +(count / total * 100).toFixed(2)
    }
  }

  writeFileSync(resolve(OUTPUT_DIR, 'imagery_trend.json'), JSON.stringify(trendOutput))
  writeFileSync(resolve(OUTPUT_DIR, 'imagery_group_aliases.json'), JSON.stringify(groupAliases))
  console.log(`\n[趋势] ${Object.keys(trendOutput).length} 组意象趋势, 写入 imagery_trend.json / imagery_group_aliases.json`)
}
