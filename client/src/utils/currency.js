// Currency utility functions
export const formatCurrency = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '₹0';
  
  // Format with Indian numbering system (lakhs, crores)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numAmount);
};

export const formatPrice = (amount) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return '₹0';
  
  // Simple format without decimals for whole numbers
  if (numAmount % 1 === 0) {
    return `₹${numAmount.toLocaleString('en-IN')}`;
  }
  return `₹${numAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
