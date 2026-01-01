import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  View,
  FlatList,
  Pressable,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { setDemoScreen, DEMO_SCREENS, DemoScreen } from '../services/firebase';
import { Colors, Spacing, BorderRadius, FontSizes } from '../constants/theme';
import { DEMO_GAME_CODE } from '../services/demoData';
import { RootStackParamList } from '../navigation/AppNavigator';

interface DemoControlsProps {
  gameCode: string;
  navigation?: NativeStackNavigationProp<RootStackParamList, any>;
}

export default function DemoControls({ gameCode, navigation }: DemoControlsProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Only show in demo mode
  if (gameCode !== DEMO_GAME_CODE) {
    return null;
  }

  const handleSelectScreen = (screen: DemoScreen, isNavigation?: boolean) => {
    setModalVisible(false);

    if (isNavigation && navigation) {
      // Navigate to a different screen
      if (screen === 'create_game') {
        navigation.navigate('CreateGame');
      } else if (screen === 'join_game') {
        navigation.navigate('JoinGame');
      } else if (screen === 'lobby') {
        setDemoScreen('lobby');
        navigation.navigate('Lobby', {
          gameCode: DEMO_GAME_CODE,
          playerId: 'demo-player-1',
        });
      }
    } else {
      // Update demo game state
      setDemoScreen(screen);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Demo Screens ▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Demo Screen</Text>
            <FlatList
              data={DEMO_SCREENS}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleSelectScreen(item.key, item.isNavigation)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: Colors.primaryForeground,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
    color: Colors.text,
    padding: Spacing.lg,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  optionText: {
    fontSize: FontSizes.md,
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
  },
  cancelButton: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
