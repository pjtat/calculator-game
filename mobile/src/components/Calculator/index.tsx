import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../constants/theme';

interface CalculatorProps {
  onCalculationChange: (value: number | null, history: string) => void;
  disabled?: boolean;
}

export default function Calculator({ onCalculationChange, disabled = false }: CalculatorProps) {
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  const formatNumber = (num: string): string => {
    // Remove existing commas
    const cleanNum = num.replace(/,/g, '');

    // Handle decimals
    if (cleanNum.includes('.')) {
      const [intPart, decPart] = cleanNum.split('.');
      const formattedInt = parseFloat(intPart).toLocaleString('en-US');
      return `${formattedInt}.${decPart}`;
    }

    // Format integer
    const numVal = parseFloat(cleanNum);
    if (isNaN(numVal)) return '0';
    return numVal.toLocaleString('en-US');
  };

  const getDisplayText = (): string => {
    if (previousValue !== null && operation !== null) {
      const prevFormatted = formatNumber(previousValue.toString());
      const currFormatted = formatNumber(displayValue);
      return `${prevFormatted} ${operation} ${currFormatted}`;
    }
    return formatNumber(displayValue);
  };

  const handleNumberPress = (num: string) => {
    if (disabled) return;

    if (shouldResetDisplay) {
      setDisplayValue(num);
      setShouldResetDisplay(false);
    } else {
      const cleanValue = displayValue.replace(/,/g, '');
      setDisplayValue(cleanValue === '0' ? num : cleanValue + num);
    }
  };

  const handleOperationPress = (op: string) => {
    if (disabled) return;

    const currentValue = parseFloat(displayValue.replace(/,/g, ''));

    if (previousValue !== null && operation !== null && !shouldResetDisplay) {
      // Perform the pending operation
      const result = calculate(previousValue, currentValue, operation);
      setPreviousValue(result);
      setDisplayValue('0');
    } else {
      setPreviousValue(currentValue);
      setDisplayValue('0');
    }

    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (disabled) return;

    if (previousValue !== null && operation !== null) {
      const currentValue = parseFloat(displayValue.replace(/,/g, ''));
      const result = calculate(previousValue, currentValue, operation);

      setDisplayValue(result.toString());
      setPreviousValue(null);
      setOperation(null);
      setShouldResetDisplay(true);

      // Notify parent with final result
      const history = `${formatNumber(previousValue.toString())} ${operation} ${formatNumber(currentValue.toString())} = ${formatNumber(result.toString())}`;
      onCalculationChange(result, history);
    }
  };

  const handleClear = () => {
    if (disabled) return;

    setDisplayValue('0');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
    onCalculationChange(null, '');
  };

  const handleBackspace = () => {
    if (disabled) return;

    const cleanValue = displayValue.replace(/,/g, '');
    if (cleanValue.length > 1) {
      setDisplayValue(cleanValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  };

  const handleDecimal = () => {
    if (disabled) return;

    const cleanValue = displayValue.replace(/,/g, '');
    if (shouldResetDisplay) {
      setDisplayValue('0.');
      setShouldResetDisplay(false);
    } else if (!cleanValue.includes('.')) {
      setDisplayValue(cleanValue + '.');
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
      {/* Main Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit={true}>
          {getDisplayText()}
        </Text>
      </View>

      {/* Calculator Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1: ←, Clear, ÷ */}
        <View style={styles.row}>
          <Button value="←" onPress={handleBackspace} style={[styles.clearButton, styles.wideButton]} textStyle={styles.clearButtonText} />
          <Button value="Clear" onPress={handleClear} style={[styles.clearButton, styles.wideButton]} textStyle={styles.clearButtonText} />
          <Button value="÷" onPress={() => handleOperationPress('/')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 2: 7, 8, 9, × */}
        <View style={styles.row}>
          <Button value="7" onPress={() => handleNumberPress('7')} />
          <Button value="8" onPress={() => handleNumberPress('8')} />
          <Button value="9" onPress={() => handleNumberPress('9')} />
          <Button value="×" onPress={() => handleOperationPress('*')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 3: 4, 5, 6, - */}
        <View style={styles.row}>
          <Button value="4" onPress={() => handleNumberPress('4')} />
          <Button value="5" onPress={() => handleNumberPress('5')} />
          <Button value="6" onPress={() => handleNumberPress('6')} />
          <Button value="-" onPress={() => handleOperationPress('-')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 4: 1, 2, 3, + */}
        <View style={styles.row}>
          <Button value="1" onPress={() => handleNumberPress('1')} />
          <Button value="2" onPress={() => handleNumberPress('2')} />
          <Button value="3" onPress={() => handleNumberPress('3')} />
          <Button value="+" onPress={() => handleOperationPress('+')} style={styles.operationButton} textStyle={styles.operationButtonText} />
        </View>

        {/* Row 5: 0 (wide), ., = */}
        <View style={styles.row}>
          <Button value="0" onPress={() => handleNumberPress('0')} style={styles.zeroButton} />
          <Button value="." onPress={handleDecimal} />
          <Button value="=" onPress={handleEquals} style={styles.equalsButton} textStyle={styles.equalsButtonText} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  displayContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
  },
  displayText: {
    fontSize: 24,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    textAlign: 'right',
  },
  buttonsContainer: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 52,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
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
  clearButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  clearButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  wideButton: {
    flex: 1.5,
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
