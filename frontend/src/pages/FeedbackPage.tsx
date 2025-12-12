import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCreateFeedback, useMyFeedback } from '../hooks/useFeedback';
import {
  FeedbackType,
  FeedbackPriority,
  feedbackTypeLabels,
  feedbackPriorityLabels,
  feedbackStatusLabels,
  feedbackStatusColors,
  feedbackPriorityColors,
} from '../types/feedback';
import type { CreateFeedbackRequest, Feedback } from '../types/feedback';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

// AI prompts for requirement refinement
const AI_SYSTEM_PROMPTS: Record<FeedbackType, string[]> = {
  [FeedbackType.Bug]: [
    "I'd like to help you report this bug clearly. What were you trying to do when you encountered this issue?",
    "Can you describe what happened versus what you expected to happen?",
    "Does this happen every time, or only sometimes? Are there specific conditions that trigger it?",
    "What browser and device are you using?",
  ],
  [FeedbackType.Enhancement]: [
    "I'd like to help you describe this enhancement clearly. What problem or need does this feature address?",
    "Who would benefit from this feature? (e.g., all users, admins, project managers)",
    "Can you describe how you envision this feature working? What would the ideal user experience look like?",
    "Are there any existing features in other tools that are similar to what you're looking for?",
  ],
  [FeedbackType.Question]: [
    "I'd like to help answer your question. Can you provide more context about what you're trying to accomplish?",
    "What have you already tried or looked at?",
  ],
  [FeedbackType.Other]: [
    "I'd like to understand your feedback better. Can you tell me more about what prompted this?",
  ],
};

