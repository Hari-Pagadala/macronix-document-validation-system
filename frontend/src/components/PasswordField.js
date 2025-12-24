import React, { useState, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

const PasswordField = ({ 
  value, 
  onChange, 
  label = "Password", 
  name = "password",
  required = true,
  helperText = "",
  email = "",
  editMode = false,
  showValidation = true,
  onValidityChange,
  disabled = false,
  autoComplete = "off"
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [validation, setValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    notSameAsEmail: true
  });

  useEffect(() => {
    if (value) {
      setValidation({
        minLength: value.length >= 8,
        hasUppercase: /[A-Z]/.test(value),
        hasLowercase: /[a-z]/.test(value),
        hasNumber: /[0-9]/.test(value),
        hasSpecialChar: /[@$!%*?&]/.test(value),
        notSameAsEmail: email ? value.toLowerCase() !== email.toLowerCase() : true
      });
    } else {
      setValidation({
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
        notSameAsEmail: true
      });
    }
  }, [value, email]);

  useEffect(() => {
    if (typeof onValidityChange === 'function') {
      const allValid = Object.values(validation).every(v => v === true);
      onValidityChange(allValid);
    }
  }, [validation, onValidityChange]);

  const isPasswordValid = () => {
    return Object.values(validation).every(v => v === true);
  };

  const ValidationItem = ({ isValid, text }) => (
    <ListItem dense sx={{ py: 0 }}>
      <ListItemIcon sx={{ minWidth: 32 }}>
        {isValid ? (
          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
        ) : (
          <Cancel sx={{ fontSize: 16, color: 'error.main' }} />
        )}
      </ListItemIcon>
      <ListItemText 
        primary={text}
        primaryTypographyProps={{ 
          variant: 'caption',
          sx: { color: isValid ? 'success.main' : 'text.secondary' }
        }}
      />
    </ListItem>
  );

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        helperText={helperText}
        disabled={disabled}
        error={value && !isPasswordValid()}
        autoComplete={autoComplete}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      {showValidation && value && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
            Password must:
          </Typography>
          <List sx={{ py: 0 }}>
            <ValidationItem isValid={validation.minLength} text="Be at least 8 characters" />
            <ValidationItem isValid={validation.hasUppercase} text="Contain 1 uppercase letter" />
            <ValidationItem isValid={validation.hasLowercase} text="Contain 1 lowercase letter" />
            <ValidationItem isValid={validation.hasNumber} text="Contain 1 number" />
            <ValidationItem isValid={validation.hasSpecialChar} text="Contain 1 special character (@$!%*?&)" />
            {email && <ValidationItem isValid={validation.notSameAsEmail} text="Not be same as Email" />}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default PasswordField;
