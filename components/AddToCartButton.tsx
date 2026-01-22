import { IconMinus, IconPlus } from '@tabler/icons-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const COLORS = {
  primary: '#059669',
  primarySoft: '#ECFDF5',
  textLight: '#9CA3AF',
};

interface AddToCartButtonProps {
  quantity: number;
  onAdd: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  isOutOfStock?: boolean;
  isMaxLimitReached?: boolean;
  isStockLimitReached?: boolean;
  containerStyle?: object;
  size?: 'small' | 'large';
}

export default function AddToCartButton({
  quantity,
  onAdd,
  onIncrease,
  onDecrease,
  isOutOfStock = false,
  isMaxLimitReached = false,
  isStockLimitReached = false,
  containerStyle,
  size = 'small',
}: AddToCartButtonProps) {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 22 : 16;
  const textSize = isLarge ? 16 : (quantity > 0 ? 13 : 12);
  const qtyTextSize = isLarge ? 18 : 13;
  const qtyBtnWidth = isLarge ? 36 : 26;
  const bgColor = isLarge ? COLORS.primary : '#FFF';
  const textColor = isLarge ? '#FFF' : COLORS.primary;
  const borderRadius = isLarge ? 12 : 8;

  // Show quantity controls if quantity > 0
  if (quantity > 0) {
    return (
      <View style={[styles.qtyContainer, containerStyle, { borderRadius: borderRadius }]}>
        <TouchableOpacity onPress={onDecrease} style={[styles.qtyBtn, { width: qtyBtnWidth }]}>
          <IconMinus size={iconSize} strokeWidth={3} color={COLORS.primarySoft} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, { fontSize: qtyTextSize }]}>{quantity}</Text>
        <TouchableOpacity
          onPress={onIncrease}
          disabled={isOutOfStock || isStockLimitReached || isMaxLimitReached}
          style={[
            styles.qtyBtn,
            { width: qtyBtnWidth },
            (isOutOfStock || isStockLimitReached || isMaxLimitReached) &&
            styles.disabledOp,
          ]}
        >
          <IconPlus size={iconSize} strokeWidth={3} color={COLORS.primarySoft} />
        </TouchableOpacity>
      </View>
    );
  }

  // Show "Sold Out" if out of stock
  if (isOutOfStock) {
    return (
      <View style={[styles.outOfStockBtn, containerStyle]}>
        <Text style={[styles.outOfStockBtnText, { fontSize: isLarge ? 14 : 11 }]}>Sold Out</Text>
      </View>
    );
  }

  // Show "ADD" button
  return (
    <TouchableOpacity
      onPress={onAdd}
      disabled={isMaxLimitReached || isStockLimitReached}
      style={[
        styles.addBtn,
        containerStyle,
        (isMaxLimitReached || isStockLimitReached) && styles.disabledOp, { backgroundColor: bgColor, borderRadius: borderRadius },
      ]}
    >
      <Text style={[styles.addBtnText, { fontSize: textSize, color: textColor }]}>ADD</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qtyContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 26,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primarySoft,
  },
  outOfStockBtn: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  disabledOp: {
    opacity: 0.5,
  },
});
