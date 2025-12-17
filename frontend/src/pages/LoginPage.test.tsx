import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { useAuthStore } from '../stores/authStore';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset auth store
    useAuthStore.setState({
      user: null,
      token: null,
      tokenExpiresAt: null,
      availableTenants: [],
      currentWorkspace: null,
      isAuthenticated: false,
      impersonation: null,
    });
  });

  describe('rendering', () => {
    it('renders the login form with all required elements', () => {
      render(<LoginPage />);

      // Header and branding
      expect(screen.getByText('myScheduling')).toBeInTheDocument();
      expect(screen.getByText('Project Scheduling & Resource Management')).toBeInTheDocument();

      // Form elements
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in with password/i })).toBeInTheDocument();
    });

    it('renders system status section', () => {
      render(<LoginPage />);

      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('API:')).toBeInTheDocument();
      expect(screen.getByText('Database:')).toBeInTheDocument();
    });

    it('renders magic link button', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in with email link/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<LoginPage />);

      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
    });

    it('renders remember me checkbox defaulted to checked', () => {
      render(<LoginPage />);

      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).toBeInTheDocument();
      expect(rememberMeCheckbox).toBeChecked();
    });

    it('renders footer with copyright', () => {
      render(<LoginPage />);

      expect(screen.getByText(/2025 myScheduling/)).toBeInTheDocument();
    });
  });

  describe('form elements', () => {
    it('email input has required attribute', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
    });

    it('password input has required attribute', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('required');
    });

    it('email input has correct type', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('password input has correct type', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('email input accepts user input', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('password input accepts user input', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'mypassword123');

      expect(passwordInput).toHaveValue('mypassword123');
    });
  });

  describe('accessibility', () => {
    it('has proper form labels for email', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('has proper form labels for password', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('email has autocomplete attribute for username', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'username');
    });

    it('password has autocomplete attribute for current-password', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });
  });

  describe('remember me checkbox', () => {
    it('can be toggled off', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      expect(rememberMeCheckbox).toBeChecked();

      await user.click(rememberMeCheckbox);
      expect(rememberMeCheckbox).not.toBeChecked();
    });

    it('can be toggled on again', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      await user.click(rememberMeCheckbox); // Off
      await user.click(rememberMeCheckbox); // On

      expect(rememberMeCheckbox).toBeChecked();
    });
  });

  describe('magic link mode', () => {
    it('switches to magic link mode when button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const magicLinkButton = screen.getByRole('button', { name: /sign in with email link/i });
      await user.click(magicLinkButton);

      expect(screen.getByText(/passwordless sign in/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument();
    });

    it('shows back button in magic link mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const magicLinkButton = screen.getByRole('button', { name: /sign in with email link/i });
      await user.click(magicLinkButton);

      expect(screen.getByRole('button', { name: /back to password login/i })).toBeInTheDocument();
    });

    it('returns to password mode when back button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      // Switch to magic link mode
      const magicLinkButton = screen.getByRole('button', { name: /sign in with email link/i });
      await user.click(magicLinkButton);

      // Click back button
      const backButton = screen.getByRole('button', { name: /back to password login/i });
      await user.click(backButton);

      // Should be back to password mode
      expect(screen.getByRole('button', { name: /sign in with password/i })).toBeInTheDocument();
    });

    it('hides password field in magic link mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const magicLinkButton = screen.getByRole('button', { name: /sign in with email link/i });
      await user.click(magicLinkButton);

      // Password field should not be present
      expect(screen.queryByLabelText(/^password$/i)).not.toBeInTheDocument();
    });

    it('shows email field in magic link mode', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const magicLinkButton = screen.getByRole('button', { name: /sign in with email link/i });
      await user.click(magicLinkButton);

      // Email field should still be present
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });
  });

  describe('remembered email', () => {
    it('prefills email from localStorage when remembered', () => {
      localStorage.setItem('remembered-email', 'remembered@example.com');

      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveValue('remembered@example.com');
    });

    it('does not prefill email when localStorage is empty', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveValue('');
    });
  });

  describe('placeholder text', () => {
    it('email input has placeholder text', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('placeholder', 'you@company.com');
    });
  });

  describe('buttons', () => {
    it('submit button has correct text', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in with password/i })).toBeInTheDocument();
    });

    it('magic link button has correct text', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in with email link/i })).toBeInTheDocument();
    });
  });
});
