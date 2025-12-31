import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../constants/theme';

interface CalculatorProps {
  onCalculationChange: (value: number | null, history: string) => void;
  disabled?: boolean;
}

export default function Calculator({ onCalculationChange, disabled = false }: CalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [history, setHistory] = useState('');
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const handleNumberPress = (num: string) => {
    if (disabled) return;

    if (shouldResetDisplay) {
      setDisplay(num);
      setShouldResetDisplay(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperationPress = (op: string) => {
    if (disabled) return;

    const currentValue = parseFloat(display);

    if (previousValue !== null && operation !== null && !shouldResetDisplay) {
      // Perform the pending operation
      const result = calculate(previousValue, currentValue, operation);
      setDisplay(result.toString());
      setPreviousValue(result);
      setHistory(`${history} ${currentValue} ${operation} `);
    } else {
      setPreviousValue(currentValue);
      setHistory(display + ' ' + op + ' ');
    }

    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (disabled) return;

    if (previousValue !== null && operation !== null) {
      const currentValue = parseFloat(display);
      const result = calculate(previousValue, currentValue, operation);

      const fullHistory = `${history}${currentValue} = ${result}`;
      setDisplay(result.toString());
      setHistory(fullHistory);
      setPreviousValue(null);
      setOperation(null);
      setShouldResetDisplay(true);

      // Notify parent with final result
      onCalculationChange(result, fullHistory);
    }
  };

  const handleClear = () => {
    if (disabled) return;

    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setHistory('');
    setShouldResetDisplay(false);
    onCalculationChange(null, '');
  };

  const handleBackspace = () => {
    if (disabled) return;

    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const calculate = (prev: number, current: number, op: string): number => {
    switch (op) {
      case '+':
        return prev + current;
      case '-':
        return prev - current;
      case '*':
        return prev * current;
      case '/':
        return current !== 0 ? prev / current : 0;
      default:
        return current;
    }
  };

  const Button = ({ value, onPress, style, textStyle }: any) => (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, textStyle]}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* History Display */}
      {history.length > 0 && (
        <View style={styles.historyContainer}>
          <Text style={styles.historyText} numberOfLines={1}>
            {history}
          </Text>
        </View>
      )}

      {/* Main Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit={true}>
          {display}
        </Text>
      </View>

      {/* Calculator Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1: C, ←, /, * */}
        <View style={styles.row}>
          <Button value="C" onPress={handleClear} style={styles.operationButton} textStyle={styles.operationButtonText} />
          <Button value="←" onPress={handleBackspace} style={styles.operationButton} textStyle={styles.operationButtonText} />
          <Button value="/" onPress={() => handleOperationPress('/')} style={styles.operationButton} textStyle={styles.operationButtonText} />
          <Button value="*" onPress={() => handleOperationPress('*')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 2: 7, 8, 9, - */}
        <View style={styles.row}>
          <Button value="7" onPress={() => handleNumberPress('7')} />
          <Button value="8" onPress={() => handleNumberPress('8')} />
          <Button value="9" onPress={() => handleNumberPress('9')} />
          <Button value="-" onPress={() => handleOperationPress('-')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 3: 4, 5, 6, + */}
        <View style={styles.row}>
          <Button value="4" onPress={() => handleNumberPress('4')} />
          <Button value="5" onPress={() => handleNumberPress('5')} />
          <Button value="6" onPress={() => handleNumberPress('6')} />
          <Button value="+" onPress={() => handleOperationPress('+')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 4: 1, 2, 3, = */}
        <View style={styles.row}>
          <Button value="1" onPress={() => handleNumberPress('1')} />
          <Button value="2" onPress={() => handleNumberPress('2')} />
          <Button value="3" onPress={() => handleNumberPress('3')} />
          <Button value="=" onPress={handleEquals} style={styles.equalsButton} textStyle={styles.equalsButtonText} />
        </View>

        {/* Row 5: 0 (wide) */}
        <View style={styles.row}>
          <Button value="0" onPress={() => handleNumberPress('0')} style={styles.zeroButton} />
          <View style={styles.button} />
          <View style={styles.button} />
          <View style={styles.button} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyContainer: {
    minHeight: 24,
    marginBottom: Spacing.xs,
  },
  historyText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  displayContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 60,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'right',
  },
  buttonsContainer: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  operationButton: {
    backgroundColor: Colors.primary + '20',
  },
  operationButtonText: {
    color: Colors.primary,
  },
  equalsButton: {
    backgroundColor: Colors.primary,
  },
  equalsButtonText: {
    color: Colors.primaryForeground,
  },
  zeroButton: {
    flex: 2,
  },
});
