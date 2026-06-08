export const PERIODS = ['盛唐', '中唐', '晚唐五代', '北宋', '南宋']

export const PERIOD_COLORS = {
  '盛唐':     '#E8B84B',
  '中唐':     '#D4845A',
  '晚唐五代': '#8B7BB5',
  '北宋':     '#5B8DB8',
  '南宋':     '#4A9E8E',
}

export const POLARITY_COLORS = {
  '积极': '#FFD700',
  '消极': '#2E5FA3',
  '中性': '#8C8C8C',
  null:   'rgba(200,200,200,0.5)',
}

export const RUPTURE_EVENTS = [
  { year: 755,  name: '安史之乱', seam: '盛唐|中唐',  desc: '叛军陷两京，盛唐气象崩塌' },
  { year: 1127, name: '靖康之变', seam: '北宋|南宋',  desc: '金陷汴京，徽钦被掳，高宗南渡' },
]
