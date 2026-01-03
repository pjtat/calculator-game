import * as ExpoHaptics from 'expo-haptics';
import {
  lightTap,
  mediumTap,
  heavyTap,
  success,
  warning,
  error,
  selection,
} from '../../utils/haptics';

describe('haptics utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('lightTap', () => {
    it('triggers light impact feedback', () => {
      lightTap();
      expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith(
        ExpoHaptics.ImpactFeedbackStyle.Light
      );
    });
  });

  describe('mediumTap', () => {
    it('triggers medium impact feedback', () => {
      mediumTap();
      expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith(
        ExpoHaptics.ImpactFeedbackStyle.Medium
      );
    });
  });

  describe('heavyTap', () => {
    it('triggers heavy impact feedback', () => {
      heavyTap();
      expect(ExpoHaptics.impactAsync).toHaveBeenCalledWith(
        ExpoHaptics.ImpactFeedbackStyle.Heavy
      );
    });
  });

  describe('success', () => {
    it('triggers success notification feedback', () => {
      success();
      expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith(
        ExpoHaptics.NotificationFeedbackType.Success
      );
    });
  });

  describe('warning', () => {
    it('triggers warning notification feedback', () => {
      warning();
      expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith(
        ExpoHaptics.NotificationFeedbackType.Warning
      );
    });
  });

  describe('error', () => {
    it('triggers error notification feedback', () => {
      error();
      expect(ExpoHaptics.notificationAsync).toHaveBeenCalledWith(
        ExpoHaptics.NotificationFeedbackType.Error
      );
    });
  });

  describe('selection', () => {
    it('triggers selection feedback', () => {
      selection();
      expect(ExpoHaptics.selectionAsync).toHaveBeenCalled();
    });
  });
});
