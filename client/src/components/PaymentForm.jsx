import { useState } from 'react';

function detectCardBrand(number) {
  const cleaned = number.replace(/\s/g, '');
  if (/^4/.test(cleaned)) return 'Visa';
  if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
  if (/^3[47]/.test(cleaned)) return 'Amex';
  if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
  return null;
}

function formatCardNumber(value) {
  const cleaned = value.replace(/\s/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

function formatExpiry(value) {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + (cleaned.length > 2 ? '/' + cleaned.slice(2, 4) : '');
  }
  return cleaned;
}

export default function PaymentForm({ amount, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [errors, setErrors] = useState({});

  const cardBrand = detectCardBrand(formData.cardNumber);

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s/g, '');
    if (/^\d*$/.test(value) && value.length <= 16) {
      setFormData(prev => ({
        ...prev,
        cardNumber: formatCardNumber(value)
      }));
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: null }));
      }
    }
  };

  const handleExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setFormData(prev => ({
        ...prev,
        expiry: formatExpiry(value)
      }));
      if (errors.expiry) {
        setErrors(prev => ({ ...prev, expiry: null }));
      }
    }
  };

  const handleCvcChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 4) {
      setFormData(prev => ({ ...prev, cvc: value }));
      if (errors.cvc) {
        setErrors(prev => ({ ...prev, cvc: null }));
      }
    }
  };

  const handleNameChange = (e) => {
    setFormData(prev => ({ ...prev, name: e.target.value }));
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const cleanedNumber = formData.cardNumber.replace(/\s/g, '');
    if (!cleanedNumber || cleanedNumber.length < 13) {
      newErrors.cardNumber = 'Invalid card number';
    }

    const expiryParts = formData.expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      newErrors.expiry = 'Invalid expiry date (MM/YY)';
    } else {
      const month = parseInt(expiryParts[0]);
      if (month < 1 || month > 12) {
        newErrors.expiry = 'Invalid month';
      }
    }

    if (!formData.cvc || formData.cvc.length < 3) {
      newErrors.cvc = 'Invalid CVC';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const expiryParts = formData.expiry.split('/');
    const cleanedNumber = formData.cardNumber.replace(/\s/g, '');

    onSubmit({
      number: cleanedNumber,
      exp_month: expiryParts[0],
      exp_year: '20' + expiryParts[1],
      cvc: formData.cvc,
      name: formData.name
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.cardNumber}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
            className={`input ${errors.cardNumber ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          {cardBrand && (
            <span className="absolute right-3 top-2.5 text-sm font-medium text-gray-600">
              {cardBrand}
            </span>
          )}
        </div>
        {errors.cardNumber && (
          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Test: 4242 4242 4242 4242 (Success) or 4000 0000 0000 0002 (Declined)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            type="text"
            value={formData.expiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            className={`input ${errors.expiry ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          {errors.expiry && (
            <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <input
            type="text"
            value={formData.cvc}
            onChange={handleCvcChange}
            placeholder="123"
            className={`input ${errors.cvc ? 'border-red-500' : ''}`}
            disabled={loading}
          />
          {errors.cvc && (
            <p className="text-red-500 text-xs mt-1">{errors.cvc}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name on Card
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="John Smith"
          className={`input ${errors.name ? 'border-red-500' : ''}`}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full btn btn-primary py-3 text-lg ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}
