// src/utils/Trace.js

// Initialize global logs array to store all Trace logs
const logs = [];

// Define the Trace function
const Trace = (message, data = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    message,
    data,
  };

  // Store the log entry
  logs.push(logEntry);

  // Output to console with formatted JSON
  console.log(
    JSON.stringify(
      { timestamp: logEntry.timestamp, message, ...data },
      null,
      2,
    ),
  );

  // Return the log entry for potential further use
  return logEntry;
};

// Add a method to retrieve all logs
Trace.getLogs = () => logs;

// Attach Trace to the global object for React Native
if (typeof global === 'object') {
  global.Trace = Trace;
} else {
  console.warn('Global object not found. Trace may not be globally accessible.');
}

// Export Trace for explicit imports if needed
export default Trace;