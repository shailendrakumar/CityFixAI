import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Card, H1, Body } from '../src/components/ui';
import { apiFetch } from '../src/services/api';
import { useAppStore } from '../src/stores/appStore';

type Badge = { id: string; name: string; description?: string; icon?: string; points_reward: number; is_demo: boolean };
type Challenge = { id: string; title: string; description?: string; goal_type: string; target_count: number; reward_points: number };
type Campaign = { id: string; title: string; description?: string; status: string; location?: string };
type Announcement = { id: string; title: string; body: string; priority: string };

export default function Rewards() {
  const user = useAppStore((s) => s.user);
  const uid = user?.id ?? 'demo-citizen-1';
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earned, setEarned] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, ub, ch, cp, an, pt] = await Promise.all([
          apiFetch('/badges').then((r) => r.json()),
          apiFetch(`/users/${uid}/badges`).then((r) => r.json()),
          apiFetch('/challenges').then((r) => r.json()),
          apiFetch('/campaigns').then((r) => r.json()),
          apiFetch('/announcements').then((r) => r.json()),
          apiFetch(`/points/${uid}`).then((r) => r.json()),
        ]);
        setBadges(Array.isArray(b) ? b : []);
        setEarned(Array.isArray(ub) ? ub.map((x: any) => x.badge_id) : []);
        setChallenges(Array.isArray(ch) ? ch : []);
        setCampaigns(Array.isArray(cp) ? cp : []);
        setAnnouncements(Array.isArray(an) ? an : []);
        setPoints(pt?.points ?? 0);
      } catch {
        setBadges([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  if (loading) {
    return (
      <ScrollView className="flex-1 bg-forest-50 px-5 pt-14">
        <H1>Rewards & Achievements</H1>
        <ActivityIndicator className="mt-6" />
      </ScrollView>
    );
  }

  return (
    <ScrollView className="flex-1 bg-forest-50 px-5 pt-14" accessibilityLabel="Rewards and achievements">
      <H1>Rewards & Achievements</H1>
      <Body className="mt-2 mb-4">Earn badges and points for civic contributions. Synthetic demo data.</Body>
      <Card className="mb-4">
        <Text className="font-semibold text-forest-800">Your points: {points}</Text>
      </Card>

      <Text className="font-bold text-forest-900 mb-2">Badges</Text>
      {badges.map((b) => {
        const isEarned = earned.includes(b.id);
        return (
          <Card key={b.id} className={`mb-3 ${isEarned ? 'bg-emerald-50' : 'opacity-60'}`}>
            <Text className="font-semibold text-forest-800">{isEarned ? '🏅' : '🔒'} {b.icon} {b.name}</Text>
            <Text className="text-gray-600 text-sm mt-1">{b.description}</Text>
            {b.points_reward ? <Text className="text-xs text-emerald-600 mt-1">+{b.points_reward} pts</Text> : null}
          </Card>
        );
      })}

      <Text className="font-bold text-forest-900 mt-4 mb-2">Monthly Challenges</Text>
      {challenges.map((ch) => (
        <Card key={ch.id} className="mb-3">
          <Text className="font-semibold text-forest-800">🎯 {ch.title}</Text>
          <Text className="text-gray-600 text-sm mt-1">{ch.description}</Text>
          <Text className="text-xs text-emerald-600 mt-1">Goal: {ch.target_count} {ch.goal_type} · Reward {ch.reward_points} pts</Text>
        </Card>
      ))}

      <Text className="font-bold text-forest-900 mt-4 mb-2">Cleanup Campaigns</Text>
      {campaigns.map((cp) => (
        <Card key={cp.id} className="mb-3">
          <Text className="font-semibold text-forest-800">🧹 {cp.title}</Text>
          <Text className="text-gray-600 text-sm mt-1">{cp.description}</Text>
          <Text className="text-xs text-gray-500 mt-1">{cp.location} · {cp.status}</Text>
        </Card>
      ))}

      <Text className="font-bold text-forest-900 mt-4 mb-2">Community Announcements</Text>
      {announcements.map((a) => (
        <Card key={a.id} className="mb-3">
          <Text className="font-semibold text-forest-800">{a.title}</Text>
          <Text className="text-gray-600 text-sm mt-1">{a.body}</Text>
        </Card>
      ))}

      <View className="h-8" />
    </ScrollView>
  );
}

