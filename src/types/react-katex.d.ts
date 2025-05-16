declare module 'react-katex' {
  import * as React from 'react';
  
  export interface KatexProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: Error | TypeError) => React.ReactNode;
    settings?: any;
    as?: string | React.ComponentType<any>;
  }
  
  export const InlineMath: React.FC<Omit<KatexProps, 'block'>>;
  export const BlockMath: React.FC<Omit<KatexProps, 'block'>>;
} 