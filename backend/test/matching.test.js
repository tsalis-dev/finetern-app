const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateMatch } = require('../src/utils/matching');
const req = (skill_id,importance='wajib',weight=1,min_proficiency=100) => ({ skill_id,nama_skill:'Skill '+skill_id,importance,weight,min_proficiency });

test('weighted matching caps excess proficiency and treats missing proof as zero', () => {
  const result = calculateMatch([req(1,'wajib',60,70),req(2,'nilai_tambah',40,80)],[{ id:1,proficiency:90 },{ id:2,proficiency:40 }]);
  assert.equal(result.match_rate,80); assert.equal(result.mandatory_met,true); assert.equal(result.eligible,true);
  assert.equal(result.requirements[1].missing_points,40);
  assert.equal(calculateMatch([req(1),req(2)],[]).match_rate,0);
  assert.equal(calculateMatch([req(1)],[{ id:1,proficiency:999 }]).match_rate,100);
});
test('high total score cannot bypass an unmet mandatory requirement', () => {
  const result = calculateMatch([req(1,'wajib',60,70),req(2,'nilai_tambah',40,80)],[{ id:1,proficiency:69 },{ id:2,proficiency:100 }]);
  assert.ok(result.match_rate>80); assert.equal(result.mandatory_met,false); assert.equal(result.eligible,false);
});
test('threshold uses a conservative displayed score; empty or invalid requirements never qualify', () => {
  const result = calculateMatch([req(1,'nilai_tambah')],[{ id:1,proficiency:79.999 }]);
  assert.equal(result.match_rate,79.99); assert.equal(result.eligible,false);
  for (const requirements of [[],[req(1,'wajib',0)],[req(1,'wajib',1,0)],[req(1,'unknown')]]) {
    assert.equal(calculateMatch(requirements,[{ id:1,proficiency:100 }]).eligible,false);
  }
});
