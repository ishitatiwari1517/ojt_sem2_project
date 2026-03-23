/**
 * Centralized application logger.
 * Replaces bare console.log calls with structured, timestamped log output.
 *
 * Usage:
 *   const logger = require('./utils/logger');
 *   logger.info('Server started');
 *   logger.warn('Memory usage high');
 *   logger.error('DB connection failed', err);
 */

const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
};

const timestamp = () => new Date().toISOString();

const logger = {
  info: (message, ...args) => {
    console.log(
      `${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}INFO${colors.reset}  ${message}`,
      ...args
    );
  },

  warn: (message, ...args) => {
    console.warn(
      `${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}WARN${colors.reset}  ${message}`,
      ...args
    );
  },

  error: (message, ...args) => {
    console.error(
      `${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}ERROR${colors.reset} ${message}`,
      ...args
    );
  },

  success: (message, ...args) => {
    console.log(
      `${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}OK${colors.reset}    ${message}`,
      ...args
    );
  },
};

module.exports = logger;
