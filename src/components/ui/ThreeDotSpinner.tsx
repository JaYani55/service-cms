import React from 'react';
import './ThreeDotSpinner.css';

interface ThreeDotSpinnerProps {
  /** Overall size of the ThreeDotSpinner (width & height) */
  size?: string;
  /** Color of the dots */
  color?: string;
  /** Duration of one full spin & wobble cycle */
  speed?: string;
  /** Diameter of each dot as % of container size */
  dotSize?: string;
}

/**
 * A spinning 3-dot ThreeDotSpinner. Each dot wobbles in/out as
 * the whole thing rotates in a continuous loop.
 */
const ThreeDotSpinner: React.FC<ThreeDotSpinnerProps> = ({
  size = '40px',
  color = 'black',
  speed = '1.3s',
  dotSize = '25%',
}) => {
  // We inject CSS custom properties so you can override via props
  const styleVars: React.CSSProperties = {
    '--uib-size': size,
    '--uib-color': color,
    '--uib-speed': speed,
    '--uib-dot-size': dotSize,
  } as React.CSSProperties;

  return (
    <div className="ThreeDotSpinner-container" style={styleVars}>
      <div className="ThreeDotSpinner-dot" />
      <div className="ThreeDotSpinner-dot" />
      <div className="ThreeDotSpinner-dot" />
    </div>
  );
};

export default ThreeDotSpinner;