export default function FeedbackPage() {
  const navigate = useNavigate();
  const createFeedback = useCreateFeedback();
  const { data: myFeedback, isLoading: loadingFeedback } = useMyFeedback();

  const [type, setType] = useState<FeedbackType>(FeedbackType.Bug);
  const [priority, setPriority] = useState<FeedbackPriority>(FeedbackPriority.Medium);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');

  // AI Assistant state
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const startAiAssistant = () => {
    setShowAiAssistant(true);
    const prompts = AI_SYSTEM_PROMPTS[type];
    if (prompts.length > 0) {
      setAiMessages([{ role: 'assistant', content: prompts[0] }]);
      setCurrentPromptIndex(0);
    }
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;

    const newMessages = [...aiMessages, { role: 'user' as const, content: aiInput }];
    setAiMessages(newMessages);
    setAiInput('');

    const prompts = AI_SYSTEM_PROMPTS[type];
    const nextIndex = currentPromptIndex + 1;

    if (nextIndex < prompts.length) {
      // Add next prompt after a brief delay
      setTimeout(() => {
        setAiMessages((prev) => [...prev, { role: 'assistant' as const, content: prompts[nextIndex] }]);
        setCurrentPromptIndex(nextIndex);
      }, 500);
    } else {
      // Generate summary
      setTimeout(() => {
        const summary = generateSummary(newMessages);
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant' as const,
            content: `Thank you for those details! Here's a summary of your ${feedbackTypeLabels[type].toLowerCase()}:\n\n${summary}\n\nI'll pre-fill the form with this information. Feel free to edit anything before submitting.`,
          },
        ]);
        // Pre-fill form fields
        prefillForm(newMessages);
      }, 500);
    }
  };

  const generateSummary = (messages: AiMessage[]) => {
    const userResponses = messages.filter((m) => m.role === 'user').map((m) => m.content);
    return userResponses.map((r, i) => `${i + 1}. ${r}`).join('\n');
  };

  const prefillForm = (messages: AiMessage[]) => {
    const userResponses = messages.filter((m) => m.role === 'user');
    if (userResponses.length > 0) {
      setDescription(userResponses.map((m) => m.content).join('\n\n'));
    }
    if (type === FeedbackType.Bug && userResponses.length >= 2) {
      setActualBehavior(userResponses[0]?.content || '');
      setExpectedBehavior(userResponses[1]?.content || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const browserInfo = `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`;

    const request: CreateFeedbackRequest = {
      type,
      priority,
      title,
      description,
      pageUrl: window.location.href,
      stepsToReproduce: type === FeedbackType.Bug ? stepsToReproduce : undefined,
      expectedBehavior: type === FeedbackType.Bug ? expectedBehavior : undefined,
      actualBehavior: type === FeedbackType.Bug ? actualBehavior : undefined,
      browserInfo,
      aiConversationHistory: aiMessages.length > 0 ? JSON.stringify(aiMessages) : undefined,
      refinedRequirements: aiMessages.length > 0 ? generateSummary(aiMessages) : undefined,
    };

    await createFeedback.mutateAsync(request);
    // Reset form
    setTitle('');
    setDescription('');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
    setAiMessages([]);
    setShowAiAssistant(false);
    setActiveTab('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/apps" className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Apps
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Feedback & Support</h1>
            <p className="text-gray-600">Report bugs, suggest enhancements, or ask questions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Submit New
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Submissions ({myFeedback?.length || 0})
          </button>
        </div>

        {activeTab === 'new' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Assistant Panel */}
            {showAiAssistant && (
              <div className="lg:col-span-1 bg-white rounded-lg shadow p-4 h-fit">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">AI Assistant</h3>
                  <button
                    onClick={() => setShowAiAssistant(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-3 max-h-80 overflow-y-auto mb-3">
                  {aiMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        msg.role === 'assistant'
                          ? 'bg-blue-50 text-blue-900'
                          : 'bg-gray-100 text-gray-900 ml-4'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                    placeholder="Type your response..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAiSend}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            <div className={`${showAiAssistant ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white rounded-lg shadow p-6`}>
              <form onSubmit={handleSubmit}>
                {/* Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(feedbackTypeLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setType(Number(key) as FeedbackType);
                          setAiMessages([]);
                          setShowAiAssistant(false);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          type === Number(key)
                            ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Assistant Button */}
                {!showAiAssistant && (
                  <button
                    type="button"
                    onClick={startAiAssistant}
                    className="mb-6 w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Use AI to help write better requirements
                  </button>
                )}

                {/* Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Brief summary of your feedback"
                  />
                </div>

                {/* Priority */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <div className="flex gap-2">
                    {Object.entries(feedbackPriorityLabels).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(Number(key) as FeedbackPriority)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          priority === Number(key)
                            ? feedbackPriorityColors[Number(key) as FeedbackPriority] + ' ring-2 ring-offset-1 ring-gray-400'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Provide details about your feedback..."
                  />
                </div>

                {/* Bug-specific fields */}
                {type === FeedbackType.Bug && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Steps to Reproduce</label>
                      <textarea
                        value={stepsToReproduce}
                        onChange={(e) => setStepsToReproduce(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Behavior</label>
                        <textarea
                          value={expectedBehavior}
                          onChange={(e) => setExpectedBehavior(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="What should have happened?"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Behavior</label>
                        <textarea
                          value={actualBehavior}
                          onChange={(e) => setActualBehavior(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="What actually happened?"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/apps')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createFeedback.isPending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* History Tab */
          <div className="bg-white rounded-lg shadow">
            {loadingFeedback ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : myFeedback && myFeedback.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {myFeedback.map((feedback: Feedback) => (
                  <div key={feedback.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{feedback.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{feedback.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${feedbackStatusColors[feedback.status]}`}>
                            {feedbackStatusLabels[feedback.status]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${feedbackPriorityColors[feedback.priority]}`}>
                            {feedbackPriorityLabels[feedback.priority]}
                          </span>
                          <span className="text-xs text-gray-400">
                            {feedbackTypeLabels[feedback.type]}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {feedback.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                        <strong>Admin Response:</strong> {feedback.adminNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No feedback submitted yet. Use the form above to submit your first feedback!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
