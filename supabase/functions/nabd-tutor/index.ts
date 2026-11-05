import {handleTutor} from './handler.mjs';
export {handleTutor};
if(typeof Deno!=='undefined')Deno.serve(request=>handleTutor(request,Deno.env.get.bind(Deno.env)));
