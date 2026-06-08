/**
 * 纯函数：构建词云 option。
 * wordcloud 由 echarts-wordcloud 插件提供，type: 'wordCloud'。
 */
function makeWords(entries, colorFn) {
  return entries.map(([name, value]) => ({
    name,
    value: typeof value === 'number' ? value : value[0],
    textStyle: { color: colorFn(name, value) },
  }))
}

function tangColor() {
  const h = 35 + Math.random() * 20
  return `hsl(${h}, 80%, ${50 + Math.random() * 20}%)`
}
function songColor() {
  const h = 165 + Math.random() * 20
  return `hsl(${h}, 60%, ${45 + Math.random() * 20}%)`
}
function periodColor() {
  const h = 260 + Math.random() * 40
  return `hsl(${h}, 55%, ${50 + Math.random() * 20}%)`
}

export function buildWordCloudOption(freqData, periodFreqData, selectedPeriod) {
  if (!freqData) return null

  // 当前时期有数据则用时期词云
  const periodWords = selectedPeriod && periodFreqData?.by_period?.[selectedPeriod]
  if (periodWords) {
    const words = makeWords(periodWords.top100, periodColor)
    return {
      backgroundColor: 'transparent',
      title: {
        text: `${selectedPeriod} · 高频词云`,
        left: 'center', top: 8,
        textStyle: { color: '#e8d5a3', fontSize: 15 },
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center', top: '10%',
        width: '90%', height: '85%',
        sizeRange: [14, 52],
        rotationRange: [-30, 30],
        data: words,
      }],
    }
  }

  // 默认：唐 vs 宋并列
  const tangWords = makeWords(Object.entries(freqData.tang_top200 || {}), tangColor)
  const songWords = makeWords(Object.entries(freqData.song_top200 || {}), songColor)

  const baseCloud = (data, title, left) => ({
    type: 'wordCloud',
    shape: 'circle',
    left, top: '8%',
    width: '45%', height: '85%',
    sizeRange: [12, 46],
    rotationRange: [-20, 20],
    data: data.slice(0, 120),
    textStyle: {},
  })

  return {
    backgroundColor: 'transparent',
    title: [
      { text: '唐诗 高频词', left: '22%', top: 6, textAlign: 'center',
        textStyle: { color: '#E8B84B', fontSize: 14 } },
      { text: '宋词 高频词', left: '72%', top: 6, textAlign: 'center',
        textStyle: { color: '#4A9E8E', fontSize: 14 } },
    ],
    series: [
      baseCloud(tangWords, '唐诗', '2%'),
      baseCloud(songWords, '宋词', '52%'),
    ],
  }
}
