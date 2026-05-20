import { Lightbulb } from "lucide-react";

type KeyPointsBoxProps = {
  points: string[];
};

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  if (!points.length) return null;
  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 my-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-blue-700">要点总结</h4>
      </div>
      <ol className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="flex gap-3 text-sm text-blue-900">
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
