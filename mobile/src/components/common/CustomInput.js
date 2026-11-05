import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../utils/theme';
import AppIcon from './AppIcon';

export default function CustomInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  helperText,
  containerStyle,
  autoComplete,
  multiline = false,
  maxLength,
  editable = true,
  icon,
  showPasswordToggle = false,
  returnKeyType,
  onSubmitEditing,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}><TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry && !(showPasswordToggle && passwordVisible)}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={secureTextEntry || keyboardType === 'email-address' ? false : undefined}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        maxLength={maxLength}
        editable={editable}
        accessibilityLabel={label}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          icon && styles.inputWithIcon,
          secureTextEntry && showPasswordToggle && styles.inputWithToggle,
          multiline && styles.multiline,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      />{icon ? <View pointerEvents="none" style={styles.icon}><AppIcon name={icon} size={20} color={colors.textSecondary} /></View> : null}
      {secureTextEntry && showPasswordToggle ? <Pressable accessibilityRole="button" accessibilityLabel={passwordVisible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} accessibilityState={{ disabled: !editable }} disabled={!editable} onPress={() => setPasswordVisible(value => !value)} style={styles.toggle}><AppIcon name={passwordVisible ? 'eyeOff' : 'eye'} size={20} color={colors.textSecondary} /></Pressable> : null}</View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: { position: 'relative' },
  inputWithIcon: { paddingLeft: 48 },
  inputWithToggle: { paddingRight: 52 },
  toggle: { position: 'absolute', right: 2, top: 0, bottom: 0, width: 48, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  icon: { position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center' },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingVertical: spacing.sm },
  container: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs + 2,
  },
  input: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
