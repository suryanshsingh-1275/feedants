import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { createCompetition } from '../api';
import { colors } from '../theme';

// Simple date input as text: "YYYY-MM-DD HH:MM" — kept as plain text fields
// rather than a native date picker to avoid extra dependencies.
export default function CreateCompetitionScreen({ onCreated, onBack }) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [prizePool, setPrizePool] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [totalSpots, setTotalSpots] = useState('');
  const [registerBefore, setRegisterBefore] = useState('');
  const [submissionStart, setSubmissionStart] = useState('');
  const [submissionEnd, setSubmissionEnd] = useState('');
  const [resultDate, setResultDate] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [judgingParams, setJudgingParams] = useState('');
  const [rulesEligibility, setRulesEligibility] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [judgeTitle, setJudgeTitle] = useState('');
  const [busy, setBusy] = useState(false);

 const handleCreate = async () => {
  console.log('Create button clicked', { title, prizePool, entryFee, totalSpots, registerBefore, submissionStart, submissionEnd, resultDate });

  if (!title || !prizePool || !entryFee || !totalSpots || !registerBefore || !submissionStart || !submissionEnd || !resultDate) {
    console.error('VALIDATION FAILED — a required field is empty. Check the values logged above.');
    Alert.alert('Missing fields', 'Fill in title, fees, spots, and all four dates');
    return;
  }

  const parseDate = (s) => new Date(s.replace(' ', 'T') + ':00');

  setBusy(true);
  try {
    const payload = {
      title,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      prizePool: Number(prizePool),
      entryFee: Number(entryFee),
      totalSpots: Number(totalSpots),
      registerBefore: parseDate(registerBefore),
      submissionStart: parseDate(submissionStart),
      submissionEnd: parseDate(submissionEnd),
      resultDate: parseDate(resultDate),
      aboutText,
      judgingParams,
      rulesEligibility,
      judge: { name: judgeName, title: judgeTitle }
    };
    console.log('Sending payload:', payload);

    const result = await createCompetition(payload);
    console.log('SUCCESS:', result);
    Alert.alert('Created', 'Your competition is live.');
    onCreated();
  } catch (err) {
    console.error('CREATE FAILED:', err.message);
    Alert.alert('Could not create competition', err.message);
  } finally {
    setBusy(false);
  }
};

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.back}>← Go back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Create Competition</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Feedants Singing Contest" />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Music, Multi-Win" />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Prize Pool (₹)</Text>
          <TextInput style={styles.input} value={prizePool} onChangeText={setPrizePool} keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Entry Fee (₹)</Text>
          <TextInput style={styles.input} value={entryFee} onChangeText={setEntryFee} keyboardType="numeric" />
        </View>
      </View>

      <Text style={styles.label}>Total Spots</Text>
      <TextInput style={styles.input} value={totalSpots} onChangeText={setTotalSpots} keyboardType="numeric" placeholder="20" />

      <Text style={styles.sectionLabel}>Dates (format: YYYY-MM-DD HH:MM, 24hr)</Text>

      <Text style={styles.label}>Register Before</Text>
      <TextInput style={styles.input} value={registerBefore} onChangeText={setRegisterBefore} placeholder="2026-10-10 23:00" />

      <Text style={styles.label}>Submission Starts</Text>
      <TextInput style={styles.input} value={submissionStart} onChangeText={setSubmissionStart} placeholder="2026-10-11 00:00" />

      <Text style={styles.label}>Submission Ends</Text>
      <TextInput style={styles.input} value={submissionEnd} onChangeText={setSubmissionEnd} placeholder="2026-10-25 23:00" />

      <Text style={styles.label}>Result Date</Text>
      <TextInput style={styles.input} value={resultDate} onChangeText={setResultDate} placeholder="2026-10-28 00:00" />

      <Text style={styles.sectionLabel}>Judge (optional)</Text>
      <Text style={styles.label}>Judge Name</Text>
      <TextInput style={styles.input} value={judgeName} onChangeText={setJudgeName} />
      <Text style={styles.label}>Judge Title</Text>
      <TextInput style={styles.input} value={judgeTitle} onChangeText={setJudgeTitle} />

      <Text style={styles.sectionLabel}>Content</Text>
      <Text style={styles.label}>About</Text>
      <TextInput style={[styles.input, styles.multiline]} value={aboutText} onChangeText={setAboutText} multiline />

      <Text style={styles.label}>Judging Parameters</Text>
      <TextInput style={[styles.input, styles.multiline]} value={judgingParams} onChangeText={setJudgingParams} multiline />

      <Text style={styles.label}>Rules & Eligibility</Text>
      <TextInput style={[styles.input, styles.multiline]} value={rulesEligibility} onChangeText={setRulesEligibility} multiline />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Creating...' : 'Create Competition'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  back: { color: colors.text, fontWeight: '600', fontSize: 16, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 16 },
  sectionLabel: { fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  label: { color: colors.subtext, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    backgroundColor: colors.white
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 16 }
});