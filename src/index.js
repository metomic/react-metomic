import React from 'react';
import ReactDOM from 'react-dom';
import App from './environment/App';

ReactDOM.render(
  <App projectId={process.env.REACT_APP_PROJECT_ID} autoblocking debug />,
  document.getElementById('root')
);
