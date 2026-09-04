import { afterEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../../src/utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
  logger.setLevel('info');
  logger.setPrefix('[Kwami]');
});

describe('logger levels', () => {
  it('suppresses everything below the configured level', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.setLevel('warn');
    logger.debug('d');
    logger.info('i');
    logger.warn('w');

    expect(debug).not.toHaveBeenCalled();
    expect(info).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });

  it('lets everything through at debug', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});

    logger.setLevel('debug');
    logger.debug('d');

    expect(debug).toHaveBeenCalledWith('[Kwami]', 'd');
  });

  it('always emits errors, even at the error level', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.setLevel('error');
    logger.error('boom', { code: 500 });

    expect(error).toHaveBeenCalledWith('[Kwami]', 'boom', { code: 500 });
  });
});

describe('logger prefix', () => {
  it('uses the configured prefix on every line', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.setPrefix('[Luna]');
    logger.info('hello');

    expect(info).toHaveBeenCalledWith('[Luna]', 'hello');
  });
});
