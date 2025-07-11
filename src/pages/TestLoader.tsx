import React from 'react';
import { LoadingState } from '../components/ui/LoadingState';

const TestLoader = () => {
  return (
    <div className="p-8 space-y-8">
      <h1>Loader Test Page</h1>
      
      <div className="border p-4">
        <h2>Default LoadingState:</h2>
        <LoadingState />
      </div>
      
      <div className="border p-4">
        <h2>Small LoadingState:</h2>
        <LoadingState size="sm" />
      </div>
      
      <div className="border p-4">
        <h2>Large LoadingState:</h2>
        <LoadingState size="lg" />
      </div>
      
      <div className="border p-4 h-96">
        <h2>Full Height LoadingState:</h2>
        <LoadingState fullHeight={true} />
      </div>
    </div>
  );
};

export default TestLoader;