import React from 'react';
import { render, screen } from '@testing-library/react';
import GitHubStars from './GitHubStars';

beforeEach(() => {
  (global as any).indexedDB = {
    open: () => {
      const request: any = {};
      setTimeout(() => {
        request.result = {
          objectStoreNames: { contains: () => true },
          transaction: () => ({ objectStore: () => ({
            get: () => {
              const getRequest: any = {};
              setTimeout(() => { getRequest.result = null; getRequest.onsuccess?.(); }, 0);
              return getRequest;
            },
            put: () => {
              const putRequest: any = {};
              setTimeout(() => putRequest.onsuccess?.(), 0);
              return putRequest;
            },
          }) }),
        };
        request.onsuccess?.();
      }, 0);
      return request;
    },
  };
});
afterEach(() => { jest.restoreAllMocks(); });

describe('GitHubStars fallback', () => {
  it('shows the count returned by the repository API', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ stargazers_count: 23 }) } as Response);
    render(<GitHubStars owner="owner" repo="repo" />);
    expect(await screen.findByText('23')).toBeInTheDocument();
  });

  it('finishes with zero when the GitHub request rejects', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    render(<GitHubStars owner="owner" repo="repo" />);
    expect(await screen.findByText('0')).toBeInTheDocument();
  });

  it('falls back promptly when the GitHub connection does not respond', async () => {
    jest.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<GitHubStars owner="owner" repo="repo" />);
    expect(await screen.findByText('0', {}, { timeout: 2500 })).toBeInTheDocument();
  });
});
