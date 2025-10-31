import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Version } from './Version';

describe('Version Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with default version when env variables not set', () => {
    // Mock empty env variables
    vi.stubEnv('VITE_APP_VERSION', '');
    vi.stubEnv('VITE_COMMIT_HASH', '');

    render(<Version />);

    const versionText = screen.getByText(/Pressograph v1\.2\.0/);
    expect(versionText).toBeInTheDocument();
  });

  it('should render with environment version when VITE_APP_VERSION is set', () => {
    vi.stubEnv('VITE_APP_VERSION', '2.0.0');
    vi.stubEnv('VITE_COMMIT_HASH', 'abc1234567890');

    render(<Version />);

    expect(screen.getByText(/Pressograph v2\.0\.0/)).toBeInTheDocument();
  });

  it('should display commit hash truncated to 7 characters', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.2.0');
    vi.stubEnv('VITE_COMMIT_HASH', '1234567890abcdef');

    render(<Version />);

    const versionText = screen.getByText(/\(1234567\)/);
    expect(versionText).toBeInTheDocument();
  });

  it('should display "dev" when commit hash is not set', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.2.0');
    vi.stubEnv('VITE_COMMIT_HASH', '');

    render(<Version />);

    expect(screen.getByText(/\(dev\)/)).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    render(<Version />);

    const container = screen.getByText(/Pressograph/).parentElement;
    expect(container).toHaveClass('text-xs');
    expect(container).toHaveClass('text-gray-500');
    expect(container).toHaveClass('dark:text-gray-400');
    expect(container).toHaveClass('text-center');
    expect(container).toHaveClass('py-2');
  });

  it('should use monospace font for version text', () => {
    render(<Version />);

    const versionSpan = screen.getByText(/Pressograph/);
    expect(versionSpan).toHaveClass('font-mono');
  });

  it('should render complete version string with correct format', () => {
    vi.stubEnv('VITE_APP_VERSION', '1.5.3');
    vi.stubEnv('VITE_COMMIT_HASH', 'abc123def456');

    render(<Version />);

    expect(screen.getByText('Pressograph v1.5.3 (abc123d)')).toBeInTheDocument();
  });

  it('should have border styling', () => {
    render(<Version />);

    const container = screen.getByText(/Pressograph/).parentElement;
    expect(container).toHaveClass('border-t');
    expect(container).toHaveClass('border-gray-200');
    expect(container).toHaveClass('dark:border-gray-700');
  });
});
