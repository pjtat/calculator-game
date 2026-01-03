import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSizes, FontWeights } from '../../constants/theme';
import { lightTap, mediumTap, heavyTap } from '../../utils/haptics';

interface CalculatorProps {
  onCalculationChange: (value: number | null, history: string) => void;
  disabled?: boolean;
}

export default function Calculator({ onCalculationChange, disabled = false }: CalculatorProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [shouldResetDisplay, setShouldResetDisplay] = useState(false);

  // Notify parent of current display value whenever it changes
  useEffect(() => {
    const cleanValue = displayValue.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue)) {
      onCalculationChange(numValue, cleanValue);
    } else if (cleanValue === '') {
      onCalculationChange(null, '');
    }
  }, [displayValue]);

  const formatNumber = (num: string): string => {
    // Handle empty string
    if (num === '') return '';

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
    if (isNaN(numVal)) return '';
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
    lightTap();

    if (shouldResetDisplay) {
      setDisplayValue(num);
      setShouldResetDisplay(false);
    } else {
      const cleanValue = displayValue.replace(/,/g, '');
      setDisplayValue(cleanValue === '0' || cleanValue === '' ? num : cleanValue + num);
    }
  };

  const handleOperationPress = (op: string) => {
    if (disabled) return;
    mediumTap();

    const currentValue = parseFloat(displayValue.replace(/,/g, ''));

    if (previousValue !== null && operation !== null && !shouldResetDisplay) {
      // Perform the pending operation
      const result = calculate(previousValue, currentValue, operation);
      setPreviousValue(result);
      setDisplayValue('');
    } else {
      setPreviousValue(currentValue);
      setDisplayValue('');
    }

    setOperation(op);
    setShouldResetDisplay(true);
  };

  const handleEquals = () => {
    if (disabled) return;
    heavyTap();

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
    mediumTap();

    setDisplayValue('');
    setPreviousValue(null);
    setOperation(null);
    setShouldResetDisplay(false);
    onCalculationChange(null, '');
  };

  const handleBackspace = () => {
    if (disabled) return;
    lightTap();

    const cleanValue = displayValue.replace(/,/g, '');
    if (cleanValue.length > 1) {
      setDisplayValue(cleanValue.slice(0, -1));
    } else {
      setDisplayValue('');
    }
  };

  const handleDecimal = () => {
    if (disabled) return;
    lightTap();

    const cleanValue = displayValue.replace(/,/g, '');
    if (shouldResetDisplay) {
      setDisplayValue('0.');
      setShouldResetDisplay(false);
    } else if (!cleanValue.includes('.')) {
      setDisplayValue(cleanValue + '.');
    }
  };

  const handleToggleSign = () => {
    if (disabled) return;
    lightTap();

    const cleanValue = displayValue.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue) && numValue !== 0) {
      setDisplayValue((numValue * -1).toString());
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
          <Button value="÷" onPress={() => handleOperationPress('/')} style={[styles.operationButton, styles.divideButton]} textStyle={styles.operationButtonText} />
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

        {/* Row 5: +/-, 0, ., = */}
        <View style={styles.row}>
          <Button value="+/−" onPress={handleToggleSign} style={styles.clearButton} textStyle={styles.clearButtonText} />
          <Button value="0" onPress={() => handleNumberPress('0')} />
          <Button value="." onPress={handleDecimal} style={styles.clearButton} textStyle={styles.clearButtonText} />
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
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  displayContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    paddingRight: Spacing.md,
    marginBottom: Spacing.md,
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
    gap: 10,
    paddingBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 44,
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
    backgroundColor: 'rgba(60, 64, 76, 1)',
  },
  clearButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
  },
  wideButton: {
    flex: 1.5,
  },
  operationButton: {
    flex: 1,
    backgroundColor: Colors.primary + '20',
  },
  operationButtonText: {
    color: Colors.primary,
  },
  divideButton: {
    flex: 0.9,
  },
  equalsButton: {
    backgroundColor: Colors.primary,
  },
  equalsButtonText: {
    color: Colors.primaryForeground,
  },
});
