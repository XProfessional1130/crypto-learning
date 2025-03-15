import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
  text?: string;
}

/**
 * LoadingSpinner - Component for displaying loading states
 * Shows a spinner with optional text
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'currentColor',
  className = '',
  text,
}) => {
  // Size mapping
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 36,
  };
  
  const spinnerSize = sizeMap[size];
  
  return (
    <div className={`loading-spinner-container ${className}`}>
      <svg
        className="loading-spinner"
        width={spinnerSize}
        height={spinnerSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="loading-spinner-track"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeOpacity="0.3"
          strokeWidth="2"
        />
        <circle
          className="loading-spinner-indicator"
          cx="12"
          cy="12"
          r="10"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="56.5487"
          strokeDashoffset="37.6991"
        />
      </svg>
      
      {text && <span className="loading-spinner-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner; 