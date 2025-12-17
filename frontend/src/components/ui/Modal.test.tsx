import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmDialog } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <p>Modal content</p>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders title in header', () => {
      render(<Modal {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid="custom-content">Custom Content</div>
        </Modal>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(<Modal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.length).toBeGreaterThan(0);
    });
  });

  describe('sizes', () => {
    it('applies medium size by default', () => {
      render(<Modal {...defaultProps} />);

      const modal = screen.getByText('Test Modal').closest('.relative');
      expect(modal?.className).toContain('max-w-lg');
    });

    it('applies small size', () => {
      render(<Modal {...defaultProps} size="sm" />);

      const modal = screen.getByText('Test Modal').closest('.relative');
      expect(modal?.className).toContain('max-w-md');
    });

    it('applies large size', () => {
      render(<Modal {...defaultProps} size="lg" />);

      const modal = screen.getByText('Test Modal').closest('.relative');
      expect(modal?.className).toContain('max-w-2xl');
    });

    it('applies xl size', () => {
      render(<Modal {...defaultProps} size="xl" />);

      const modal = screen.getByText('Test Modal').closest('.relative');
      expect(modal?.className).toContain('max-w-4xl');
    });

    it('applies full size', () => {
      render(<Modal {...defaultProps} size="full" />);

      const modal = screen.getByText('Test Modal').closest('.relative');
      expect(modal?.className).toContain('max-w-7xl');
    });
  });

  describe('footer', () => {
    it('renders footer when provided', () => {
      render(
        <Modal {...defaultProps} footer={<button>Footer Button</button>} />
      );

      expect(screen.getByRole('button', { name: /footer button/i })).toBeInTheDocument();
    });

    it('does not render footer section when not provided', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const footerBorder = container.querySelector('.border-t.border-gray-200');
      expect(footerBorder).not.toBeInTheDocument();
    });
  });

  describe('close behavior', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      // Find the close button (the X icon button in the header)
      const closeButton = screen.getAllByRole('button')[0];
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when overlay is clicked by default', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click on the overlay (the fixed inset-0 div)
      const overlay = document.querySelector('.fixed.inset-0.z-50');
      if (overlay) {
        await user.click(overlay);
      }

      expect(onClose).toHaveBeenCalled();
    });

    it('does not call onClose when closeOnOverlayClick is false', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);

      // Click on the overlay
      const overlay = document.querySelector('.fixed.inset-0.z-50');
      if (overlay) {
        await user.click(overlay);
      }

      // onClose might be called from other clicks, but clicking directly on overlay shouldn't work
      // This test verifies the prop is respected
      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Modal content'));

      // Should not have been called from clicking content
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('body scroll lock', () => {
    it('locks body scroll when modal opens', () => {
      render(<Modal {...defaultProps} isOpen={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('unlocks body scroll when modal closes', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={true} />);

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('unset');
    });
  });

  describe('accessibility', () => {
    it('has proper heading structure', () => {
      render(<Modal {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Modal');
    });
  });
});

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = 'unset';
  });

  describe('rendering', () => {
    it('renders title', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('renders message', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('renders confirm button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    });

    it('renders cancel button with default text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('renders custom confirm text', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="Delete" />);

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    });

    it('renders custom cancel text', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="Go Back" />);

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<ConfirmDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();

      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByRole('button', { name: /cancel/i }));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();

      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('variants', () => {
    it('applies primary variant by default', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton.className).toContain('bg-blue-600');
    });

    it('applies danger variant when specified', () => {
      render(<ConfirmDialog {...defaultProps} variant="danger" />);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      expect(confirmButton.className).toContain('bg-red-600');
    });
  });

  describe('size', () => {
    it('uses small size', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const modal = screen.getByText('Confirm Action').closest('.relative');
      expect(modal?.className).toContain('max-w-md');
    });
  });
});
