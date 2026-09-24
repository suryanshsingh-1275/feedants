import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import CompetitionListScreen from './src/screens/CompetitionListScreen';
import CompetitionDetailsScreen from './src/screens/CompetitionDetailsScreen';
import CreateCompetitionScreen from './src/screens/CreateCompetitionScreen';

// No navigation library — just a screen name in state. Keeps setup to
// "npm install" + "expo start" with nothing native to link.
export default function App() {
  const [screen, setScreen] = useState('login'); // login | signup | list | details | create
  const [user, setUser] = useState(null);
  const [activeCompetitionId, setActiveCompetitionId] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        setScreen('list');
      }
      setBooting(false);
    })();
  }, []);

  const handleLoggedIn = (u) => {
    setUser(u);
    setScreen('list');
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['token', 'user']);
    setUser(null);
    setScreen('login');
  };

  if (booting) return null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      {screen === 'login' && <LoginScreen onLoggedIn={handleLoggedIn} goToSignup={() => setScreen('signup')} />}
      {screen === 'signup' && <SignupScreen onLoggedIn={handleLoggedIn} goToLogin={() => setScreen('login')} />}
      {screen === 'list' && (
        <CompetitionListScreen
          user={user}
          onOpen={(id) => {
            setActiveCompetitionId(id);
            setScreen('details');
          }}
          onCreate={() => setScreen('create')}
          onLogout={handleLogout}
        />
      )}
      {screen === 'details' && (
        <CompetitionDetailsScreen competitionId={activeCompetitionId} onBack={() => setScreen('list')} />
      )}
      {screen === 'create' && (
        <CreateCompetitionScreen
          onCreated={() => setScreen('list')}
          onBack={() => setScreen('list')}
        />
      )}
    </SafeAreaView>
  );
}