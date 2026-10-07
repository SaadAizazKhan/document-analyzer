import React, { useState } from 'react';
import { Check, X, UserPlus, HelpCircle } from 'lucide-react';
import { AssignedDoctor, MatchEvaluation } from '../types/analyzer';

interface ReviewQueueModalProps {
  reviewQueue: MatchEvaluation[];
  assignedDoctors: AssignedDoctor[];
  onConfirmMatch: (activityId: string) => void;
  onRejectMatch: (activityId: string) => void;
  onAssignDoctor: (activityId: string, doctorId: string) => void;
  onClose: () => void;
}

export const ReviewQueueModal: React.FC<ReviewQueueModalProps> = ({
  reviewQueue,
  assignedDoctors,
  onConfirmMatch,
  onRejectMatch,
  onAssignDoctor,
  onClose,
}) => {
  const [selectedDoctorMap, setSelectedDoctorMap] = useState<Record<string, string>>({});

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              Manual Match Review Queue ({reviewQueue.length} items)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>

        {/* Description */}
        <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200 text-xs text-amber-900 leading-relaxed">
          The records below have a similarity score between <strong>70%–84%</strong> or multiple candidates. Confirm the match, mark as unassigned, or select the correct assigned master doctor.
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {reviewQueue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic">
              All daily report activities have been resolved with high confidence. No pending items in review queue!
            </div>
          ) : (
            reviewQueue.map((item) => {
              const matched = item.matchedDoctor;
              return (
                <div
                  key={item.activityId}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-md hover:border-slate-300 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-slate-400">
                        Daily Report Row
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {item.reason}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        Score: {item.score}%
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Doctor Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 p-3 bg-white border border-slate-200 rounded text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Possible Master Doctor
                      </span>
                      <span className="font-bold text-slate-900 block mt-0.5">
                        {matched ? matched.rawName : 'None Suggested'}
                      </span>
                      {matched && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Category {matched.category} • {matched.city} • {matched.hospital}
                        </div>
                      )}
                    </div>

                    {/* Manual Override Dropdown */}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Or Re-assign to Master Doctor
                      </span>
                      <select
                        value={selectedDoctorMap[item.activityId] || (matched ? matched.id : '')}
                        onChange={(e) => {
                          setSelectedDoctorMap({
                            ...selectedDoctorMap,
                            [item.activityId]: e.target.value,
                          });
                        }}
                        className="w-full mt-1 text-xs px-2 py-1 bg-white border border-slate-300 rounded"
                      >
                        <option value="">-- Choose Assigned Doctor --</option>
                        {assignedDoctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.rawName} ({doc.category} - {doc.city})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => onRejectMatch(item.activityId)}
                      className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded border border-rose-300 text-rose-700 hover:bg-rose-50 transition"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Mark as Unassigned
                    </button>

                    {selectedDoctorMap[item.activityId] && selectedDoctorMap[item.activityId] !== matched?.id && (
                      <button
                        onClick={() => {
                          onAssignDoctor(item.activityId, selectedDoctorMap[item.activityId]);
                        }}
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white transition"
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Apply Reassignment
                      </button>
                    )}

                    {matched && (
                      <button
                        onClick={() => onConfirmMatch(item.activityId)}
                        className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Confirm Match ({matched.rawName})
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Confirmed matches automatically recalculate compliance metrics.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold transition"
          >
            Close Queue
          </button>
        </div>
      </div>
    </div>
  );
};
