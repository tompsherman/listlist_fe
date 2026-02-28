/**
 * ConfirmDialog Component
 * Wrapper on Modal for confirm/cancel patterns
 */

import Modal, { ModalFooter } from './Modal';
import Button from './Button';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary', // primary or destructive
  loading = false,
}) {
  const handleConfirm = async () => {
    await onConfirm?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="confirm-dialog-content">
        {variant === 'destructive' && (
          <span className="confirm-dialog-icon" aria-hidden="true">⚠️</span>
        )}
        <p className="confirm-dialog-message">{message}</p>
      </div>
      <ModalFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'destructive' ? 'destructive' : 'primary'}
          onClick={handleConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
