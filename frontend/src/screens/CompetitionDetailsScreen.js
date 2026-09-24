import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  TextInput,
  Modal
} from 'react-native';
import { getCompetitionDetails, registerForCompetition, submitEntry } from '../api';
import { colors } from '../theme';

const formatDate = (iso) => {
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
};

const formatCountdown = (ms) => {
  if (ms <= 0) return 'Closed';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d : ${hours}h : ${minutes}m : ${seconds}s`;
};

const TABS = ['About', 'Judging', 'Rules'];

export default function CompetitionDetailsScreen({ competitionId, onBack }) {
  const [comp, setComp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [tab, setTab] = useState('About');
  const [busy, setBusy] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getCompetitionDetails(competitionId);
      setComp(data);
      setCountdown(data.registrationClosesInMs);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    load();
  }, [load]);

  // Purely visual client-side ticking between refetches — the number that
  // matters (registrationClosesInMs) always comes from the server.
  useEffect(() => {
    if (!comp) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [comp]);

  const handleRegister = async () => {
    setBusy(true);
    try {
      await registerForCompetition(competitionId);
      Alert.alert('Success', 'You are registered!');
      await load();
    } catch (err) {
      Alert.alert('Could not register', err.message);
    } finally {
      setBusy(false);
    }
  };

  const openSubmitModal = () => {
    setSubmissionUrl('');
    setSubmitModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!submissionUrl.trim()) return;
    setBusy(true);
    try {
      await submitEntry(competitionId, submissionUrl.trim());
      setSubmitModalVisible(false);
      Alert.alert('Submitted', 'Your entry has been submitted.');
      await load();
    } catch (err) {
      Alert.alert('Could not submit', err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading || !comp) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const spotsBarWidth = `${Math.max(100 - (comp.spotsLeft / comp.totalSpots) * 100, 4)}%`;

  const renderActionButton = () => {
    let label = '';
    let disabled = true;
    let onPress = null;

    if (comp.hasSubmitted) {
      label = 'Submission Received';
    } else if (comp.canSubmit) {
      label = 'Upload Submission';
      disabled = false;
      onPress = openSubmitModal;
    } else if (comp.isRegistered) {
      label = 'Registered · Waiting for Submission Window';
    } else if (comp.canRegister) {
      label = `Register · ₹${comp.entryFee}`;
      disabled = false;
      onPress = handleRegister;
    } else if (comp.spotsLeft <= 0) {
      label = 'Spots Full';
    } else {
      label = 'Registration Closed';
    }

    return (
      <TouchableOpacity
        style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
        disabled={disabled || busy}
        onPress={onPress}
      >
        <Text style={styles.actionButtonText}>{busy ? 'Please wait...' : label}</Text>
      </TouchableOpacity>
    );
  };

  const tabContent = {
    About: comp.aboutText,
    Judging: comp.judgingParams,
    Rules: comp.rulesEligibility
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.back}>← Go back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{comp.title}</Text>
            {comp.isRegistered && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Registered</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsRow}>
            {(comp.tags || []).map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statLabel}>Prize Pool</Text>
              <Text style={styles.statValue}>₹{comp.prizePool}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Entry Fee</Text>
              <Text style={styles.statValue}>₹{comp.entryFee}</Text>
            </View>
          </View>

          <Text style={styles.spotsLabel}>
            {comp.spotsLeft > 0 ? `Only ${comp.spotsLeft} spots left` : 'No spots left'}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: spotsBarWidth }]} />
          </View>
          <Text style={styles.spotsSub}>
            {comp.bookedSpots} / {comp.totalSpots} Booked
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Judge</Text>
          <Text style={styles.judgeName}>{comp.judge?.name}</Text>
          <Text style={styles.judgeMeta}>{comp.judge?.title}</Text>
          <Text style={styles.judgeMeta}>{comp.judge?.experience}</Text>
          {!!comp.judge?.videoUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(comp.judge.videoUrl)}>
              <Text style={styles.link}>▶ Watch intro video</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>Registration closes in</Text>
          <Text style={styles.countdownValue}>{formatCountdown(countdown)}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Important Dates</Text>
          <View style={styles.dateGrid}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Register Before</Text>
              <Text style={styles.dateValue}>{formatDate(comp.registerBefore)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Submission Starts</Text>
              <Text style={styles.dateValue}>{formatDate(comp.submissionStart)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Submission Ends</Text>
              <Text style={styles.dateValue}>{formatDate(comp.submissionEnd)}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Result Date</Text>
              <Text style={styles.dateValue}>{formatDate(comp.resultDate)}</Text>
            </View>
          </View>
        </View>

        {comp.previousWinners?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Previous Winners</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {comp.previousWinners.map((w, i) => (
                <View key={i} style={styles.winnerItem}>
                  <View style={styles.winnerAvatar} />
                  <Text style={styles.winnerName} numberOfLines={1}>{w.name}</Text>
                  <Text style={styles.winnerPosition}>{w.position}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.tabRow}>
            {TABS.map((t) => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={styles.tabButton}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
                {tab === t && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.tabContent}>{tabContent[tab]}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Rewards (All Positions)</Text>
          {(comp.rewards || []).map((r, i) => (
            <View key={i} style={styles.rewardRow}>
              <Text style={styles.rewardPosition}>{r.position}</Text>
              <Text style={styles.rewardAmount}>₹{r.amount}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>{renderActionButton()}</View>

      <Modal visible={submitModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.sectionLabel}>Upload your submission</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Paste a link to your video/entry"
              autoCapitalize="none"
              value={submissionUrl}
              onChangeText={setSubmissionUrl}
            />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSubmitModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleSubmit} disabled={busy}>
                <Text style={styles.actionButtonText}>{busy ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { padding: 16 },
  back: { color: colors.text, fontWeight: '600', fontSize: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  badge: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  tagsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tag: { backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { color: colors.subtext, fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 40, marginTop: 16 },
  statLabel: { color: colors.subtext, fontSize: 12, marginBottom: 4 },
  statValue: { color: colors.primary, fontSize: 20, fontWeight: '700' },
  spotsLabel: { color: colors.subtext, marginTop: 16, marginBottom: 6, fontSize: 13 },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: colors.primary },
  spotsSub: { color: colors.subtext, fontSize: 12, marginTop: 6 },
  sectionLabel: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 15 },
  judgeName: { fontSize: 16, fontWeight: '700', color: colors.text },
  judgeMeta: { color: colors.subtext, marginTop: 2 },
  link: { color: colors.primary, fontWeight: '600', marginTop: 10 },
  countdownCard: {
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  countdownLabel: { color: colors.primary, fontWeight: '600' },
  countdownValue: { color: colors.primary, fontWeight: '700', fontSize: 16 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dateItem: { width: '45%', marginBottom: 12 },
  dateLabel: { color: colors.subtext, fontSize: 12 },
  dateValue: { color: colors.text, fontWeight: '700', marginTop: 4 },
  winnerItem: { alignItems: 'center', marginRight: 16, width: 80 },
  winnerAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.border, marginBottom: 6 },
  winnerName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  winnerPosition: { fontSize: 11, color: colors.primary, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 20, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { paddingBottom: 10 },
  tabText: { color: colors.subtext, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  tabUnderline: { height: 2, backgroundColor: colors.primary, marginTop: 6, borderRadius: 1 },
  tabContent: { color: colors.text, lineHeight: 20 },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.background
  },
  rewardPosition: { color: colors.text, fontWeight: '600' },
  rewardAmount: { color: colors.primary, fontWeight: '700' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  actionButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  actionButtonDisabled: { backgroundColor: colors.subtext },
  actionButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: colors.white, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    marginTop: 4
  },
  modalRow: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center'
  },
  modalCancelText: { color: colors.text, fontWeight: '600' },
  modalSubmit: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' }
});
