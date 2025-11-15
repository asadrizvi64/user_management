import React from 'react';

const App = () => {
  console.log('MINIMAL App is rendering!');

  return (
    <div style={{
      padding: '50px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>React App is Working!</h1>
      <p>If you can see this, React is loading correctly.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

export default App;
