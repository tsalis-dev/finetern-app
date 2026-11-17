import {useCallback,useRef,useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import api from '../api/axiosClient';

export default function useApplicationDetail(id) {
  const [data,setData]=useState(null);
  const [receipt,setReceipt]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const generation=useRef(0),locked=useRef(false);

  useFocusEffect(useCallback(()=>{
    const current=++generation.current;
    locked.current=true;setBusy(true);setError('');setMessage('');setData(null);setReceipt(null);
    api.get('/applications/'+id).then(result=>{
      if(current===generation.current)setData(result.data);
    }).catch(failure=>{
      if(current===generation.current)setError(failure.message);
    }).finally(()=>{
      if(current===generation.current){locked.current=false;setBusy(false);}
    });
    return()=>{generation.current++;locked.current=false;};
  },[id]));

  const run=async task=>{
    if(locked.current)return;
    locked.current=true;setBusy(true);setError('');setMessage('');
    const current=generation.current;
    try {return await task(current);}
    catch(failure){if(current===generation.current)setError(failure.message);}
    finally{if(current===generation.current){locked.current=false;setBusy(false);}}
  };
  const load=async current=>{
    const result=await api.get('/applications/'+id);
    if(current===generation.current){setData(result.data);setReceipt(null);}
  };
  const mutate=(action,body,success)=>run(async current=>{
    const result=await api.post('/applications/'+id+'/'+action,body);
    if(current!==generation.current)return;
    // A committed change must never leave stale action permissions visible if reloading fails.
    setReceipt({...result.data,vacancy:data.vacancy});setData(null);setMessage(success);
    try {await load(current);}
    catch(failure){
      if(current===generation.current)setError('Perubahan sudah tersimpan, tetapi rincian terbaru belum dapat dimuat. '+failure.message);
    }
    return true;
  });
  return {data,receipt,busy,error,message,run,mutate,refresh:()=>run(load)};
}
