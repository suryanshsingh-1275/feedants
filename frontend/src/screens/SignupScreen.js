import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '../api';
import { colors } from '../theme';

export default function SignupScreen({ onLoggedIn, goToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) return Alert.alert('Missing fields', 'Fill in all fields');
    setLoading(true);
    try {
      const data = await signup({ name, email, password, role });
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      onLoggedIn(data.user);
    } catch (err) {
      Alert.alert('Signup failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleRow}>
        <TouchableOpacity
          style={[styles.roleButton, role === 'participant' && styles.roleButtonActive]}
          onPress={() => setRole('participant')}
        >
          <Text style={[styles.roleText, role === 'participant' && styles.roleTextActive]}>Participant</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.roleButton, role === 'organizer' && styles.roleButtonActive]}
          onPress={() => setRole('organizer')}
        >
          <Text style={[styles.roleText, role === 'organizer' && styles.roleTextActive]}>Organizer</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goToLogin}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: colors.white
  },
  label: { color: colors.subtext, marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.white
  },
  roleButtonActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  roleText: { color: colors.subtext, fontWeight: '600' },
  roleTextActive: { color: colors.primary },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  link: { color: colors.primary, textAlign: 'center', marginTop: 16 }
});
