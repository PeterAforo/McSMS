import { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import { 
  Link2, Copy, Check, Clock, Users, Share2, 
  QrCode, AlertCircle, X, UserPlus 
} from 'lucide-react';

export default function FamilyLinkCode({ parentId, children, onLinkSuccess }) {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'use'
  const [selectedChild, setSelectedChild] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [linkCode, setLinkCode] = useState('');
  const [relationship, setRelationship] = useState('guardian');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const generateCode = async () => {
    if (!selectedChild) {
      setError('Please select a child');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedCode(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=generate_link_code`, {
        parent_id: parentId,
        student_id: selectedChild
      });

      if (response.data.success) {
        setGeneratedCode({
          code: response.data.link_code,
          expiresAt: response.data.expires_at
        });
        setSuccess('Link code generated successfully!');
      } else {
        setError(response.data.error || 'Failed to generate code');
      }
    } catch (err) {
      setError('Failed to generate link code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useCode = async () => {
    if (!linkCode.trim()) {
      setError('Please enter a link code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/parent_portal.php?resource=use_link_code`, {
        parent_id: parentId,
        link_code: linkCode.trim().toUpperCase(),
        relationship: relationship
      });

      if (response.data.success) {
        setSuccess(response.data.message || 'Successfully linked to child!');
        setLinkCode('');
        if (onLinkSuccess) {
          onLinkSuccess(response.data.child_id);
        }
      } else {
        setError(response.data.error || 'Failed to use link code');
      }
    } catch (err) {
      setError('Failed to link. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode?.code) {
      navigator.clipboard.writeText(generatedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareCode = () => {
    if (generatedCode?.code && navigator.share) {
      navigator.share({
        title: 'Family Link Code',
        text: `Use this code to link to our child's school portal: ${generatedCode.code}`,
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Family Link</h2>
            <p className="text-purple-100 text-sm">Connect multiple parents to your children</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('generate'); setError(''); setSuccess(''); }}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'generate'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <QrCode className="w-4 h-4" />
          Generate Code
        </button>
        <button
          onClick={() => { setActiveTab('use'); setError(''); setSuccess(''); }}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'use'
              ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Use Code
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'generate' ? (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Generate a unique code to share with your spouse or another guardian. 
              They can use this code to link their account to your child.
            </p>

            {/* Child Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Child
              </label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Choose a child...</option>
                {children?.map((child) => (
                  <option key={child.id || child.student_id} value={child.id || child.student_id}>
                    {child.full_name || `${child.first_name} ${child.last_name}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateCode}
              disabled={loading || !selectedChild}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Generate Link Code
                </>
              )}
            </button>

            {/* Generated Code Display */}
            {generatedCode && (
              <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600 mb-2">Your Family Link Code</p>
                  <div className="text-3xl font-mono font-bold text-purple-700 tracking-wider">
                    {generatedCode.code}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                  <Clock className="w-4 h-4" />
                  <span>Expires: {new Date(generatedCode.expiresAt).toLocaleDateString()}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-2 px-4 bg-white border border-purple-300 rounded-lg text-purple-700 font-medium hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  {navigator.share && (
                    <button
                      onClick={shareCode}
                      className="flex-1 py-2 px-4 bg-white border border-purple-300 rounded-lg text-purple-700 font-medium hover:bg-purple-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Enter the family link code shared by your spouse or the primary guardian 
              to connect to your child's profile.
            </p>

            {/* Link Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Code
              </label>
              <input
                type="text"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                placeholder="e.g., FAM-ABC123"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-lg tracking-wider uppercase"
              />
            </div>

            {/* Relationship Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Relationship
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="father">Father</option>
                <option value="mother">Mother</option>
                <option value="guardian">Guardian</option>
                <option value="grandparent">Grandparent</option>
                <option value="uncle">Uncle</option>
                <option value="aunt">Aunt</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Use Code Button */}
            <button
              onClick={useCode}
              disabled={loading || !linkCode.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Link to Child
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
