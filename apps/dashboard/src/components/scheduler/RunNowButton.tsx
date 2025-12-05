/**
 * Run Now Button Component (Sprint S42)
 * Button for manually triggering a scheduler task
 */

interface RunNowButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isRunning?: boolean;
}

export function RunNowButton({ onClick, disabled, isRunning }: RunNowButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isRunning}
      className={`px-3 py-1 text-sm font-medium rounded-md ${
        disabled || isRunning
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {isRunning ? 'Running...' : 'Run Now'}
    </button>
  );
}
