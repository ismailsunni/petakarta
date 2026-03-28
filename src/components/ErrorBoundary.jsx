import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full font-sans bg-canvas text-ink">
          <div className="text-center">
            <p className="text-sm text-red-600 mb-2">
              {this.state.error?.message || 'Something went wrong.'}
            </p>
            <a
              href={import.meta.env.BASE_URL}
              className="text-sm text-accent hover:underline"
            >
              Go to PetaKarta
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
