// Wrapper: echarts-for-react CJS/ESM interop fix
// Vite's CJS-to-ESM conversion wraps exports as { default: fn }
// We need to explicitly extract the default function
import _ReactEChartsCore from 'echarts-for-react/lib/core'
export const ReactEChartsCore = _ReactEChartsCore && _ReactEChartsCore.default
  ? _ReactEChartsCore.default
  : _ReactEChartsCore
