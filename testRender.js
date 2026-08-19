import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './src/App.jsx';

try {
  renderToString(<App />);
  console.log("Render successful!");
} catch (e) {
  console.error("RENDER ERROR:", e);
}
