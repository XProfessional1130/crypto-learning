import React from 'react';

interface ErrorDisplayProps {
  message: string;
  details?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorDisplay - Component for displaying error messages in the UI
 * Shows an error message with optional details and retry button
 */
const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  details,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`error-display ${className}`}>
      <div className="error-icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      
      <div className="error-content">
        <h3 className="error-title">{message}</h3>
        
        {details && (
          <details className="error-details">
            <summary>Show details</summary>
            <p>{details}</p>
          </details>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="error-retry-button"
            aria-label="Retry"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay; 