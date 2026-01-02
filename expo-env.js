// Environment configuration for Expo
// This file provides the API URL for the mobile app

const getApiUrl = () => {
  // For development, use the local machine IP
  // For production, this would be your deployed API URL
  const localIP = '192.168.70.93';
  // const localIP = '192.168.1.225';
  const port = '3000';

  return `http://${localIP}:${port}/api`;
};

module.exports = {
  API_URL: getApiUrl(),
};
