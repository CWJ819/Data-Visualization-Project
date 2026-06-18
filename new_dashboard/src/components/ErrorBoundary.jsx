import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100%', color: '#f85149', fontSize: 13, flexDirection: 'column', gap: 8,
        }}>
          <div>组件渲染错误</div>
          <div style={{ fontSize: 11, color: '#888', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error.message}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
