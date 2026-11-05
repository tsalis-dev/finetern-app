import React, { useCallback, useRef, useState } from 'react';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosClient';
import FormScreen from '../../components/common/FormScreen';
import PrimaryButton from '../../components/common/PrimaryButton';
import AppIcon from '../../components/common/AppIcon';
import { learningStatuses, quizRequest } from '../../utils/learning';
import { colors } from '../../utils/theme';

export default function LearningModuleScreen({ route, navigation }) {
  const id = route.params.id;
  const [data, setData] = useState(null), [answers, setAnswers] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const attemptKey = useRef(null);
  const load = useCallback(async () => { const result = await api.get('/ai/modules/' + id); setData(result.data); }, [id]);
  useFocusEffect(useCallback(() => { let active = true; api.get('/ai/modules/' + id).then(result => { if (active) { setData(result.data); setError(''); } }).catch(failure => { if (active) setError(failure.message); }); return () => { active = false; }; }, [id]));
  const submit = async () => {
    setError(''); setMessage('');
    if (!attemptKey.current) attemptKey.current = 'quiz-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
    let body; try { body = quizRequest(answers, data.quiz.length, attemptKey.current); } catch (failure) { setError(failure.message); return; }
    setBusy(true);
    try { await api.post('/ai/modules/' + id + '/assessments', body); attemptKey.current = null; setMessage('Hasil latihan tercatat. Nilai keterampilan tervalidasi tidak berubah dari hasil kuis.'); await load(); }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  };
  const content = data?.content;
  return <FormScreen onBack={() => navigation.goBack()} backDisabled={busy} header={<View style={styles.hero}>
    <View style={styles.heroTop}><View style={styles.bookIcon}><AppIcon name="book" size={23} /></View><Text style={styles.eyebrow}>RUANG BELAJAR</Text></View>
    <Text style={styles.title}>{data?.title || 'Modul belajar'}</Text>
    <Text style={styles.skill}>{data ? data.nama_skill + ' · ' + learningStatuses[data.generation_status] : 'Memuat materi…'}</Text>
    {content ? <View style={styles.meta}><View style={styles.metaItem}><AppIcon name="clock" size={15} /><Text style={styles.metaLabel}>{data.estimated_minutes} menit</Text></View><View style={styles.metaItem}><AppIcon name="book" size={15} /><Text style={styles.metaLabel}>{content.sections.length} bagian</Text></View><Text style={styles.metaLabel}>{data.quiz.length} soal latihan</Text></View> : null}
  </View>}>
    {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    {message ? <Text accessibilityLiveRegion="polite" style={styles.notice}>{message}</Text> : null}
    {data?.source_context ? <View style={styles.context}><View style={styles.contextIcon}><AppIcon name="briefcase" size={19} /></View><View style={styles.contextCopy}><Text style={styles.contextLabel}>BEKAL UNTUK MAGANG</Text><Text style={styles.contextTitle}>{data.source_context.vacancy.title}</Text><Text style={styles.caption}>Saat materi dibuat: nilai {data.source_context.skill.current_proficiency} → target {data.source_context.skill.target_proficiency}/100.</Text></View></View> : null}
    {data?.generation_status === 'generating' ? <Text style={styles.body}>Gemini masih menyiapkan materi. Muat ulang beberapa saat lagi; tidak perlu membuat permintaan baru.</Text> : null}
    {data?.generation_status === 'failed' ? <Text style={styles.body}>Materi ini belum berhasil disiapkan. Kembali ke kebutuhan lowongan untuk mencoba lagi jika masih diperlukan.</Text> : null}
    {data?.legacy ? <Text selectable style={styles.body}>{data.legacy_content || 'Modul lama belum memakai format belajar dan kuis terbaru.'}</Text> : null}
    {content ? <>
      <View style={styles.section}><Text style={styles.heading}>Yang akan kamu pelajari</Text><View style={styles.objectives}>{content.objectives.map((objective, index) => <View key={index} style={styles.objective}><View style={styles.check}><AppIcon name="check" size={13} /></View><Text style={[styles.body, styles.flex]}>{objective}</Text></View>)}</View></View>
      <View style={styles.sectionHeading}><Text style={styles.heading}>Materi inti</Text><Text style={styles.caption}>Dibuat dengan Gemini. Diskusikan dengan guru jika ada bagian yang meragukan.</Text></View>
      {content.sections.map((section, index) => <View key={index} style={styles.card}><View style={styles.sectionTop}><Text style={styles.sectionNumber}>{String(index + 1).padStart(2, '0')}</Text><Text style={[styles.cardTitle, styles.flex]}>{section.title}</Text></View><Text selectable style={styles.body}>{section.body}</Text></View>)}
      <View style={styles.project}><View style={styles.sectionTop}><AppIcon name="folder" size={22} /><Text style={styles.projectLabel}>SAATNYA MENCOBA</Text></View><Text style={styles.heading}>{content.miniProject.title}</Text><Text selectable style={styles.body}>{content.miniProject.instructions}</Text><Text style={styles.cardTitle}>Pastikan karyamu mencakup:</Text>{content.miniProject.criteria.map((criterion, index) => <View key={index} style={styles.objective}><AppIcon name="check" size={16} color={colors.accentWarmText} /><Text style={[styles.body, styles.flex]}>{criterion}</Text></View>)}<PrimaryButton title="Ajukan bukti mini proyek" disabled={busy} onPress={() => navigation.navigate('PortfolioForm', { skillId: data.skill_id, suggestedTitle: content.miniProject.title })} /></View>
      <View style={styles.sectionHeading}><Text style={styles.heading}>Uji pemahamanmu</Text><Text style={styles.body}>Tiga soal untuk berlatih. Nilai lulus minimal 80, jadi ketiganya perlu benar. Kamu boleh mengulang.</Text><Text style={styles.quizNote}>Nilai kuis tidak mengubah nilai keterampilan dari guru.</Text></View>
      {data.quiz.map((question, index) => <View key={question.id} style={styles.card}><Text style={styles.questionLabel}>SOAL {index + 1} DARI {data.quiz.length}</Text><Text style={styles.cardTitle}>{question.question}</Text>{question.options.map((option, optionIndex) => <Pressable key={optionIndex} accessibilityRole="radio" accessibilityState={{ checked: answers[index] === optionIndex }} disabled={busy} style={[styles.option, answers[index] === optionIndex && styles.selected]} onPress={() => { setAnswers(current => { const next = [...current]; next[index] = optionIndex; return next; }); attemptKey.current = null; }}><View style={[styles.optionLetter, answers[index] === optionIndex && styles.selectedLetter]}><Text style={[styles.letterText, answers[index] === optionIndex && styles.selectedLetterText]}>{String.fromCharCode(65 + optionIndex)}</Text></View><Text style={[styles.body, styles.flex]}>{option}</Text></Pressable>)}</View>)}
      <PrimaryButton title="Periksa jawaban latihan" onPress={submit} loading={busy} />
      {data.last_attempt ? <View style={styles.card}><View style={styles.sectionHeading}><Text style={styles.questionLabel}>HASIL LATIHAN TERAKHIR</Text><Text style={styles.score}>{data.last_attempt.score}<Text style={styles.scoreUnit}>/100</Text></Text></View><Text style={styles.body}>{data.last_attempt.passed ? 'Latihan selesai dengan nilai lulus.' : 'Pelajari kembali bagian yang perlu ditingkatkan, lalu coba latihan lagi.'} Nilai terbaik {data.progress.best_score}/100 dari {data.progress.attempt_count} latihan.</Text>{data.last_attempt.feedback.map((item, index) => <View key={item.questionId} style={styles.feedback}><Text style={styles.cardTitle}>Soal {index + 1}: {item.isCorrect ? 'Benar' : 'Perlu dipelajari lagi'}</Text><Text style={styles.body}>Jawaban yang tepat: {String.fromCharCode(65 + item.correctIndex)}. {data.quiz[index].options[item.correctIndex]}</Text><Text style={styles.body}>{item.explanation}</Text></View>)}</View> : null}
    </> : null}
    <PrimaryButton title="Muat ulang modul" variant="outline" disabled={busy} onPress={async () => { setError(''); try { await load(); } catch (failure) { setError(failure.message); } }} />
  </FormScreen>;
}
const styles = StyleSheet.create({
  hero: { gap: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookIcon: { alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.textPrimary, fontSize: 28, lineHeight: 36, fontWeight: '700', letterSpacing: -0.6 },
  skill: { color: colors.primary, fontSize: 12, lineHeight: 19, fontWeight: '500' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaLabel: { color: colors.primary, fontSize: 11, lineHeight: 17 },
  context: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, paddingVertical: 16 },
  contextIcon: { paddingTop: 2 },
  contextCopy: { flex: 1, gap: 5 },
  contextLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  contextTitle: { color: colors.textPrimary, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 12, color: colors.textMuted, lineHeight: 19 },
  section: { gap: 15 },
  heading: { color: colors.textPrimary, fontSize: 20, lineHeight: 27, fontWeight: '700', letterSpacing: -0.3 },
  objectives: { gap: 12 },
  objective: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  check: { width: 18, height: 26, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 26 },
  sectionHeading: { gap: 8 },
  card: { paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border, gap: 16 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionNumber: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: 17, lineHeight: 26, fontWeight: '600' },
  project: { backgroundColor: colors.accentWarm, borderLeftWidth: 3, borderColor: colors.accentWarmText, padding: 18, borderRadius: 10, gap: 16 },
  projectLabel: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  quizNote: { fontSize: 12, lineHeight: 19, color: colors.primary, borderLeftWidth: 2, borderColor: colors.primaryBorder, paddingLeft: 12 },
  questionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.primary },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, padding: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  selected: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  optionLetter: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated },
  selectedLetter: { backgroundColor: colors.primary },
  letterText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  selectedLetterText: { color: colors.white },
  score: { fontSize: 35, fontWeight: '700', color: colors.primary },
  scoreUnit: { fontSize: 16, fontWeight: '400', color: colors.textMuted },
  feedback: { gap: 10, paddingTop: 18, borderTopWidth: 1, borderColor: colors.surfaceElevated },
  notice: { color: colors.primary, lineHeight: 22 },
  error: { color: colors.error, lineHeight: 22 },
});
