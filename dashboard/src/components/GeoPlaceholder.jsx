export default function GeoPlaceholder({ range }) {
  return (
    <div className="geo-placeholder">
      <div className="geo-placeholder-icon">🗺️</div>
      <p>地理气泡图</p>
      <p className="geo-placeholder-hint">
        当前选中阶段 {range[0]}–{range[1]}<br />
        待接入地理数据
      </p>
    </div>
  )
}
