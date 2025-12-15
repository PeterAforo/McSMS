import { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Zap, ChevronRight, Crown, Award, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../../config';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

/**
 * Gamification Widget
 * Displays leaderboard, recent achievements, and XP progress
 */
export default function GamificationWidget({ studentId = null, classId = null, showLeaderboard = true }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('leaderboard');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [studentId, classId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const promises = [
        axios.get(`${API_BASE_URL}/gamification.php?action=leaderboard&limit=10${classId ? `&class_id=${classId}` : ''}`),
        axios.get(`${API_BASE_URL}/gamification.php?action=recent_achievements&limit=5${classId ? `&class_id=${classId}` : ''}`)
      ];
      
      if (studentId) {
        promises.push(axios.get(`${API_BASE_URL}/gamification.php?action=profile&student_id=${studentId}`));
      }
      
      const results = await Promise.all(promises);
      
      setLeaderboard(results[0].data.leaderboard || []);
      setAchievements(results[1].data.achievements || []);
      if (results[2]) {
        setProfile(results[2].data.profile || null);
      }
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">{rank}</span>;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500';
      case 'rare':
        return 'from-purple-400 to-purple-600';
      case 'uncommon':
        return 'from-blue-400 to-blue-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-500 to-indigo-600">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Achievements & Rewards</h3>
            <p className="text-xs text-white/80">Earn XP, unlock badges, climb the leaderboard!</p>
          </div>
        </div>

        {/* Student Profile Summary */}
        {profile && (
          <div className="mt-4 p-3 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-white font-bold">{profile.total_xp} XP</span>
                  <span className="text-white/60 text-sm">• Level {profile.level}</span>
                </div>
                <div className="mt-1 w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${profile.level_progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="text-white/80 text-xs">Rank</div>
                <div className="text-white font-bold text-xl">#{profile.rank}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'leaderboard'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Trophy className="w-4 h-4 inline mr-1" />
          Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'achievements'
              ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Award className="w-4 h-4 inline mr-1" />
          Recent
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center">
                <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No rankings yet</p>
              </div>
            ) : (
              leaderboard.map((student, index) => (
                <div
                  key={student.student_id}
                  className={`p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                    index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent dark:from-yellow-900/10' : ''
                  }`}
                  onClick={() => navigate(`/admin/students/${student.student_id}`)}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(student.rank)}
                  </div>

                  {/* Avatar */}
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {student.name.charAt(0)}
                      </span>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Level {student.level} • {student.badge_count} badges
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <Zap className="w-4 h-4" />
                      <span className="font-bold text-sm">{student.total_xp}</span>
                    </div>
                    <p className="text-xs text-gray-400">XP</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {achievements.length === 0 ? (
              <div className="p-8 text-center">
                <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent achievements</p>
              </div>
            ) : (
              achievements.map((achievement, index) => (
                <div
                  key={index}
                  className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {/* Badge Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.badge.rarity)} flex items-center justify-center text-2xl shadow-lg`}>
                    {achievement.badge.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white">
                      {achievement.student_name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Earned <span className="font-medium text-purple-600 dark:text-purple-400">{achievement.badge.name}</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {achievement.class_name} • {formatTimeAgo(achievement.earned_at)}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">+{achievement.badge.xp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={() => navigate('/admin/gamification')}
          className="w-full text-center text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium flex items-center justify-center gap-1"
        >
          View All Achievements
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Badge Display Component
 */
export function BadgeDisplay({ badge, size = 'md', showDetails = true }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl'
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'legendary':
        return 'from-yellow-400 to-orange-500 ring-yellow-400';
      case 'rare':
        return 'from-purple-400 to-purple-600 ring-purple-400';
      case 'uncommon':
        return 'from-blue-400 to-blue-600 ring-blue-400';
      default:
        return 'from-gray-400 to-gray-500 ring-gray-400';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br ${getRarityColor(badge.rarity)} flex items-center justify-center shadow-lg ring-2 ring-offset-2 dark:ring-offset-gray-800`}>
        {badge.icon}
      </div>
      {showDetails && (
        <div>
          <p className="font-medium text-gray-900 dark:text-white">{badge.name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
              badge.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
              badge.rarity === 'rare' ? 'bg-purple-100 text-purple-700' :
              badge.rarity === 'uncommon' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {badge.rarity}
            </span>
            <span className="text-xs text-gray-400">+{badge.xp} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * XP Progress Bar Component
 */
export function XPProgressBar({ currentXP, level, nextLevelXP, className = '' }) {
  const progress = ((currentXP % 1000) / 1000) * 100;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Level {level}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
