const MINIMUM_MATCH = 80;

function calculateMatch(requirements, skills) {
  const valid = requirements.length>0 && requirements.length<=20 && requirements.every(row =>
    Number.isInteger(row.weight) && row.weight>=1 && row.weight<=100 &&
    Number.isInteger(row.min_proficiency) && row.min_proficiency>=1 && row.min_proficiency<=100 &&
    ['wajib', 'nilai_tambah'].includes(row.importance));
  if (!valid) return { valid: false, match_rate: 0, minimum_match: MINIMUM_MATCH, mandatory_met: false, eligible: false, requirements: [] };
  const scores = new Map(skills.map(skill => [skill.id, Math.max(0, Math.min(100, Number(skill.proficiency) || 0))]));
  let achieved = 0, weight = 0;
  const details = requirements.map(row => {
    const current = scores.get(row.skill_id) || 0;
    achieved += Math.min(1, current/row.min_proficiency)*row.weight;
    weight += row.weight;
    return { skill_id: row.skill_id, nama_skill: row.nama_skill, importance: row.importance, weight: row.weight,
      min_proficiency: row.min_proficiency, current_proficiency: current, missing_points: Math.max(0,row.min_proficiency-current), meets_requirement: current>=row.min_proficiency };
  });
  // Hindari pembulatan ke atas yang membuka akses bagi skor di bawah ambang 80%.
  const matchRate = Math.floor((100*achieved/weight + 1e-10)*100)/100;
  const mandatoryMet = details.every(row => row.importance !== 'wajib' || row.meets_requirement);
  return { valid: true, match_rate: matchRate, minimum_match: MINIMUM_MATCH, mandatory_met: mandatoryMet,
    eligible: matchRate>=MINIMUM_MATCH && mandatoryMet, requirements: details };
}

module.exports = { calculateMatch, MINIMUM_MATCH };
