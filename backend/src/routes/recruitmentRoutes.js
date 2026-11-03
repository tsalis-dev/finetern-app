const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const { objectBody } = require('./authRoutes');
const jobs = require('../services/vacancyService');
const applications = require('../services/applicationService');
const v = require('../utils/validation');
const vacancyRouter = express.Router(), applicationRouter = express.Router();
const respond = (res,data,message='Data rekrutmen.',status=200) => res.status(status).json({ success:true,message,data });
for (const router of [vacancyRouter,applicationRouter]) router.use(verifyToken,(req,res,next)=>{ jobs.requireAccess(req.user); next(); });

vacancyRouter.get('/skills',async (req,res)=>respond(res,await jobs.skills(req.user)));
vacancyRouter.get('/mine',async (req,res)=>respond(res,await jobs.mine(req.user,req.query)));
vacancyRouter.get('/',async (req,res)=>respond(res,await jobs.catalog(req.user,req.query)));
vacancyRouter.post('/',objectBody,async (req,res)=>respond(res,await jobs.save(req.user.id,null,req.body),'Lowongan diterbitkan.',201));
vacancyRouter.get('/:id',async (req,res)=>respond(res,await jobs.detail(req.user,v.id(req.params.id))));
vacancyRouter.patch('/:id',objectBody,async (req,res)=>respond(res,await jobs.save(req.user.id,v.id(req.params.id),req.body),'Lowongan diperbarui.'));
vacancyRouter.patch('/:id/activity',objectBody,async (req,res)=>respond(res,await jobs.activity(req.user.id,v.id(req.params.id),req.body),'Status lowongan diperbarui.'));
vacancyRouter.post('/:id/apply',objectBody,async (req,res)=>respond(res,await applications.apply(req.user.id,v.id(req.params.id),req.body),'Lamaran tercatat.',201));

applicationRouter.get('/mine',async (req,res)=>respond(res,await applications.list(req.user,req.query,'student')));
applicationRouter.get('/industry',async (req,res)=>respond(res,await applications.list(req.user,req.query,'industry')));
applicationRouter.get('/school',async (req,res)=>respond(res,await applications.list(req.user,req.query,'school')));
applicationRouter.get('/:id',async (req,res)=>respond(res,await applications.detail(req.user,v.id(req.params.id))));
applicationRouter.post('/:id/review',objectBody,async (req,res)=>respond(res,await applications.review(req.user.id,v.id(req.params.id),req.body),'Keputusan seleksi tercatat.'));
applicationRouter.post('/:id/withdraw',objectBody,async (req,res)=>respond(res,await applications.withdraw(req.user.id,v.id(req.params.id),req.body),'Lamaran ditarik.'));
applicationRouter.get('/:id/evidence/:proofId',async (req,res)=>{
  const file = await applications.evidence(req.user,v.id(req.params.id),v.id(req.params.proofId));
  res.download(file.path,`bukti-lamaran-${req.params.id}.${file.extension}`);
});
module.exports = { vacancyRouter,applicationRouter };
