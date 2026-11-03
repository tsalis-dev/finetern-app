const express=require('express');
const {rateLimit}=require('express-rate-limit');
const {verifyToken}=require('../middlewares/authMiddleware');
const {objectBody}=require('./authRoutes');
const jobs=require('../services/vacancyService');
const learning=require('../services/learningService');
const v=require('../utils/validation');
const router=express.Router();
const respond=(res,data,message='Data belajar.',status=200)=>res.status(status).json({success:true,message,data});
router.use(verifyToken,(req,res,next)=>{jobs.requireAccess(req.user,'siswa');next();});
// shortcut: limiter HTTP per proses; kuota generasi berbayar tetap diserialkan dan dihitung di database.
const limit=count=>rateLimit({limit:count,windowMs:15*60*1000,keyGenerator:req=>String(req.user.id),standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,message:'Terlalu banyak permintaan belajar. Coba lagi setelah beberapa saat.',data:{}}});
router.get('/gaps/:vacancyId',async(req,res)=>respond(res,await learning.gaps(req.user,v.id(req.params.vacancyId))));
router.get('/modules',async(req,res)=>respond(res,await learning.list(req.user,req.query)));
router.post('/generate-sprint',limit(20),objectBody,async(req,res)=>{
  const data=await learning.generate(req.user.id,req.body);
  respond(res,data,data.generation_status==='ready'?'Modul belajar tersedia.':'Materi masih disiapkan.',data.reused?(data.generation_status==='ready'?200:202):201);
});
router.get('/modules/:id',async(req,res)=>respond(res,await learning.detail(req.user,v.id(req.params.id))));
router.post('/modules/:id/assessments',limit(30),objectBody,async(req,res)=>respond(res,await learning.submitQuiz(req.user.id,v.id(req.params.id),req.body),'Hasil latihan tercatat.'));
router.use((error,req,res,next)=>{
  if(!error.publicMessage||!/^AI_[A-Z_]+$/.test(error.code||''))return next(error);
  res.status(error.statusCode).json({success:false,message:error.publicMessage,data:{code:error.code}});
});
module.exports=router;
