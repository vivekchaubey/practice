import React from 'react';
import './Greeting.css';

const Greeting = ({ message, name }) => {
  return (
    <div className="greeting">
      <p className="message">{message}</p>
      {name && <p className="name">Welcome, {name}!</p>}
    </div>
  );
};

export default Greeting;
