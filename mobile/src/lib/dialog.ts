import { Alert, Platform } from 'react-native';

/**
 * react-native-web's Alert is a no-op, so buttons/callbacks never fire on web.
 * These helpers give the same API on every platform.
 */

export function notify(title: string, message?: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAction(opts: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) {
  const {
    title,
    message,
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    destructive,
    onConfirm,
  } = opts;

  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(message ? `${title}\n\n${message}` : title)) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
