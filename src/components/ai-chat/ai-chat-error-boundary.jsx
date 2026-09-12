import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error boundary that wraps the AI chat sidebar.
 * If the AI chat crashes for any reason (e.g. IndexedDB unavailable,
 * backend unreachable, malformed data), the editor itself remains
 * fully functional — only the sidebar shows a small fallback message.
 */
class AIChatErrorBoundary extends React.Component {
    static getDerivedStateFromError (error) {
        return {hasError: true, error};
    }

    constructor (props) {
        super(props);
        this.state = {hasError: false, error: null};
    }

    componentDidCatch (error, errorInfo) {
        // eslint-disable-next-line no-console
        console.error('[AIChat] crashed:', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({hasError: false, error: null});
    };

    render () {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '1rem',
                        boxSizing: 'border-box',
                        fontFamily: 'sans-serif',
                        color: '#6b6b6b',
                        fontSize: '0.8rem'
                    }}
                >
                    <p>{'AI 侧栏遇到错误'}</p>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            border: '1px solid #d8d8d6',
                            borderRadius: '0.375rem',
                            background: 'transparent',
                            color: '#1a1a1a',
                            padding: '0.3rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                        }}
                    >
                        {'重试'}
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

AIChatErrorBoundary.propTypes = {
    children: PropTypes.node
};

export default AIChatErrorBoundary;
