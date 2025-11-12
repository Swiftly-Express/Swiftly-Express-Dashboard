import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { YummyText } from './YummyText';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Navigate to home
    window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
              <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-lg text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#EF4444"/>
                  </svg>
                </div>
                
                <YummyText className="text-2xl font-medium text-[#0F172A] mb-2">
                  Oops! Something went wrong
                </YummyText>
                
                <YummyText className="text-sm text-[#64748B] mb-6">
                  We encountered an unexpected error. Don't worry, we're on it!
                </YummyText>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                    <YummyText className="text-xs font-medium text-red-600 mb-2">
                      Error Details (Dev Mode):
                    </YummyText>
                    <YummyText className="text-xs text-gray-700 font-mono break-all">
                      {this.state.error.toString()}
                    </YummyText>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-[#0F172A] rounded-xl transition-colors font-normal"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={this.handleReset}
                    className="flex-1 px-6 py-3 bg-[#00D68F] hover:bg-[#00B876] text-white rounded-xl transition-colors font-normal"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
