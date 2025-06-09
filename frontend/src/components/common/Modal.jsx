import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, IconButton, Box, Typography, Slide
} from '@mui/material';
import { Close } from '@mui/icons-material';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Confirmation Modal
export const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'warning'
}) => {
  const getConfirmColor = () => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'primary';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color={getConfirmColor()}
          variant="contained"
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Generic Modal with close button
export const BaseModal = ({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'md',
  fullWidth = true,
  showCloseButton = true,
  ...props
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      TransitionComponent={Transition}
      {...props}
    >
      {title && (
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{title}</Typography>
            {showCloseButton && (
              <IconButton onClick={onClose} size="small">
                <Close />
              </IconButton>
            )}
          </Box>
        </DialogTitle>
      )}
      
      <DialogContent>
        {children}
      </DialogContent>
      
      {actions && (
        <DialogActions>
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

// Form Modal
export const FormModal = ({
  open,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  submitDisabled = false,
  loading = false,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  const actions = (
    <>
      <Button onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button 
        type="submit"
        variant="contained"
        disabled={submitDisabled || loading}
        form="modal-form"
      >
        {loading ? 'Loading...' : submitText}
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      actions={actions}
      {...props}
    >
      <Box component="form" id="modal-form" onSubmit={handleSubmit}>
        {children}
      </Box>
    </BaseModal>
  );
};

// Image Preview Modal
export const ImageModal = ({
  open,
  onClose,
  imageSrc,
  title,
  downloadUrl
}) => {
  const handleDownload = () => {
    if (downloadUrl) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title || 'image.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const actions = (
    <>
      {downloadUrl && (
        <Button onClick={handleDownload}>
          Download
        </Button>
      )}
      <Button onClick={onClose}>
        Close
      </Button>
    </>
  );

  return (
    <BaseModal
      open={open}
      onClose={onClose}
      title={title}
      actions={actions}
      maxWidth="lg"
    >
      {imageSrc && (
        <Box sx={{ textAlign: 'center' }}>
          <img
            src={imageSrc}
            alt={title || 'Preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '70vh',
              objectFit: 'contain'
            }}
          />
        </Box>
      )}
    </BaseModal>
  );
};

const Modal = {
  Base: BaseModal,
  Confirm: ConfirmModal,
  Form: FormModal,
  Image: ImageModal
};

export default Modal;