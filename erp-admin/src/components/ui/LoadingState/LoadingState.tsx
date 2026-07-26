import { LoadingStateProps } from "./LoadingState.types";

export default function LoadingState({}: LoadingStateProps) {
  return (
    <div className="w-full animate-pulse">
     
      <div className="space-y-8">
        {[1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-8"
          >
            <div className="h-15 w-12 rounded-lg bg-gray-400" />

            <div className="h-4 w-40 rounded-full bg-gray-400" />

            <div className="h-4 w-40 rounded-full bg-gray-400" />

            <div className="h-4 w-40 rounded-full bg-gray-400" />

            <div className="h-4 w-35 rounded-full bg-gray-400" />

            <div className="h-4 w-35 rounded-full bg-gray-400" />
          </div>
        ))}
      </div>
    </div>
  );
}