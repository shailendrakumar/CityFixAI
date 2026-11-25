import { Pressable, Text, View } from 'react-native';

export function Screen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`flex-1 bg-white ${className}`}>{children}</View>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`bg-white rounded-2xl p-4 shadow-sm border border-forest-100 ${className}`}>{children}</View>;
}

export function Button({ title, onPress, variant = 'primary', className = '' }: { title: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'ghost'; className?: string }) {
  const base = 'rounded-xl py-3 px-4 items-center justify-center';
  const styles = variant === 'primary' ? 'bg-forest-600' : variant === 'secondary' ? 'bg-emerald-100' : 'bg-transparent';
  const text = variant === 'primary' ? 'text-white' : variant === 'secondary' ? 'text-forest-700' : 'text-forest-600';
  return (
    <Pressable onPress={onPress} className={`${base} ${styles} ${className}`}>
      <Text className={`font-semibold ${text}`}>{title}</Text>
    </Pressable>
  );
}

export function Input({ placeholder, value, onChangeText, className = '', ...rest }: any) {
  return (
    <View className={`border border-forest-200 rounded-xl px-4 py-3 bg-forest-50 ${className}`}>
      <Text className="text-forest-400 text-xs mb-1">{placeholder}</Text>
    </View>
  );
}

export function H1({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-2xl font-bold text-forest-900 ${className}`}>{children}</Text>;
}

export function H2({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-lg font-semibold text-forest-800 ${className}`}>{children}</Text>;
}

export function Body({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <Text className={`text-sm text-gray-600 ${className}`}>{children}</Text>;
}

export function Badge({ label, color = 'forest' }: { label: string; color?: string }) {
  return (
    <View className={`px-2 py-1 rounded-full bg-${color}-100`}>
      <Text className={`text-xs font-semibold text-${color}-700`}>{label}</Text>
    </View>
  );
}
