interface SwapExecuteButtonProps {
  type: 'deposit' | 'withdraw';
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export default function SwapExecuteButton({
  type,
  disabled,
  loading,
  onClick,
}: SwapExecuteButtonProps) {
  const buttonText = {
    deposit: '포인트 → 토큰 교환',
    withdraw: '토큰 → 포인트 교환',
  };

  const buttonColor = {
    deposit: 'bg-blue-600 hover:bg-blue-700',
    withdraw: 'bg-green-600 hover:bg-green-700',
  };

  return (
    <button
      type="submit"
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        w-full px-4 py-2 rounded-md font-medium text-white
        ${disabled || loading
          ? 'bg-gray-400 cursor-not-allowed'
          : buttonColor[type]
        }
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          교환 중...
        </div>
      ) : (
        buttonText[type]
      )}
    </button>
  );
}
