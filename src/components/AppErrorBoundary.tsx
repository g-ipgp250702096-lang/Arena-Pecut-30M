import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Ralat paparan tidak dijangka.',
    };
  }

  componentDidCatch(error: Error): void {
    console.error('Arena Pecut 30M ErrorBoundary:', error);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#160B33] text-[#F7F5FC] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#FFC94A]/40 bg-[#201146] p-6 text-center space-y-4 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFC94A]/15 text-[#FFC94A]">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1 className="font-display text-xl font-extrabold text-[#F7F5FC]">
              ARENA PECUT 30 METER
            </h1>
            <p className="text-xs leading-relaxed text-[#D5CCE8]">
              Aplikasi menghadapi gangguan sementara semasa dimuatkan. Tekan butang di bawah untuk memulihkan paparan.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-[#FFC94A] px-5 py-2.5 text-xs font-extrabold text-[#14092E] hover:bg-[#ffd56e]"
            >
              <RotateCcw className="h-4 w-4" />
              Muat Semula Paparan
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
